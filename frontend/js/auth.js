const db = {
    users: [
        { id: 1, phone: '1234567890', password: 'patient123', role: 'patient', name: 'John Patient', email: 'john@example.com' },
        { id: 2, phone: '9876543210', password: 'doctor123', role: 'doctor', name: 'Dr. Sarah Smith', specialization: 'General Medicine' },
        { id: 3, phone: '5555555555', password: 'admin123', role: 'admin', name: 'Admin User' },
        { id: 4, phone: '4444444444', password: 'reception123', role: 'receptionist', name: 'Reception Desk' }
    ],
    patients: [
        { id: 1, userId: 1, name: 'John Patient', dob: '1990-05-15', gender: 'Male', phone: '1234567890' },
        { id: 2, userId: 1, name: 'Jane Patient', dob: '1985-03-22', gender: 'Female', relation: 'Spouse', phone: '1234567891' }
    ],
    appointments: [
        { id: 1, patientId: 1, patientName: 'John Patient', date: '2026-04-07', time: '09:00', type: 'In-Lab', status: 'Confirmed', doctorId: 2 },
        { id: 2, patientId: 1, patientName: 'John Patient', date: '2026-04-10', time: '14:00', type: 'Home Visit', status: 'Pending', doctorId: 2 }
    ],
    labResults: [
        { id: 1, patientId: 1, patientName: 'John Patient', doctorId: 2, doctorName: 'Dr. Sarah Smith', fileName: 'blood_test_results.pdf', uploadDate: '2026-04-01', fileUrl: '#' },
        { id: 2, patientId: 1, patientName: 'John Patient', doctorId: 2, doctorName: 'Dr. Sarah Smith', fileName: 'lipid_panel.pdf', uploadDate: '2026-03-25', fileUrl: '#' }
    ],
    doctors: [
        { id: 2, userId: 2, name: 'Dr. Sarah Smith', specialization: 'General Medicine' }
    ],
    adminPatients: [],
    notifications: [
        { id: 1, type: 'appointment', title: 'New Appointment Request', message: 'John Patient booked a Home Visit for April 10', time: '2 hours ago', read: false },
        { id: 2, type: 'registration', title: 'New Doctor Registration', message: 'Dr. Emily Johnson requested access', time: '1 day ago', read: true }
    ],
    staffApprovals: [
        { id: 1, name: 'Dr. Emily Johnson', role: 'doctor', specialization: 'Pathology', status: 'Pending', requestDate: '2026-04-05' }
    ]
};

let currentUser = null;
let currentPatientProfile = null;

function login() {
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!phone) {
        alert('Please enter phone number');
        return;
    }
    
    const user = db.users.find(u => u.phone === phone);
    if (!user) {
        alert('User not found. Please check your phone number.');
        return;
    }
    
    if (user.password !== password && password !== '') {
        alert('Invalid password');
        return;
    }
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    if (user.role === 'patient') {
        window.location.href = 'pages/patient/dashboard.html';
    } else if (user.role === 'doctor') {
        window.location.href = 'pages/doctor/dashboard.html';
    } else if (user.role === 'admin') {
        window.location.href = 'pages/admin/dashboard.html';
    } else if (user.role === 'receptionist') {
        window.location.href = 'pages/receptionist/dashboard.html';
    }
}

function logout() {
    currentUser = null;
    currentPatientProfile = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentPatientProfile');
    window.location.href = '../index.html';
}

function getCurrentUser() {
    if (!currentUser) {
        const stored = localStorage.getItem('currentUser');
        if (stored) currentUser = JSON.parse(stored);
    }
    return currentUser;
}

function getPatientsForUser(userId) {
    return db.patients.filter(p => p.userId === userId);
}

function setCurrentPatient(patient) {
    currentPatientProfile = patient;
    localStorage.setItem('currentPatientProfile', JSON.stringify(patient));
}

function getCurrentPatient() {
    if (!currentPatientProfile) {
        const stored = localStorage.getItem('currentPatientProfile');
        if (stored) currentPatientProfile = JSON.parse(stored);
    }
    return currentPatientProfile;
}

function switchProfile(patientId) {
    const patients = getPatientsForUser(currentUser.id);
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        setCurrentPatient(patient);
        location.reload();
    }
}

function getAppointmentsForPatient(patientId) {
    return db.appointments.filter(a => a.patientId === patientId);
}

function getLabResultsForPatient(patientId) {
    return db.labResults.filter(r => r.patientId === patientId);
}

function getAllAppointments() {
    return db.appointments;
}

function getNotifications() {
    return db.notifications;
}

function getStaffApprovals() {
    return db.staffApprovals;
}

function getAllUsers() {
    return db.users;
}

function addAppointment(appointment) {
    const newId = db.appointments.length + 1;
    db.appointments.push({ ...appointment, id: newId, status: 'Pending' });
    db.notifications.unshift({
        id: db.notifications.length + 1,
        type: 'appointment',
        title: 'New Appointment Request',
        message: `${appointment.patientName} booked a ${appointment.type} for ${appointment.date}`,
        time: 'Just now',
        read: false
    });
    return true;
}

function addLabResult(result) {
    const newId = db.labResults.length + 1;
    db.labResults.push({ ...result, id: newId, uploadDate: new Date().toISOString().split('T')[0] });
    return true;
}

function registerWalkInPatient(patient) {
    const newUserId = db.users.length + 1;
    const newPatientId = db.patients.length + 1;
    const phone = patient.phone;
    const defaultPassword = 'patient123';
    
    db.users.push({
        id: newUserId,
        phone: phone,
        password: defaultPassword,
        role: 'patient',
        name: patient.name,
        email: patient.email || ''
    });
    
    db.patients.push({
        id: newPatientId,
        userId: newUserId,
        name: patient.name,
        dob: patient.dob,
        gender: patient.gender,
        phone: phone
    });
    
    return { phone, password: defaultPassword };
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}