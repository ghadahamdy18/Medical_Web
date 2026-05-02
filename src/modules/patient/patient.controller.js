const patientService = require("./patient.service.js");

const getPatientUserId = (req) => req.user._id || req.user.id;

const getDashboard = async (req, res, next) => {
  try {
    const data = await patientService.getDashboard(getPatientUserId(req));

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
    const profiles = await patientService.getMyProfiles(getPatientUserId(req));

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
      getPatientUserId(req),
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

const getMyAppointments = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.profileId) {
      filters.profileId = req.query.profileId;
    }
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.date) {
      filters.date = req.query.date;
    }

    const appointments = await patientService.getMyAppointments(
      getPatientUserId(req),
      filters
    );

    res.status(200).json({
      success: true,
      message: "Appointments fetched successfully",
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

const bookInLabAppointment = async (req, res, next) => {
  try {
    const appointment = await patientService.bookInLabAppointment(
      getPatientUserId(req),
      req.body
    );

    res.status(201).json({
      success: true,
      message: "In-lab appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const bookHomeVisitAppointment = async (req, res, next) => {
  try {
    const appointment = await patientService.bookHomeVisitAppointment(
      getPatientUserId(req),
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Home visit appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const rescheduleMyAppointment = async (req, res, next) => {
  try {
    const appointment = await patientService.rescheduleMyAppointment(
      getPatientUserId(req),
      req.params.appointmentId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const cancelMyAppointment = async (req, res, next) => {
  try {
    const appointment = await patientService.cancelMyAppointment(
      getPatientUserId(req),
      req.params.appointmentId
    );

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const getMyResults = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.profileId) {
      filters.profileId = req.query.profileId;
    }
    if (req.query.appointmentId) {
      filters.appointmentId = req.query.appointmentId;
    }

    const results = await patientService.getMyResults(
      getPatientUserId(req),
      filters
    );

    res.status(200).json({
      success: true,
      message: "Results fetched successfully",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

const downloadMyResult = async (req, res, next) => {
  try {
    const { absolutePath, downloadFileName } =
      await patientService.getMyResultForDownload(
        getPatientUserId(req),
        req.params.resultId
      );

    res.download(absolutePath, downloadFileName, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getMyProfiles,
  selectProfile,
  getMyAppointments,
  bookInLabAppointment,
  bookHomeVisitAppointment,
  rescheduleMyAppointment,
  cancelMyAppointment,
  getMyResults,
  downloadMyResult,
};
