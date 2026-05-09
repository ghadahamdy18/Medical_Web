const doctorService = require('./doctor.service.js');

const sendSuccess = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...data,
    });
};

const getMyAppointments = async (req, res, next) => {
    try {
        const result = await doctorService.getMyAppointments(req.user._id, req.query);

        return sendSuccess(res, 200, 'Doctor appointments retrieved successfully', result);
    } catch (error) {
        next(error);
    }
};

const getAppointmentDetails = async (req, res, next) => {
    try {
        const appointment = await doctorService.getAppointmentDetails(
            req.user._id,
            req.params.appointmentId
        );

        return sendSuccess(res, 200, 'Appointment details retrieved successfully', {
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

const completeAppointment = async (req, res, next) => {
    try {
        const appointment = await doctorService.completeAppointment(
            req.user._id,
            req.params.appointmentId
        );

        return sendSuccess(res, 200, 'Appointment completed successfully', {
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

const uploadResult = async (req, res, next) => {
    try {
        const result = await doctorService.uploadResult(
            req.user._id,
            req.params.appointmentId,
            req.body,
            req.file
        );

        return sendSuccess(res, 201, 'Result uploaded successfully', {
            result,
        });
    } catch (error) {
        next(error);
    }
};

const getAppointmentResults = async (req, res, next) => {
    try {
        const results = await doctorService.getAppointmentResults(
            req.user._id,
            req.params.appointmentId
        );

        return sendSuccess(res, 200, 'Appointment results retrieved successfully', {
            results,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyAppointments,
    getAppointmentDetails,
    completeAppointment,
    uploadResult,
    getAppointmentResults,
};