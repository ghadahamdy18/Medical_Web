require('dotenv').config();

const connectDB = require('../DB/connection.js');
const User = require('../models/user.model.js');

const seedAdmin = async () => {
    try {
        await connectDB();

        const existingAdmin = await User.findOne({ role: 'admin' });

        if (existingAdmin) {
            console.log('Admin already exists');
            process.exit(0);
        }

        const admin = await User.create({
            fullName: 'System Admin',
            phoneNumber: '01000000000',
            email: 'admin@lab.com',
            password: 'Admin123456',
            role: 'admin',
            mustChangePassword: true,
            isActive: true,
            status: 'active',
            createdByUserId: null,
        });

        console.log('Admin created successfully');
        console.log({
            id: admin._id,
            phoneNumber: admin.phoneNumber,
            password: 'Admin123456',
        });

        process.exit(0);
    } catch (error) {
        console.error('Admin seed failed:', error.message);
        process.exit(1);
    }
};

seedAdmin();