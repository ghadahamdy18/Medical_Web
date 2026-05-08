const express = require('express');
const router = express.Router();

router.use('/auth', require('./modules/auth/auth.routes'));
router.use('/admin', require('./modules/admin/admin.routes'));
router.use('/doctor', require('./modules/doctor/doctor.routes'));
router.use('/patient', require('./modules/patient/patient.routes'));
router.use('/receptionist', require('./modules/receptionist/receptionist.routes'));
//router.use('/appointments', require('./modules/appointment/appointment.routes'));
//router.use('/results', require('./modules/resultFile/resultFile.routes'));
//router.use('/profiles', require('./modules/patientProfile/patientProfile.routes'));
//router.use('/notifications', require('./modules/notification/notification.routes'));

module.exports = router;
