const adminService = require('./admin.service.js');

const sendSuccess = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...data,
    });
};

const createUser = async (req, res, next) => {
    try {
        const result = await adminService.createUser(req.body, req.user._id);

        return sendSuccess(res, 201, 'User created successfully', result);
    } catch (error) {
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const result = await adminService.getUsers(req.query);

        return sendSuccess(res, 200, 'Users retrieved successfully', result);
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const result = await adminService.getUserById(req.params.userId);

        return sendSuccess(res, 200, 'User details retrieved successfully', result);
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const user = await adminService.updateUser(req.params.userId, req.body);

        return sendSuccess(res, 200, 'User updated successfully', { user });
    } catch (error) {
        next(error);
    }
};

const updateUserStatus = async (req, res, next) => {
    try {
        const user = await adminService.updateUserStatus(req.params.userId, req.body);

        return sendSuccess(res, 200, 'User status updated successfully', { user });
    } catch (error) {
        next(error);
    }
};

const getPatientProfiles = async (req, res, next) => {
    try {
        const result = await adminService.getPatientProfiles(req.query);

        return sendSuccess(res, 200, 'Patient profiles retrieved successfully', result);
    } catch (error) {
        next(error);
    }
};

const createPatientProfile = async (req, res, next) => {
    try {
        const profile = await adminService.createPatientProfile(
            req.params.userId,
            req.body,
            req.user._id
        );

        return sendSuccess(res, 201, 'Patient profile created successfully', {
            profile,
        });
    } catch (error) {
        next(error);
    }
};

const updatePatientProfile = async (req, res, next) => {
    try {
        const profile = await adminService.updatePatientProfile(
            req.params.profileId,
            req.body
        );

        return sendSuccess(res, 200, 'Patient profile updated successfully', {
            profile,
        });
    } catch (error) {
        next(error);
    }
};

const deactivatePatientProfile = async (req, res, next) => {
    try {
        const profile = await adminService.deactivatePatientProfile(req.params.profileId);

        return sendSuccess(res, 200, 'Patient profile deactivated successfully', {
            profile,
        });
    } catch (error) {
        next(error);
    }
};

const createAppointment = async (req, res, next) => {
    try {
        const appointment = await adminService.createAppointment(req.body, req.user._id);

        return sendSuccess(res, 201, 'Appointment created successfully', {
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

const getAppointments = async (req, res, next) => {
    try {
        const result = await adminService.getAppointments(req.query);

        return sendSuccess(res, 200, 'Appointments retrieved successfully', result);
    } catch (error) {
        next(error);
    }
};

const getAppointmentById = async (req, res, next) => {
    try {
        const result = await adminService.getAppointmentById(req.params.appointmentId);

        return sendSuccess(res, 200, 'Appointment details retrieved successfully', result);
    } catch (error) {
        next(error);
    }
};

const updateAppointment = async (req, res, next) => {
    try {
        const appointment = await adminService.updateAppointment(
            req.params.appointmentId,
            req.body
        );

        return sendSuccess(res, 200, 'Appointment updated successfully', {
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

const confirmAppointment = async (req, res, next) => {
    try {
        const appointment = await adminService.confirmAppointment(
            req.params.appointmentId,
            req.user._id
        );

        return sendSuccess(res, 200, 'Appointment confirmed successfully', {
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

const completeAppointment = async (req, res, next) => {
    try {
        const appointment = await adminService.completeAppointment(
            req.params.appointmentId
        );

        return sendSuccess(res, 200, 'Appointment completed successfully', {
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

const cancelAppointment = async (req, res, next) => {
    try {
        const appointment = await adminService.cancelAppointment(req.params.appointmentId);

        return sendSuccess(res, 200, 'Appointment cancelled successfully', {
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

const getResults = async (req, res, next) => {
    try {
        const result = await adminService.getResults(req.query);

        return sendSuccess(res, 200, 'Result files retrieved successfully', result);
    } catch (error) {
        next(error);
    }
};

const getResultById = async (req, res, next) => {
    try {
        const result = await adminService.getResultById(req.params.resultId);

        return sendSuccess(res, 200, 'Result file details retrieved successfully', {
            result,
        });
    } catch (error) {
        next(error);
    }
};

const getDashboard = async (req, res, next) => {
    try {
        const result = await adminService.getDashboard();

        return sendSuccess(res, 200, 'Dashboard data retrieved successfully', result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    updateUserStatus,
    getPatientProfiles,
    createPatientProfile,
    updatePatientProfile,
    deactivatePatientProfile,
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    confirmAppointment,
    completeAppointment,
    cancelAppointment,
    getResults,
    getResultById,
    getDashboard,
};