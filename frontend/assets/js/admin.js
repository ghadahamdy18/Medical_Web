/**
 * Admin module helper functions
 * Requires: api.js, auth.js, guards.js
 */

// ─────────────────────────────────────────────────────────────────────────────
// User Management
// ─────────────────────────────────────────────────────────────────────────────
async function getAdminUsers(filters = {}) {
    const params = new URLSearchParams();
    
    // Add filters to query params
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const endpoint = `/admin/users${params.toString() ? '?' + params.toString() : ''}`;
    return apiGet(endpoint);
}

async function getAdminUserById(userId) {
    return apiGet(`/admin/users/${userId}`);
}

async function createAdminUser(payload) {
    return apiPost('/admin/users', payload);
}

async function updateAdminUser(userId, payload) {
    return apiPatch(`/admin/users/${userId}`, payload);
}

async function updateAdminUserStatus(userId, payload) {
    return apiPatch(`/admin/users/${userId}/status`, payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Profile Management
// ─────────────────────────────────────────────────────────────────────────────
async function getAdminPatientProfiles(filters = {}) {
    const params = new URLSearchParams();
    
    // Add filters to query params
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.search) params.append('search', filters.search);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.isPrimary !== undefined) params.append('isPrimary', filters.isPrimary);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const endpoint = `/admin/profiles${params.toString() ? '?' + params.toString() : ''}`;
    return apiGet(endpoint);
}

async function createAdminPatientProfile(userId, payload) {
    return apiPost(`/admin/users/${userId}/profiles`, payload);
}

async function updateAdminPatientProfile(profileId, payload) {
    return apiPatch(`/admin/profiles/${profileId}`, payload);
}

