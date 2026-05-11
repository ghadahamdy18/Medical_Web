const receptionistService = require('./receptionist.service.js');

const createPatient = async (req, res, next) => {
    try {
        const result = await receptionistService.createPatient(req.body, req.user._id);
        return res.status(201).json(result);
    } catch (error) {
        if (error.message.includes('already in use')) {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

const getPatients = async (req, res, next) => {
    try {
        const result = await receptionistService.getPatients(req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getPatientById = async (req, res, next) => {
    try {
        const result = await receptionistService.getPatientById(req.params.userId);
        return res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Patient not found') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
};

const createPatientProfile = async (req, res, next) => {
    try {
        const result = await receptionistService.createPatientProfile(req.params.userId, req.body);
        return res.status(201).json(result);
    } catch (error) {
        if (error.message === 'Patient user not found') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const result = await receptionistService.updatePatientProfile(req.params.profileId, req.body);
        return res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Patient profile not found') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
};

const createAppointment = async (req, res, next) => {
    try {
        const result = await receptionistService.createAppointment(req.body, req.user._id);
        return res.status(201).json(result);
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('inactive')) {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

const getAppointments = async (req, res, next) => {
    try {
        const result = await receptionistService.getAppointments(req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const confirmAppointment = async (req, res, next) => {
    try {
        const result = await receptionistService.confirmAppointment(req.params.id, req.user._id);
        return res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Appointment not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Invalid status transition') {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

const rescheduleAppointment = async (req, res, next) => {
    try {
        const result = await receptionistService.rescheduleAppointment(req.params.id, req.body);
        return res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Appointment not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Invalid status transition') {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

const cancelAppointment = async (req, res, next) => {
    try {
        const result = await receptionistService.cancelAppointment(req.params.appointmentId);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getDashboard = async (req, res, next) => {
    try {
        const result = await receptionistService.getDashboard();
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getDoctors = async (req, res, next) => {
    try {
        const result = await receptionistService.getDoctors(req.user._id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};



module.exports = {
    createPatient,
    getPatients,
    getPatientById,
    createPatientProfile,
    updateProfile,
    createAppointment,
    getAppointments,
    confirmAppointment,
    rescheduleAppointment,
    cancelAppointment,
    getDashboard,
    getDoctors
};
