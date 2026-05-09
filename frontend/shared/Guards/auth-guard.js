const authGuard = {
    check() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../../../index.html';
            return false;
        }
        return true;
    },

    requireAuth(callback) {
        if (!this.check()) return;
        callback();
    },

    getUser() {
        return authService.getUser();
    },

    refreshUser() {
        const user = authService.getUser();
        if (!user) {
            this.check();
        }
        return user;
    }
};

window.authGuard = authGuard;