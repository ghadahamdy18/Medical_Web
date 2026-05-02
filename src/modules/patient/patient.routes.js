const express = require("express");

const router = express.Router();

const patientController = require("./patient.controller.js");
const { validateSelectProfile } = require("./patient.validation.js");

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

module.exports = router;
