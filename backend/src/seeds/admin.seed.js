require('dotenv').config();

const connectDB = require('../DB/connection.js');
const User = require('../models/user.model.js');

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminPhone = '01000000000';
        const adminPassword = 'Admin123456';

        let admin = await User.findOne({ phoneNumber: adminPhone }).select('+password');

        if (admin) {
            admin.fullName = 'System Admin';
            admin.email = 'admin@lab.com';
            admin.password = adminPassword;
            admin.role = 'admin';
            admin.mustChangePassword = false;
            admin.isActive = true;
            admin.status = 'active';
            admin.createdByUserId = null;

            await admin.save();

            console.log('✅ Existing admin updated');
        } else {
            admin = await User.create({
                fullName: 'System Admin',
                phoneNumber: adminPhone,
                email: 'admin@lab.com',
                password: adminPassword,
                role: 'admin',
                mustChangePassword: false,
                isActive: true,
                status: 'active',
                createdByUserId: null,
            });

            console.log('✅ New admin created');
        }

        console.log({
            id: admin._id,
            phoneNumber: adminPhone,
            password: adminPassword,
            role: admin.role,
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Admin seed failed');
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();