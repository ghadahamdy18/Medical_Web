const path = require("path");
const fs = require("fs").promises;

const PatientProfile = require("../../models/patientProfile.model.js");
const Appointment = require("../../models/appointment.model.js");
const User = require("../../models/user.model.js");
const ResultFile = require("../../models/resultFile.model.js");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertActivePatientProfile = async (userId, profileId) => {
  const profile = await PatientProfile.findOne({
    _id: profileId,
    userId,
    isActive: true,
  });

  if (!profile) {
    throw createError(
      "Patient profile not found, inactive, or does not belong to you",
      404
    );
  }

  return profile;
};

const assertDoctorUser = async (doctorUserId) => {
  const doctor = await User.findOne({
    _id: doctorUserId,
    role: "doctor",
  });

  if (!doctor) {
    throw createError(
      "Doctor not found or user does not have the doctor role",
      404
    );
  }

  return doctor;
};

/**
 * Dashboard summary for the logged-in patient.
 * Expects PatientProfile documents with userId, isActive, and isPrimary fields.
 */
const getDashboard = async (userId) => {
  const [activeProfileCount, primaryProfile] = await Promise.all([
    PatientProfile.countDocuments({ userId, isActive: true }),
    PatientProfile.findOne({
      userId,
      isPrimary: true,
      isActive: true,
    }).lean(),
  ]);

  return {
    userId,
    activeProfileCount,
    primaryProfile: primaryProfile || null,
  };
};

/**
 * Active profiles for this user only (patient cannot see other users' data).
 */
const getMyProfiles = async (userId) => {
  return PatientProfile.find({ userId, isActive: true }).sort({ _id: -1 });
};

/**
 * Ensures profile belongs to user and is active; returns the profile document.
 */
const selectProfile = async (userId, profileId) => {
  const profile = await PatientProfile.findOne({
    _id: profileId,
    userId,
    isActive: true,
  });

  if (!profile) {
    throw createError(
      "Profile not found, inactive, or does not belong to you",
      404
    );
  }

  return profile;
};

/**
 * Book an in-lab appointment (pending, type in_lab).
 */
const bookInLabAppointment = async (userId, payload) => {
  await assertActivePatientProfile(userId, payload.profileId);
  await assertDoctorUser(payload.doctorUserId);

  const appointment = await Appointment.create({
    patientProfileId: payload.profileId,
    doctorUserId: payload.doctorUserId,
    appointmentDate: payload.appointmentDate,
    appointmentTime: payload.appointmentTime,
    appointmentType: "in_lab",
    appointmentStatus: "pending",
    createdByUserId: userId,
    notes: payload.notes || undefined,
  });

  return appointment;
};

/**
 * Book a home visit appointment (pending, type home_visit).
 */
const bookHomeVisitAppointment = async (userId, payload) => {
  await assertActivePatientProfile(userId, payload.profileId);
  await assertDoctorUser(payload.doctorUserId);

  const appointment = await Appointment.create({
    patientProfileId: payload.profileId,
    doctorUserId: payload.doctorUserId,
    appointmentDate: payload.appointmentDate,
    appointmentTime: payload.appointmentTime,
    appointmentType: "home_visit",
    appointmentStatus: "pending",
    createdByUserId: userId,
    homeVisitAddress: payload.homeVisitAddress,
    notes: payload.notes || undefined,
  });

  return appointment;
};

/**
 * Loads appointment and ensures its profile belongs to this user.
 * Uses 404 when missing or not owned (no information leak).
 */
const assertAppointmentOwnedByPatient = async (userId, appointmentId) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw createError("Appointment not found", 404);
  }

  const profile = await PatientProfile.findOne({
    _id: appointment.patientProfileId,
    userId,
  });

  if (!profile) {
    throw createError("Appointment not found or access denied", 404);
  }

  return appointment;
};

const assertCanModifyAppointmentStatus = (appointment) => {
  const status = appointment.appointmentStatus;
  if (status === "completed" || status === "cancelled") {
    throw createError(
      "This appointment cannot be changed because it is completed or cancelled",
      400
    );
  }
  if (status !== "pending" && status !== "confirmed") {
    throw createError(
      "Only pending or confirmed appointments can be updated",
      400
    );
  }
};

/**
 * Reschedule date/time; optional homeVisitAddress for home_visit only.
 */
const rescheduleMyAppointment = async (userId, appointmentId, payload) => {
  const appointment = await assertAppointmentOwnedByPatient(
    userId,
    appointmentId
  );

  assertCanModifyAppointmentStatus(appointment);

  appointment.appointmentDate = payload.appointmentDate;
  appointment.appointmentTime = payload.appointmentTime;

  if (appointment.appointmentType === "home_visit") {
    const addr = payload.homeVisitAddress;
    if (addr !== undefined && String(addr).trim() !== "") {
      appointment.homeVisitAddress = String(addr).trim();
    }
  }

  await appointment.save();
  return appointment;
};

