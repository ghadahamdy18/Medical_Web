import doctorService from "./doctor.service.js";

export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await doctorService.getMyAppointments(req.user._id);

    res.status(200).json({
      success: true,
      message: "Doctor appointments fetched successfully",
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentDetails = async (req, res, next) => {
  try {
    const appointment = await doctorService.getAppointmentDetails(
      req.user._id,
      req.params.appointmentId
    );

    res.status(200).json({
      success: true,
      message: "Appointment details fetched successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const completeAppointment = async (req, res, next) => {
  try {
    const appointment = await doctorService.completeAppointment(
      req.user._id,
      req.params.appointmentId
    );

    res.status(200).json({
      success: true,
      message: "Appointment completed successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadResult = async (req, res, next) => {
  try {
    const result = await doctorService.uploadResult(
      req.user._id,
      req.params.appointmentId,
      req.body,
      req.file
    );

    res.status(201).json({
      success: true,
      message: "Result uploaded successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentResults = async (req, res, next) => {
  try {
    const results = await doctorService.getAppointmentResults(
      req.user._id,
      req.params.appointmentId
    );

    res.status(200).json({
      success: true,
      message: "Appointment results fetched successfully",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};