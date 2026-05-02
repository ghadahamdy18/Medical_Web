import express from "express";
const router = express.Router();

import doctorController from "./doctor.controller.js";
import auth from "../../middlewares/auth.middleware.js";
import role from "../../middlewares/role.middleware.js";
import upload from "../../middlewares/upload.middleware.js";

router.use(auth);
router.use(role("doctor"));

router.get("/appointments", doctorController.getMyAppointments);
router.get("/appointments/:appointmentId", doctorController.getAppointmentDetails);

router.patch(
  "/appointments/:appointmentId/complete",
  doctorController.completeAppointment
);

router.post(
  "/appointments/:appointmentId/results",
  upload.single("resultFile"),
  doctorController.uploadResult
);

router.get(
  "/appointments/:appointmentId/results",
  doctorController.getAppointmentResults
);

export default router;