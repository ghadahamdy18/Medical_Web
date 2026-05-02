const PatientProfile = require("../../models/patientProfile.model.js");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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

module.exports = {
  getDashboard,
  getMyProfiles,
  selectProfile,
};
