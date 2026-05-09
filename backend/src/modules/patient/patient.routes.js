const express = require("express");

const router = express.Router();

const patientController = require("./patient.controller.js");
const {
  validateSelectProfile,
  bookInLabAppointmentValidation,
  bookHomeVisitAppointmentValidation,
  getMyAppointmentsValidation,
  rescheduleAppointmentValidation,
  cancelAppointmentValidation,
  getMyResultsValidation,
  downloadResultValidation,
} = require("./patient.validation.js");

const auth = require("../../middlewares/auth.middleware.js");
const role = require("../../middlewares/role.middleware.js");

router.use(auth);
router.use(role("patient"));

router.get("/dashboard", patientController.getDashboard);
router.get("/profiles", patientController.getMyProfiles);
router.post(
  "/select-profile",
  validateSelectProfile,
  patientController.selectProfile
);

router.get(
  "/appointments",
  getMyAppointmentsValidation,
  patientController.getMyAppointments
);

router.post(
  "/appointments/in-lab",
  bookInLabAppointmentValidation,
  patientController.bookInLabAppointment
);
router.post(
  "/appointments/home-visit",
  bookHomeVisitAppointmentValidation,
  patientController.bookHomeVisitAppointment
);

router.patch(
  "/appointments/:appointmentId/reschedule",
  rescheduleAppointmentValidation,
  patientController.rescheduleMyAppointment
);
router.patch(
  "/appointments/:appointmentId/cancel",
  cancelAppointmentValidation,
  patientController.cancelMyAppointment
);

router.get(
  "/results",
  getMyResultsValidation,
  patientController.getMyResults
);
router.get(
  "/results/:resultId/download",
  downloadResultValidation,
  patientController.downloadMyResult
);

module.exports = router;
