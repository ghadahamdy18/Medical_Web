/**
 * Reusable API layer + local auth storage for plain HTML/CSS/JS frontends.
 *
 * Load BEFORE auth.js / guards.js.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Base URL — edit here only when deploying to another host/port
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL = 'http://localhost:5001/api';

window.API_BASE_URL = API_BASE_URL;

// ─────────────────────────────────────────────────────────────────────────────
// Frontend root relative URL
// Supports:
//   • Phase 3 layout: .../frontend/<role>/dashboard.html, .../frontend/auth/register.html
//   • Legacy:         .../frontend/pages/<role>/…
//   • Live Server with site root = `frontend/`: /<auth>/<file>.html
// ─────────────────────────────────────────────────────────────────────────────

function computePathToFrontendRoot() {
    let raw = window.location.pathname.replace(/\\/g, '/');
    try {
        raw = decodeURIComponent(raw);
    } catch (_) {
        /* ignore */
    }

    const segments = raw.split('/').filter(Boolean);

    const pagesIdx = segments.indexOf('pages');
    if (pagesIdx !== -1 && segments.length > pagesIdx + 1) {
        const afterPages = segments.slice(pagesIdx + 1);
        const depth = afterPages.length;
        return depth > 0 ? '../'.repeat(depth) : '';
    }

    const feIdx = segments.lastIndexOf('frontend');
    const relative = feIdx !== -1 ? segments.slice(feIdx + 1) : segments;

    if (relative.length <= 1) return '';

    const depthNoFile = relative.length - 1;
    return depthNoFile > 0 ? '../'.repeat(depthNoFile) : '';
}

window.labFrontend = window.labFrontend || {};
window.labFrontend.computePathToFrontendRoot = computePathToFrontendRoot;

function resolveLoginHref() {
    return computePathToFrontendRoot() + 'index.html';
}

