/**
 * Small UI helpers for plain HTML pages.
 *
 * Intended load order: api.js → ui.js → auth.js → guards.js
 */

(function (global) {
    const TOAST_ID = 'lab-toast-banner';

    function ensureToast() {
        var el = document.getElementById(TOAST_ID);
        if (el) return el;
        el = document.createElement('div');
        el.id = TOAST_ID;
        el.style.cssText =
            'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);' +
            'max-width:min(90vw,420px);z-index:12000;display:none;padding:14px 20px;' +
            'border-radius:8px;font-size:15px;line-height:1.4;box-shadow:0 8px 24px rgba(0,0,0,.12);';
        document.body.appendChild(el);
        return el;
    }

    var CLASS_BY_TYPE = {
        success: 'alert alert-success',
        info: 'alert alert-info',
        warn: 'alert alert-warning',
        error: 'alert alert-error',
    };

    /**
     * @param {string} message plain text toast
     * @param {'success'|'info'|'warn'|'error'} type
     * @param {number} ttlMs 0 disables auto-hide
     */
    function showToast(message, type, ttlMs) {
        if (typeof type === 'undefined' || type === null) type = 'info';
        if (typeof ttlMs === 'undefined') ttlMs = 4200;

        var el = ensureToast();
        el.className = CLASS_BY_TYPE[type] || CLASS_BY_TYPE.info;
        el.textContent = message == null ? '' : String(message);
        el.style.display = 'block';

        if (el._ttl) clearTimeout(el._ttl);
        if (ttlMs > 0) {
            el._ttl = setTimeout(hideToast, ttlMs);
        }
    }

    function hideToast() {
        var el = document.getElementById(TOAST_ID);
        if (!el) return;
        el.style.display = 'none';
    }

    function showFatal(message) {
        if (typeof global.showToast === 'function')
            global.showToast(message || 'Something went wrong.', 'error', 6500);
        else global.alert(message || 'Something went wrong.');
    }

    global.showToast = showToast;
    global.hideToast = hideToast;
    global.showFatal = showFatal;
})(typeof window !== 'undefined' ? window : this);
