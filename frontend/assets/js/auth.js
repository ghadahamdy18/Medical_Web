/**
 * Auth flows — wired to POST /auth/login, /auth/register, /auth/logout,
 * PATCH /auth/change-password, GET /auth/me
 *
 * Requires: api.js (and optionally ui.js for prettier errors).
 */

(function (global) {
    /** Copy token/user/role JSON from API payload into storage. */
    function persistSuccessfulAuthPayload(payload) {
        if (!payload || typeof payload !== 'object') {
            throw new Error('Malformed auth response.');
        }
        var token = payload.token;
        if (!token) {
            throw new Error('Login response missing token.');
        }
        saveToken(token);
        saveCurrentUser(payload.user);
        if (payload.user && payload.user.role) {
            saveCurrentRole(String(payload.user.role));
        }
    }

    /**
     * @param {{ fullName:string, phoneNumber:string, password:string, email?: string, gender?: string, dateOfBirth?: string, nationalId?: string, address?: string }} data — matches Joi schema on backend
     */
    function registerPatient(data) {
        if (!data || !data.phoneNumber || !data.password || !data.fullName) {
            return Promise.reject(
                new Error('Registration requires fullName, phoneNumber, and password.')
            );
        }

        var body = Object.assign({}, data);

        return apiPost('/auth/register', body).then(function (res) {
            persistSuccessfulAuthPayload(res);
            var mustFlag = !!(res.user && res.user.mustChangePassword);
            redirectByRole(res.user, mustFlag);
            return res;
        });
    }

    /**
     * @param {string} phoneNumber
     * @param {string} password
     */
    function loginUser(phoneNumber, password) {
        if (!phoneNumber || !password) {
            return Promise.reject(new Error('Please enter phone number and password.'));
        }

        var body = { phoneNumber: String(phoneNumber).trim(), password: password };

        return apiPost('/auth/login', body).then(function (res) {
            persistSuccessfulAuthPayload(res);
            var must =
                typeof res.mustChangePassword === 'boolean'
                    ? res.mustChangePassword
                    : !!(res.user && res.user.mustChangePassword);

            redirectByRole(res.user, must);
            return res;
        });
    }

    function logoutUser() {
        var p = Promise.resolve();

        var hadToken = !!getToken();
        if (hadToken) {
            p = apiPost('/auth/logout', {}).catch(function () {
                /* Server may refuse invalid tokens — local cleanup remains mandatory. */
            });
        }

        return p.finally(function () {
            clearAuthData();
            if (typeof global.labResolveLoginHref === 'function') {
                global.location.href = global.labResolveLoginHref();
            } else {
                global.location.href = 'index.html';
            }
        });
    }

    function getMe() {
        return apiGet('/auth/me').then(function (res) {
            if (!res.user) throw new Error('Profile response missing user.');
            saveCurrentUser(res.user);
            saveCurrentRole(String(res.user.role));
            return res.user;
        });
    }

    function changePassword(currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            return Promise.reject(new Error('Missing password fields.'));
        }

        var body = {
            currentPassword: currentPassword,
            newPassword: newPassword,
            confirmPassword: newPassword,
        };

        return apiPatch('/auth/change-password', body).then(function (res) {
            return res;
        });
    }

    /**
     * Decide where user lands AFTER login/register.
     *
     * @param {object} user   stored user blob from backend
     * @param {boolean=} mustForceChange flag from `{ mustChangePassword }` OR user.mustChangePassword
     */
    function redirectByRole(user, mustForceChange) {
        var must =
            typeof mustForceChange === 'boolean'
                ? mustForceChange
                : !!(user && user.mustChangePassword);

        if (must && user) {
            global.location.href = resolveMustChangePasswordPath(user.role);
            return;
        }

        if (!user || !user.role) {
            global.location.href =
                typeof global.labResolveLoginHref === 'function'
                    ? global.labResolveLoginHref()
                    : 'index.html';
            return;
        }

        global.location.href =
            typeof global.labResolveDashboardHref === 'function'
                ? global.labResolveDashboardHref(user.role)
                : 'pages/patient/dashboard.html';
    }

    function resolveMustChangePasswordPath(role) {
        var prefix = global.labFrontend && global.labFrontend.computePathToFrontendRoot
            ? global.labFrontend.computePathToFrontendRoot()
            : '';

        var r = String(role || '').toLowerCase();

        if (r === 'patient')
            return prefix + 'pages/patient/settings.html#change-password';
        if (r === 'doctor')
            return prefix + 'pages/doctor/settings.html#change-password';

        return typeof global.labResolveDashboardHref === 'function'
            ? global.labResolveDashboardHref(r)
            : prefix + 'index.html';
    }

    /** Called from landing page modal — keeps inline HTML tiny */
    async function submitLandingLogin() {
        try {
            var phoneInput = document.getElementById('phone');
            var pwdInput = document.getElementById('password');

            await loginUser(phoneInput && phoneInput.value, pwdInput && pwdInput.value);
        } catch (err) {
            var msg = err && err.message ? err.message : 'Login failed.';
            if (typeof global.showToast === 'function')
                global.showToast(msg, 'error', 6000);
            else global.alert(msg);
        }
    }

    global.persistSuccessfulAuthPayload = persistSuccessfulAuthPayload;
    global.registerPatient = registerPatient;
    global.loginUser = loginUser;
    global.logoutUser = logoutUser;
    global.getMe = getMe;
    global.changePassword = changePassword;
    global.redirectByRole = redirectByRole;
    global.submitLandingLogin = submitLandingLogin;
})(typeof window !== 'undefined' ? window : this);
