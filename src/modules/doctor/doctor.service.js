import Appointment from "../../models/appointment.model.js";
import ResultFile from "../../models/resultFile.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getMyAppointments = async (doctorId) => {
  return Appointment.find({ doctorUserId: doctorId })
    .populate("patientProfileId")
    .populate("doctorUserId", "fullName phoneNumber role")
    .sort({ appointmentDate: 1, appointmentTime: 1 });
};

export const getAppointmentDetails = async (doctorId, appointmentId) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorUserId: doctorId,
  })
    .populate("patientProfileId")
    .populate("doctorUserId", "fullName phoneNumber role");

  if (!appointment) {
    throw createError("Appointment not found or not assigned to you", 404);
  }

  return appointment;
};

export const completeAppointment = async (doctorId, appointmentId) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorUserId: doctorId,
  });

  if (!appointment) {
    throw createError("Appointment not found or not assigned to you", 404);
  }

  if (appointment.appointmentStatus !== "confirmed") {
    throw createError("Only confirmed appointments can be completed", 400);
  }

  appointment.appointmentStatus = "completed";

  await appointment.save();

  return appointment;
};

export const uploadResult = async (doctorId, appointmentId, body, file) => {
  if (!file) {
    throw createError("Result PDF file is required", 400);
  }

  if (file.mimetype !== "application/pdf") {
    throw createError("Only PDF files are allowed", 400);
  }

  if (!body.testName) {
    throw createError("testName is required", 400);
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorUserId: doctorId,
  });

  if (!appointment) {
    throw createError("Appointment not found or not assigned to you", 404);
  }

  const result = await ResultFile.create({
    appointmentId,
    patientProfileId: appointment.patientProfileId,
    doctorUserId: doctorId,
    testName: body.testName,
    fileName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size,
    isLatest: true,
    uploadedAt: new Date(),
  });

  return result;
};

export const getAppointmentResults = async (doctorId, appointmentId) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorUserId: doctorId,
  });

  if (!appointment) {
    throw createError("Appointment not found or not assigned to you", 404);
  }

  return ResultFile.find({ appointmentId }).sort({ uploadedAt: -1 });
};