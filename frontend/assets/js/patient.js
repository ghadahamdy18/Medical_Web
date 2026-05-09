/**
 * Patient module helper functions
 * Requires: api.js, auth.js, guards.js
 */

// ─────────────────────────────────────────────────────────────────────────────
// localStorage keys for patient data
// ─────────────────────────────────────────────────────────────────────────────
const SELECTED_PROFILE_KEY = 'lab_selected_patient_profile';

// ─────────────────────────────────────────────────────────────────────────────
// Patient Dashboard
// ─────────────────────────────────────────────────────────────────────────────
async function getPatientDashboard() {
    return apiGet('/patient/dashboard');
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Profiles
// ─────────────────────────────────────────────────────────────────────────────
async function getPatientProfiles() {
    return apiGet('/patient/profiles');
}

async function selectPatientProfile(profileId) {
    return apiPost('/patient/select-profile', { profileId });
}

function getSelectedPatientProfile() {
    try {
        const raw = localStorage.getItem(SELECTED_PROFILE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveSelectedPatientProfile(profile) {
    if (!profile || typeof profile !== 'object') {
        clearSelectedPatientProfile();
        return;
    }
    localStorage.setItem(SELECTED_PROFILE_KEY, JSON.stringify(profile));
}

function clearSelectedPatientProfile() {
    localStorage.removeItem(SELECTED_PROFILE_KEY);
}

function requireSelectedPatientProfile() {
    const profile = getSelectedPatientProfile();
    if (!profile) {
        window.location.href = 'select-profile.html';
        return false;
    }
    return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Appointments
// ─────────────────────────────────────────────────────────────────────────────
async function getPatientAppointments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.profileId) params.append('profileId', filters.profileId);
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);
    
    const query = params.toString();
    const endpoint = query ? `/patient/appointments?${query}` : '/patient/appointments';
    return apiGet(endpoint);
}

async function bookInLabAppointment(payload) {
    return apiPost('/patient/appointments/in-lab', payload);
}

async function bookHomeVisitAppointment(payload) {
    return apiPost('/patient/appointments/home-visit', payload);
}

async function reschedulePatientAppointment(appointmentId, payload) {
    return apiPatch(`/patient/appointments/${appointmentId}/reschedule`, payload);
}

async function cancelPatientAppointment(appointmentId) {
    return apiPatch(`/patient/appointments/${appointmentId}/cancel`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Results
// ─────────────────────────────────────────────────────────────────────────────
async function getPatientResults(filters = {}) {
    const params = new URLSearchParams();
    if (filters.profileId) params.append('profileId', filters.profileId);
    
    const query = params.toString();
    const endpoint = query ? `/patient/results?${query}` : '/patient/results';
    return apiGet(endpoint);
}

async function downloadPatientResult(resultId, fileName) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const url = buildAbsoluteApiUrl(`/patient/results/${resultId}/download`);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await parseJsonResponse(response).catch(() => null);
            const msg = collectErrorMessage(errorData, response.status);
            throw new Error(msg);
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName || `result-${resultId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        window.URL.revokeObjectURL(objectUrl);
        
        return true;
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Global exports
// ─────────────────────────────────────────────────────────────────────────────
window.getPatientDashboard = getPatientDashboard;
window.getPatientProfiles = getPatientProfiles;
window.selectPatientProfile = selectPatientProfile;
window.getSelectedPatientProfile = getSelectedPatientProfile;
window.saveSelectedPatientProfile = saveSelectedPatientProfile;
window.clearSelectedPatientProfile = clearSelectedPatientProfile;
window.requireSelectedPatientProfile = requireSelectedPatientProfile;
window.getPatientAppointments = getPatientAppointments;
window.bookInLabAppointment = bookInLabAppointment;
window.bookHomeVisitAppointment = bookHomeVisitAppointment;
window.reschedulePatientAppointment = reschedulePatientAppointment;
window.cancelPatientAppointment = cancelPatientAppointment;
window.getPatientResults = getPatientResults;
window.downloadPatientResult = downloadPatientResult;
