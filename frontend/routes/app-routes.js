const APP_ROUTES = {
    HOME: '../../../index.html',
    
    PATIENT: {
        DASHBOARD: '../../patient/dashboard.html',
        APPOINTMENTS: '../../patient/appointments.html',
        BOOK_APPOINTMENT: '../../patient/book-appointment.html',
        LAB_RESULTS: '../../patient/lab-results.html',
        NOTIFICATIONS: '../../patient/notifications.html',
        PROFILE: '../../patient/profile.html',
        SETTINGS: '../../patient/settings.html',
        FAMILY_MEMBERS: '../../patient/family-members.html'
    },

    DOCTOR: {
        DASHBOARD: '../../doctor/dashboard.html',
        PATIENT_LIST: '../../doctor/patient-list.html',
        APPOINTMENTS: '../../doctor/appointments.html',
        UPLOAD_RESULTS: '../../doctor/upload-results.html',
        PATIENT_NOTES: '../../doctor/patient-notes.html',
        NOTIFICATIONS: '../../doctor/notifications.html',
        SETTINGS: '../../doctor/settings.html',
        LOGIN: '../../doctor/login.html',
        REQUEST_ACCESS: '../../doctor/request-access.html'
    },

    ADMIN: {
        DASHBOARD: '../../admin/dashboard.html',
        APPROVALS: '../../admin/approvals.html',
        USER_MANAGEMENT: '../../admin/user-management.html',
        APPOINTMENTS: '../../admin/appointments.html',
        NOTIFICATIONS: '../../admin/notifications.html',
        SYSTEM_SETTINGS: '../../admin/system-settings.html'
    },

    RECEPTIONIST: {
        DASHBOARD: '../../receptionist/dashboard.html',
        WALKIN_REGISTER: '../../receptionist/walkin-register.html',
        QUEUE_MANAGEMENT: '../../receptionist/queue-management.html',
        PRINT_RESULTS: '../../receptionist/print-results.html'
    },

    ERRORS: {
        NOT_FOUND: '../../errors/404.html',
        FORBIDDEN: '../../errors/403.html',
        SERVER_ERROR: '../../errors/500.html'
    }
};

window.APP_ROUTES = APP_ROUTES;

function navigateTo(route) {
    window.location.href = route;
}

function redirectBasedOnRole() {
    const user = authService.getUser();
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