/**
 * Soft-cancel: set status to cancelled, keep document.
 */
const cancelMyAppointment = async (userId, appointmentId) => {
  const appointment = await assertAppointmentOwnedByPatient(
    userId,
    appointmentId
  );

  assertCanModifyAppointmentStatus(appointment);

  appointment.appointmentStatus = "cancelled";
  await appointment.save();
  return appointment;
};

/**
 * Appointments for the patient's active profiles, newest first.
 * @param {object} filters — optional profileId, status, date (YYYY-MM-DD)
 */
const getMyAppointments = async (userId, filters) => {
  const profileId = filters.profileId;
  const status = filters.status;
  const date = filters.date;

  const activeProfiles = await PatientProfile.find({
    userId,
    isActive: true,
  }).select("_id");

  if (activeProfiles.length === 0) {
    return [];
  }

  const activeProfileIds = activeProfiles.map((p) => p._id);

  const query = {};

  if (profileId) {
    await assertActivePatientProfile(userId, profileId);
    query.patientProfileId = profileId;
  } else {
    query.patientProfileId = { $in: activeProfileIds };
  }

  if (status) {
    query.appointmentStatus = status;
  }

  if (date) {
    query.appointmentDate = date;
  }

  return Appointment.find(query)
    .populate("doctorUserId", "fullName phoneNumber")
    .populate(
      "patientProfileId",
      "fullName relationshipToPrimary isPrimary"
    )
    .sort({ appointmentDate: -1, appointmentTime: -1, _id: -1 });
};

/**
 * List latest result files (metadata only) for the patient's own appointments.
 * @param {object} filters — optional profileId, appointmentId (from query)
 */
const getMyResults = async (userId, filters) => {
  const profileId = filters.profileId;
  const appointmentId = filters.appointmentId;

  const activeProfiles = await PatientProfile.find({
    userId,
    isActive: true,
  }).select("_id");

  if (activeProfiles.length === 0) {
    return [];
  }

  const activeProfileIds = activeProfiles.map((p) => p._id);

  const query = { isLatest: true };

  if (appointmentId && profileId) {
    await assertActivePatientProfile(userId, profileId);
    const appointment = await assertAppointmentOwnedByPatient(
      userId,
      appointmentId
    );
    if (!appointment.patientProfileId.equals(profileId)) {
      throw createError(
        "Appointment does not match the selected profile",
        400
      );
    }
    query.appointmentId = appointmentId;
  } else if (appointmentId) {
    await assertAppointmentOwnedByPatient(userId, appointmentId);
    query.appointmentId = appointmentId;
  } else if (profileId) {
    await assertActivePatientProfile(userId, profileId);
    query.patientProfileId = profileId;
  } else {
    query.patientProfileId = { $in: activeProfileIds };
  }

  return ResultFile.find(query)
    .select(
      "appointmentId testName fileName mimeType fileSize uploadedAt isLatest"
    )
    .populate(
      "appointmentId",
      "appointmentDate appointmentTime appointmentStatus appointmentType"
    )
    .sort({ uploadedAt: -1 })
    .lean();
};

/**
 * Verify the patient may download this result; return paths for the controller.
 * Does not expose filePath in API JSON — only used internally for res.download.
 */
const getMyResultForDownload = async (userId, resultId) => {
  const result = await ResultFile.findById(resultId);

  if (!result) {
    throw createError("Result not found", 404);
  }

  const appointment = await Appointment.findById(result.appointmentId);

  if (!appointment) {
    throw createError("Result not found", 404);
  }

  if (!appointment.patientProfileId.equals(result.patientProfileId)) {
    throw createError("Result not found or access denied", 404);
  }

  const ownsProfile = await PatientProfile.findOne({
    _id: appointment.patientProfileId,
    userId,
  });

  if (!ownsProfile) {
    throw createError("Result not found or access denied", 404);
  }

  const absolutePath = path.resolve(result.filePath);

  try {
    await fs.access(absolutePath);
  } catch {
    throw createError("Result file is not available on the server", 404);
  }

  return {
    absolutePath,
    downloadFileName: result.fileName,
  };
};

module.exports = {
  getDashboard,
  getMyProfiles,
  selectProfile,
  bookInLabAppointment,
  bookHomeVisitAppointment,
  getMyAppointments,
  rescheduleMyAppointment,
  cancelMyAppointment,
  getMyResults,
  getMyResultForDownload,
};
