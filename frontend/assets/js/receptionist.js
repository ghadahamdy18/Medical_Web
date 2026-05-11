/**
 * Receptionist module helper functions
 * Requires: api.js, auth.js, guards.js
 */

// ─────────────────────────────────────────────────────────────────────────────
// Receptionist Dashboard
// ─────────────────────────────────────────────────────────────────────────────
async function getReceptionistDashboard() {
    return apiGet('/receptionist/dashboard');
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Management
// ─────────────────────────────────────────────────────────────────────────────
async function getReceptionistPatients(filters = {}) {
    const params = new URLSearchParams();
    
    // Add filters to query params
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const endpoint = `/receptionist/patients${params.toString() ? '?' + params.toString() : ''}`;
    return apiGet(endpoint);
}

async function getReceptionistPatientById(userId) {
    return apiGet(`/receptionist/patients/${userId}`);
}

async function createReceptionistPatient(payload) {
    return apiPost('/receptionist/patients', payload);
}

async function createReceptionistPatientProfile(userId, payload) {
    return apiPost(`/receptionist/patients/${userId}/profiles`, payload);
}

async function updateReceptionistProfile(profileId, payload) {
    return apiPatch(`/receptionist/profiles/${profileId}`, payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointment Management
// ─────────────────────────────────────────────────────────────────────────────
async function getReceptionistAppointments(filters = {}) {
    const params = new URLSearchParams();
    
    // Add filters to query params
    if (filters.status) params.append('status', filters.status);
    if (filters.appointmentType) params.append('appointmentType', filters.appointmentType);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const endpoint = `/receptionist/appointments${params.toString() ? '?' + params.toString() : ''}`;
    return apiGet(endpoint);
}

async function createReceptionistAppointment(payload) {
    return apiPost('/receptionist/appointments', payload);
}

async function confirmReceptionistAppointment(appointmentId) {
    return apiPatch(`/receptionist/appointments/${appointmentId}/confirm`);
}

async function rescheduleReceptionistAppointment(appointmentId, payload) {
    return apiPatch(`/receptionist/appointments/${appointmentId}/reschedule`, payload);
}

async function cancelReceptionistAppointment(appointmentId) {
    return apiPatch(`/receptionist/appointments/${appointmentId}/cancel`);
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
function canReceptionistConfirm(appointment) {
    return appointment && appointment.appointmentStatus === 'pending';
}

function canReceptionistReschedule(appointment) {
    return appointment && (appointment.appointmentStatus === 'pending' || appointment.appointmentStatus === 'confirmed');
}

function canReceptionistCancel(appointment) {
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
function navigateToPatientDetails(userId) {
    window.location.href = `patient-details.html?id=${userId}`;
}

function navigateToCreatePatient() {
    window.location.href = 'create-patient.html';
}

function navigateToAddFamilyProfile(userId) {
    window.location.href = `add-family-profile.html?userId=${userId}`;
}

function navigateToCreateAppointment() {
    window.location.href = 'create-appointment.html';
}

function navigateToAppointments() {
    window.location.href = 'appointments.html';
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

// ─────────────────────────────────────────────────────────────────────────────
// Error Handling Helpers
// ─────────────────────────────────────────────────────────────────────────────
function handleReceptionistError(error, defaultMessage = 'An error occurred') {
    console.error('Receptionist module error:', error);
    
    if (typeof showToast === 'function') {
        showToast(error.message || defaultMessage, 'error');
    } else {
        alert(error.message || defaultMessage);
    }
}

function handleReceptionistSuccess(message) {
    if (typeof showToast === 'function') {
        showToast(message, 'success');
    } else {
        alert(message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Stats Calculator
// ─────────────────────────────────────────────────────────────────────────────
function calculateReceptionistDashboardStats(patients, appointments) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const patientCount = patients ? patients.length : 0;
    const appointmentCount = appointments ? appointments.length : 0;
    const pendingCount = appointments ? appointments.filter(apt => apt.appointmentStatus === 'pending').length : 0;
    const todayCount = appointments ? appointments.filter(apt => {
        if (!apt.appointmentDate) return false;
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
    }).length : 0;
    
    return {
        totalPatients: patientCount,
        totalAppointments: appointmentCount,
        pendingAppointments: pendingCount,
        todayAppointments: todayCount
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

async function getReceptionistDoctors() {
    return apiRequest('/admin/users?role=receptionist&status=active&limit=100', {
        method: 'GET'
    });
}

// Debounced search function
const debouncedPatientSearch = debounce(async (searchTerm, callback) => {
    try {
        const response = await getReceptionistPatients({ search: searchTerm, limit: 10 });
        callback(response.data || []);
    } catch (error) {
        console.error('Search failed:', error);
        callback([]);
    }
}, 300);
