const roleGuard = {
    allowedRoles: ['patient', 'doctor', 'admin', 'receptionist'],

    check(allowedRoles) {
        const user = authService.getUser();
        if (!user) {
            window.location.href = '../../../index.html';
            return false;
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
            window.location.href = '../../../pages/errors/403.html';
            return false;
        }

        return true;
    },

    requireRole(...roles) {
        return this.check(roles);
    },

    isPatient() {
        const user = authService.getUser();
        return user && user.role === 'patient';
    },

    isDoctor() {
        const user = authService.getUser();
        return user && user.role === 'doctor';
    },

    isAdmin() {
        const user = authService.getUser();
        return user && user.role === 'admin';
    },

    isReceptionist() {
        const user = authService.getUser();
        return user && user.role === 'receptionist';
    }
};

window.roleGuard = roleGuard;