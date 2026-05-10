require('dotenv').config();

const bcrypt = require('bcryptjs');

const connectDB = require('../DB/connection.js');
const User = require('../models/user.model.js');

const seedAdmin = async () => {
    try {
        // Connect database
        await connectDB();

        console.log('Starting admin seed...');

        // Admin credentials
        const adminPhone = '01000000000';
        const adminPassword = 'Admin123456';

        // Hash password manually
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create or update admin
        const admin = await User.findOneAndUpdate(
            {
                phoneNumber: adminPhone,
            },
            {
                fullName: 'System Admin',
                phoneNumber: adminPhone,
                email: 'admin@lab.com',

                // Already hashed
                password: hashedPassword,

                role: 'admin',

                mustChangePassword: false,

                isActive: true,

                status: 'active',

                createdByUserId: null,
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        console.log('✅ Admin seeded successfully');

        console.log({
            id: admin._id,
            phoneNumber: admin.phoneNumber,
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