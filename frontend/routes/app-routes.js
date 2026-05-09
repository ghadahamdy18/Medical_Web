const APP_ROUTES = {
    HOME: '../index.html',

    PATIENT: {
        DASHBOARD: '../pages/patient/dashboard.html',
        APPOINTMENTS: '../pages/patient/appointments.html',
        BOOK_APPOINTMENT: '../pages/patient/book-appointment.html',
        LAB_RESULTS: '../pages/patient/lab-results.html',
        PROFILE: '../pages/patient/profile.html',
        SETTINGS: '../pages/patient/settings.html',
        FAMILY_MEMBERS: '../pages/patient/family-members.html'
    },

    DOCTOR: {
        DASHBOARD: '../pages/doctor/dashboard.html',
        PATIENT_LIST: '../pages/doctor/patient-list.html',
        APPOINTMENTS: '../pages/doctor/appointments.html',
        UPLOAD_RESULTS: '../pages/doctor/upload-results.html',
        SETTINGS: '../pages/doctor/settings.html'
    },

    ADMIN: {
        DASHBOARD: '../pages/admin/dashboard.html',
        USER_MANAGEMENT: '../pages/admin/user-management.html',
        APPOINTMENTS: '../pages/admin/appointments.html'
    },

    RECEPTIONIST: {
        DASHBOARD: '../pages/receptionist/dashboard.html',
        WALKIN_REGISTER: '../pages/receptionist/walkin-register.html'
    },

    ERRORS: {
        NOT_FOUND: '../pages/errors/404.html',
        FORBIDDEN: '../pages/errors/403.html',
        SERVER_ERROR: '../pages/errors/500.html'
    }
};

window.APP_ROUTES = APP_ROUTES;

function navigateTo(route) {
    window.location.href = route;
}

function redirectBasedOnRole() {
    const user = typeof authService !== 'undefined' && authService ? authService.getUser() : null;
    if (!user) {
        navigateTo(APP_ROUTES.HOME);
        return;
    }

    switch (user.role) {
        case 'patient':
            navigateTo(APP_ROUTES.PATIENT.DASHBOARD);
            break;
        case 'doctor':
            navigateTo(APP_ROUTES.DOCTOR.DASHBOARD);
            break;
        case 'admin':
            navigateTo(APP_ROUTES.ADMIN.DASHBOARD);
            break;
        case 'receptionist':
            navigateTo(APP_ROUTES.RECEPTIONIST.DASHBOARD);
            break;
        default:
            navigateTo(APP_ROUTES.HOME);
    }
}