/** First-login / forced password change (Phase 3). */
function resolveChangePasswordHref() {
    return computePathToFrontendRoot() + 'auth/change-password.html';
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage keys
// ─────────────────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'lab_token';
const USER_KEY = 'lab_user';
const ROLE_KEY = 'lab_role';

// ─────────────────────────────────────────────────────────────────────────────
// Token
// ─────────────────────────────────────────────────────────────────────────────

function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

function saveToken(token) {
    if (token == null) return;
    localStorage.setItem(TOKEN_KEY, String(token));
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// User (+ role mirrored for guards)
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveCurrentUser(user) {
    if (!user || typeof user !== 'object') {
        removeCurrentUser();
        removeCurrentRole();
        return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user.role != null) saveCurrentRole(String(user.role));
}

function removeCurrentUser() {
    localStorage.removeItem(USER_KEY);
}

function saveCurrentRole(role) {
    if (role == null || role === '') return;
    localStorage.setItem(ROLE_KEY, String(role));
}

function getCurrentRole() {
    try {
        const direct = localStorage.getItem(ROLE_KEY);
        if (direct) return direct;
        const u = getCurrentUser();
        return u && u.role != null ? String(u.role) : null;
    } catch {
        return null;
    }
}

function removeCurrentRole() {
    localStorage.removeItem(ROLE_KEY);
}

/** Clears token, user blob, mirrored role — call on logout / 401 expiry. */
function clearAuthData() {
    removeToken();
    removeCurrentUser();
    removeCurrentRole();
}

function navigateToLoginPageAfterUnauthorized() {
    clearAuthData();
    window.location.href = resolveLoginHref();
}

function buildAbsoluteApiUrl(endpoint) {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        return endpoint;
    }
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${path}`;
}

/**
 * Parses JSON safely. For non‑JSON bodies, throws with truncated text so you can debug.
 */
async function parseJsonResponse(response) {
    const raw = await response.text();
    if (!raw.trim()) return null;

    try {
        return JSON.parse(raw);
    } catch {
        const preview = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
        const err = new Error(preview || 'Could not parse response body.');
        err.statusCode = response.status;
        throw err;
    }
}
function collectErrorMessage(data, fallbackStatus) {
    if (!data || typeof data !== 'object') {
        return `Request failed (${fallbackStatus}). Try again later.`;
    }

    const errors = data.errors || data.details;

    if (Array.isArray(errors) && errors.length) {
        const parts = errors.map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item.message === 'string') return item.message;
            return '';
        }).filter(Boolean);

        if (parts.length) return parts.join(' ');
    }

    if (typeof data.message === 'string') return data.message;

    return `Request failed (${fallbackStatus}).`;
}

function normalizeEndpointTail(endpoint) {
    let tail = endpoint.split('?')[0];
    tail = tail.replace(/^https?:\/\/[^/]+/i, '');
    if (tail.startsWith(API_BASE_URL)) tail = tail.slice(API_BASE_URL.length);
    tail = tail.replace(/\\/g, '/');
    tail = tail.endsWith('/') ? tail.slice(0, -1) : tail;
    return tail;
}

/** 401 here means validation failure — not expired session cleanup. */
function shouldBypass401Redirect(endpoint) {
    const tail = normalizeEndpointTail(endpoint);
    return (
        tail.endsWith('/auth/login') ||
        tail.endsWith('/auth/register') ||
        tail.endsWith('/auth/logout')
    );
}

/**
 * Core fetch helper.
 *
 * Extra options besides standard fetch:
 *   skipAuthRedirect  — prevents global redirect on 401 (used for login/register attempts).
 */
async function apiRequest(endpoint, options = {}) {
    const { skipAuthRedirect, ...fetchOptions } = options;
    const url = buildAbsoluteApiUrl(endpoint);

    const headers = new Headers(fetchOptions.headers || {});

    const body = fetchOptions.body;
    if (!(body instanceof FormData)) {
        const method = (fetchOptions.method || 'GET').toUpperCase();
        const hasBody = body !== undefined && body !== null;
        if (hasBody && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
    }

    const token = getToken();
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    });

    const data =
        response.status === 204 || response.status === 205 ? null : await parseJsonResponse(response).catch(() => null);

    if (!response.ok) {
        const msg = collectErrorMessage(data, response.status);

        const isUnauthorized = response.status === 401;

        // Bad login/password should NOT wipe session + force navigation.
        const shouldInvalidateSessionGlobally =
            isUnauthorized &&
            !skipAuthRedirect &&
            !shouldBypass401Redirect(endpoint);

        if (shouldInvalidateSessionGlobally) {
            navigateToLoginPageAfterUnauthorized();
        }

        const err = new Error(msg);
        err.statusCode = response.status;
        err.payload = data;
        throw err;
    }

    return data;
}

async function apiGet(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'GET' });
}

async function apiPost(endpoint, data, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const body =
        data === undefined || data === null
            ? undefined
            : isFormData
              ? data
              : JSON.stringify(data);

    return apiRequest(endpoint, {
        ...options,
        method: 'POST',
        body,
    });
}

async function apiPatch(endpoint, data, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const body =
        data === undefined || data === null
            ? undefined
            : isFormData
              ? data
              : JSON.stringify(data);

    return apiRequest(endpoint, {
        ...options,
        method: 'PATCH',
        body,
    });
}

async function apiDelete(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'DELETE' });
}

function resolveDashboardHref(role) {
    const r = String(role || '').toLowerCase();
    const valid = ['admin', 'doctor', 'patient', 'receptionist'];
    if (!valid.includes(r)) return resolveLoginHref();

    const prefix = computePathToFrontendRoot();
    return `${prefix}pages/${r}/dashboard.html`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Global exports — plain‑script globals
// ─────────────────────────────────────────────────────────────────────────────

window.apiRequest = apiRequest;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPatch = apiPatch;
window.apiDelete = apiDelete;

window.getToken = getToken;
window.saveToken = saveToken;
window.removeToken = removeToken;

window.getCurrentUser = getCurrentUser;
window.saveCurrentUser = saveCurrentUser;
window.removeCurrentUser = removeCurrentUser;

window.getCurrentRole = getCurrentRole;
window.saveCurrentRole = saveCurrentRole;

window.clearAuthData = clearAuthData;

window.labResolveLoginHref = resolveLoginHref;
window.labResolveDashboardHref = resolveDashboardHref;
window.labResolveChangePasswordHref = resolveChangePasswordHref;
