const patientService = require("./patient.service.js");

const getDashboard = async (req, res, next) => {
  try {
    const data = await patientService.getDashboard(req.user._id);

    res.status(200).json({
      success: true,
      message: "Patient dashboard fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMyProfiles = async (req, res, next) => {
  try {
    const profiles = await patientService.getMyProfiles(req.user._id);

    res.status(200).json({
      success: true,
      message: "Profiles fetched successfully",
      data: profiles,
    });
  } catch (error) {
    next(error);
  }
};

const selectProfile = async (req, res, next) => {
  try {
    const profile = await patientService.selectProfile(
      req.user._id,
      req.body.profileId
    );

    res.status(200).json({
      success: true,
      message: "Profile selected successfully",
      data: { selectedProfile: profile },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getMyProfiles,
  selectProfile,
};