async function deactivateAdminPatientProfile(profileId) {
    return apiPatch(`/admin/profiles/${profileId}/deactivate`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointment Management
// ─────────────────────────────────────────────────────────────────────────────
async function getAdminAppointments(filters = {}) {
    const params = new URLSearchParams();
    
    // Add filters to query params
    if (filters.appointmentStatus) params.append('appointmentStatus', filters.appointmentStatus);
    if (filters.appointmentType) params.append('appointmentType', filters.appointmentType);
    if (filters.patientProfileId) params.append('patientProfileId', filters.patientProfileId);
    if (filters.doctorUserId) params.append('doctorUserId', filters.doctorUserId);
    if (filters.date) params.append('date', filters.date);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const endpoint = `/admin/appointments${params.toString() ? '?' + params.toString() : ''}`;
    return apiGet(endpoint);
}

async function getAdminAppointmentById(appointmentId) {
    return apiGet(`/admin/appointments/${appointmentId}`);
}

async function createAdminAppointment(payload) {
    return apiPost('/admin/appointments', payload);
}

async function updateAdminAppointment(appointmentId, payload) {
    return apiPatch(`/admin/appointments/${appointmentId}`, payload);
}

async function confirmAdminAppointment(appointmentId) {
    return apiPatch(`/admin/appointments/${appointmentId}/confirm`);
}

async function completeAdminAppointment(appointmentId) {
    return apiPatch(`/admin/appointments/${appointmentId}/complete`);
}

async function cancelAdminAppointment(appointmentId) {
    return apiPatch(`/admin/appointments/${appointmentId}/cancel`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Result Management
// ─────────────────────────────────────────────────────────────────────────────
async function getAdminResults(filters = {}) {
    const params = new URLSearchParams();
    
    // Add filters to query params
    if (filters.testName) params.append('testName', filters.testName);
    if (filters.doctorUserId) params.append('doctorUserId', filters.doctorUserId);
    if (filters.appointmentId) params.append('appointmentId', filters.appointmentId);
    if (filters.isLatest !== undefined) params.append('isLatest', filters.isLatest);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const endpoint = `/admin/results${params.toString() ? '?' + params.toString() : ''}`;
    return apiGet(endpoint);
}

async function getAdminResultById(resultId) {
    return apiGet(`/admin/results/${resultId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Parameter Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatRole(role) {
    if (!role) return 'Unknown';
    
    const roleMap = {
        'admin': 'Admin',
        'doctor': 'Doctor',
        'receptionist': 'Receptionist',
        'patient': 'Patient'
    };
    
    return roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
}

function formatUserStatus(status) {
    if (!status) return 'Unknown';
    
    const statusMap = {
        'active': 'Active',
        'inactive': 'Inactive',
        'blocked': 'Blocked',
        'archived': 'Archived'
    };
    
    return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
}

function formatAppointmentStatus(status) {
    if (!status) return 'Unknown';
    
    const statusMap = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    
    return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
}

function formatAppointmentType(type) {
    if (!type) return 'Unknown';
    
    const typeMap = {
        'in_lab': 'In-Lab Visit',
        'home_visit': 'Home Visit'
    };
    
    return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + status.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission Helpers
// ─────────────────────────────────────────────────────────────────────────────
function canAdminConfirm(appointment) {
    return appointment && appointment.appointmentStatus === 'pending';
}

function canAdminComplete(appointment) {
    return appointment && appointment.appointmentStatus === 'confirmed';
}

function canAdminCancel(appointment) {
    return appointment && (appointment.appointmentStatus === 'pending' || appointment.appointmentStatus === 'confirmed');
}

function canAdminEditAppointment(appointment) {
    return appointment && (appointment.appointmentStatus === 'pending' || appointment.appointmentStatus === 'confirmed');
}

// ─────────────────────────────────────────────────────────────────────────────
// Date/Time Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function formatTime(timeString) {
    if (!timeString) return 'Unknown';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

function formatDateTime(dateString, timeString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Helpers
// ─────────────────────────────────────────────────────────────────────────────
function navigateToUserDetails(userId) {
    window.location.href = `user-details.html?id=${userId}`;
}

function navigateToCreateUser() {
    window.location.href = 'create-user.html';
}

function navigateToPatientProfiles(userId) {
    const url = userId ? `patient-profiles.html?userId=${userId}` : 'patient-profiles.html';
    window.location.href = url;
}

function navigateToCreatePatientProfile(userId) {
    window.location.href = `create-patient-profile.html?userId=${userId}`;
}

function navigateToAppointments() {
    window.location.href = 'appointments.html';
}

function navigateToCreateAppointment() {
    window.location.href = 'create-appointment.html';
}

function navigateToAppointmentDetails(appointmentId) {
    window.location.href = `appointment-details.html?id=${appointmentId}`;
}

function navigateToResults() {
    window.location.href = 'results.html';
}

function navigateToResultDetails(resultId) {
    window.location.href = `result-details.html?id=${resultId}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────
function validatePhoneNumber(phone) {
    const phoneRegex = /^01[0-2]\d{8}$/;
    return phoneRegex.test(phone);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
}

function validateTime(timeString) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Handling Helpers
// ─────────────────────────────────────────────────────────────────────────────
function handleAdminError(error, defaultMessage = 'An error occurred') {
    console.error('Admin module error:', error);
    
    if (typeof showToast === 'function') {
        showToast(error.message || defaultMessage, 'error');
    } else {
        alert(error.message || defaultMessage);
    }
}

function handleAdminSuccess(message) {
    if (typeof showToast === 'function') {
        showToast(message, 'success');
    } else {
        alert(message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Stats Calculator
// ─────────────────────────────────────────────────────────────────────────────
function calculateAdminDashboardStats(users, appointments, results) {
    const totalUsers = users ? users.length : 0;
    const activeDoctors = users ? users.filter(u => u.role === 'doctor' && u.status === 'active').length : 0;
    const totalAppointments = appointments ? appointments.length : 0;
    const pendingAppointments = appointments ? appointments.filter(a => a.appointmentStatus === 'pending').length : 0;
    const latestResults = results ? results.filter(r => r.isLatest).length : 0;
    
    return {
        totalUsers,
        activeDoctors,
        totalAppointments,
        pendingAppointments,
        latestResults
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Helpers
// ─────────────────────────────────────────────────────────────────────────────
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced search function
const debouncedUserSearch = debounce(async (searchTerm, callback) => {
    try {
        const response = await getAdminUsers({ search: searchTerm, limit: 10 });
        callback(response.data || []);
    } catch (error) {
        console.error('Search failed:', error);
        callback([]);
    }
}, 300);

// ─────────────────────────────────────────────────────────────────────────────
// File Size Helper
// ─────────────────────────────────────────────────────────────────────────────
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
