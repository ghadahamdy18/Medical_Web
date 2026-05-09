/**
 * Doctor module helper functions
 * Requires: api.js, auth.js, guards.js
 */

// ─────────────────────────────────────────────────────────────────────────────
// Doctor Dashboard
// ─────────────────────────────────────────────────────────────────────────────
async function getDoctorDashboard() {
    return apiGet('/doctor/dashboard');
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctor Appointments
// ─────────────────────────────────────────────────────────────────────────────
async function getDoctorAppointments(filters = {}) {
    const params = new URLSearchParams();
    
    // Add filters to query params
    if (filters.appointmentStatus) params.append('appointmentStatus', filters.appointmentStatus);
    if (filters.appointmentType) params.append('appointmentType', filters.appointmentType);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const endpoint = `/doctor/my-appointments${params.toString() ? '?' + params.toString() : ''}`;
    return apiGet(endpoint);
}

async function getDoctorAppointmentDetails(appointmentId) {
    return apiGet(`/doctor/appointments/${appointmentId}`);
}

async function completeDoctorAppointment(appointmentId) {
    return apiPatch(`/doctor/appointments/${appointmentId}/complete`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctor Results
// ─────────────────────────────────────────────────────────────────────────────
async function getDoctorAppointmentResults(appointmentId) {
    return apiGet(`/doctor/appointments/${appointmentId}/results`);
}

async function uploadDoctorResult(appointmentId, formData) {
    // Use fetch directly for FormData since apiPost might not handle it properly
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/doctor/appointments/${appointmentId}/results`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload result');
    }
    
    return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Parameter Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getAppointmentIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function getTestNameFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('testName');
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
    
    return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission Helpers
// ─────────────────────────────────────────────────────────────────────────────
function canDoctorComplete(appointment) {
    return appointment && appointment.appointmentStatus === 'confirmed';
}

function canDoctorUploadResult(appointment) {
    return appointment && (appointment.appointmentStatus === 'confirmed' || appointment.appointmentStatus === 'completed');
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
function navigateToAppointmentDetails(appointmentId) {
    window.location.href = `appointment-details.html?id=${appointmentId}`;
}

function navigateToAppointmentResults(appointmentId) {
    window.location.href = `appointment-results.html?id=${appointmentId}`;
}

function navigateToUploadResults(appointmentId, testName) {
    let url = `upload-results.html?id=${appointmentId}`;
    if (testName) {
        url += `&testName=${encodeURIComponent(testName)}`;
    }
    window.location.href = url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Stats Calculator
// ─────────────────────────────────────────────────────────────────────────────
function calculateDashboardStats(appointments) {
    if (!appointments || !Array.isArray(appointments)) {
        return {
            total: 0,
            confirmed: 0,
            completed: 0,
            pending: 0,
            today: 0
        };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments.reduce((stats, apt) => {
        stats.total++;
        
        if (apt.appointmentStatus === 'confirmed') stats.confirmed++;
        if (apt.appointmentStatus === 'completed') stats.completed++;
        if (apt.appointmentStatus === 'pending') stats.pending++;
        
        // Check if appointment is today
        if (apt.appointmentDate) {
            const aptDate = new Date(apt.appointmentDate);
            aptDate.setHours(0, 0, 0, 0);
            if (aptDate.getTime() === today.getTime()) {
                stats.today++;
            }
        }
        
        return stats;
    }, {
        total: 0,
        confirmed: 0,
        completed: 0,
        pending: 0,
        today: 0
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// File Upload Helpers
// ─────────────────────────────────────────────────────────────────────────────
function validatePDFFile(file) {
    if (!file) {
        return 'Please select a file';
    }
    
    if (file.type !== 'application/pdf') {
        return 'Only PDF files are allowed';
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        return 'File size must be less than 10MB';
    }
    
    return null; // No error
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Handling Helpers
// ─────────────────────────────────────────────────────────────────────────────
function handleDoctorError(error, defaultMessage = 'An error occurred') {
    console.error('Doctor module error:', error);
    
    if (typeof showToast === 'function') {
        showToast(error.message || defaultMessage, 'error');
    } else {
        alert(error.message || defaultMessage);
    }
}

function handleDoctorSuccess(message) {
    if (typeof showToast === 'function') {
        showToast(message, 'success');
    } else {
        alert(message);
    }
}
