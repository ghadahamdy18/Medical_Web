/**
 * Simple client-side route guards — NOT a substitute for backend authorization.
 *
 * Requires api.js BEFORE this file so getToken()/getCurrentRole() globals exist.
 */

(function (global) {
    /** Public login entry (relative HTML path from current folder). */
    function getLoginPath() {
        if (typeof global.labResolveLoginHref === 'function') {
            return global.labResolveLoginHref();
        }
        return 'index.html';
    }

    /** Role-specific dashboards — actual files live at `frontend/pages/<role>/dashboard.html`. */
    function getDashboardPath(role) {
        if (typeof global.labResolveDashboardHref === 'function')
            return global.labResolveDashboardHref(role);
        return 'pages/' + String(role || 'patient').toLowerCase() + '/dashboard.html';
    }

    /**
     * Sends anonymous visitors to landing page.
     * @returns {boolean} true continues render, false means redirect underway
     */
    function requireAuth() {
        if (typeof global.getToken !== 'function') {
            console.error('guards.js: load api.js first.');
            global.location.href = getLoginPath();
            return false;
        }

        if (!global.getToken()) {
            global.location.href = getLoginPath();
            return false;
        }
        return true;
    }

    function normalizeRoles(allowedRoles) {
        var list = allowedRoles === undefined ? [] : allowedRoles === null ? [] : allowedRoles;
        if (!Array.isArray(list)) list = [list];
        return list.map(function (r) {
            return String(r || '').toLowerCase();
        });
    }

    /**
     * @param {'admin'|'doctor'|'patient'|'receptionist'|(string|string[])} allowedRoles
     * Pass one role string OR an array OR multiple args not supported — wrap array manually.
     */
    function requireRole(allowedRoles) {
        var allowed = normalizeRoles(allowedRoles);

        if (typeof global.getToken !== 'function' || !global.getToken()) {
            global.location.href = getLoginPath();
            return false;
        }

        var current = '';
        if (typeof global.getCurrentRole === 'function')
            current = String(global.getCurrentRole() || '').toLowerCase();

        if (!current) {
            global.location.href = getLoginPath();
            return false;
        }

        var ok = allowed.indexOf(current) !== -1;

        if (!ok) {
            /** Wrong role landing — send them HOME for their OWN workspace */
            global.location.href = getDashboardPath(current || 'patient');
            return false;
        }

        return true;
    }

    /** Visiting marketing/login page while JWT still valid — kicks into workspace */
    function redirectIfLoggedIn() {
        if (typeof global.getToken !== 'function' || !global.getToken()) return;
        var role = typeof global.getCurrentRole === 'function' ? global.getCurrentRole() : null;
        if (!role) return;
        global.location.replace(getDashboardPath(role));
    }

    global.getLoginPath = getLoginPath;
    global.getDashboardPath = getDashboardPath;
    global.requireAuth = requireAuth;
    global.requireRole = requireRole;
    global.redirectIfLoggedIn = redirectIfLoggedIn;
})(typeof window !== 'undefined' ? window : this);
