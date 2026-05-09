# Medical Laboratory Management System

A comprehensive web-based laboratory management system for healthcare providers and patients.

## Project Description

The Medical Laboratory Management System is a full-stack web application designed to streamline laboratory operations, patient management, appointment scheduling, and result reporting. The system supports multiple user roles including administrators, doctors, receptionists, and patients, each with specialized interfaces and permissions.

## Roles and Features

### Administrator
- **Dashboard**: Real-time system statistics and overview
- **User Management**: Create and manage all user accounts
- **Patient Profiles**: Manage patient profiles and family members
- **Appointment Management**: View, edit, and manage all appointments
- **Results Management**: View lab results and metadata
- **Settings**: System configuration and user account management

### Doctor
- **Dashboard**: Personal appointment overview and statistics
- **Appointments**: View scheduled appointments and patient details
- **Upload Results**: Upload and manage lab test results (PDF only)
- **Patient Management**: Access patient information and history
- **Settings**: Profile management and preferences

### Receptionist
- **Dashboard**: Daily operations overview and statistics
- **Patient Management**: Create and manage patient records
- **Family Profiles**: Add family members to patient accounts
- **Appointment Scheduling**: Book, confirm, and manage appointments
- **Walk-in Registration**: Register walk-in patients
- **Settings**: Account management and preferences

### Patient
- **Dashboard**: Personal health overview and upcoming appointments
- **Profile Management**: Manage personal and family member profiles
- **Appointment Booking**: Schedule and manage appointments
- **Lab Results**: View and download test results
- **Family Members**: Manage family member profiles
- **Settings**: Account preferences and security

## Tech Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with responsive design
- **JavaScript (ES6+)**: Client-side logic and API integration
- **No Frameworks**: Plain HTML/CSS/JS for maximum compatibility

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data storage
- **JWT**: Authentication and authorization
- **Multer**: File upload handling
- **Joi**: Data validation

### Development Tools
- **Git**: Version control
- **VS Code**: Recommended IDE
- **Chrome DevTools**: Debugging and testing

## Project Structure

```
laboratory_web/
├── backend/                 # Backend server code
│   ├── config/             # Database and server configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── uploads/           # File upload directory
│   ├── utils/             # Utility functions
│   └── server.js          # Main server file
├── frontend/              # Frontend client code
│   ├── assets/           # Shared assets and scripts
│   │   ├── css/          # Stylesheets
│   │   └── js/           # JavaScript modules
│   ├── auth/             # Authentication pages
│   ├── pages/            # Role-specific pages
│   │   ├── admin/        # Admin interface
│   │   ├── doctor/       # Doctor interface
│   │   ├── patient/      # Patient interface
│   │   └── receptionist/ # Receptionist interface
│   └── index.html        # Landing page
├── README.md             # Project documentation
├── .gitignore           # Git ignore rules
└── .env.example         # Environment variables template
```

## Backend Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd laboratory_web
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/medical_lab
   JWT_SECRET=your-super-secret-jwt-key
   UPLOAD_PATH=./uploads
   ```

4. **Start MongoDB**
   ```bash
   # For Windows
   net start MongoDB

   # For macOS/Linux
   sudo systemctl start mongod
   # or
   mongod
   ```

5. **Run the backend server**
   ```bash
   npm run dev
   # or
   node server.js
   ```

### Database Seeding

Create an admin user with the following command (if available):
```bash
npm run seed-admin
```

Or manually create admin user through the registration API.

## Frontend Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Web server for serving static files (optional)

### Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Serve the frontend files**
   
   **Option 1: Using Node.js serve**
   ```bash
   npx serve .
   # or
   npm install -g serve
   serve -s . -l 3000
   ```

   **Option 2: Using Python**
   ```bash
   python -m http.server 3000
   ```

   **Option 3: Using PHP**
   ```bash
   php -S localhost:3000
   ```

   **Option 4: Using Live Server in VS Code**
   - Install "Live Server" extension
   - Right-click `index.html` and select "Open with Live Server"

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Environment Variables

### Backend Environment Variables (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/medical_lab

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# CORS
FRONTEND_URL=http://localhost:3000
```

## How to Run the System

### Complete System Startup

1. **Start MongoDB**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npx serve . -l 3000
   ```

4. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Register a new patient account or use existing credentials

### Default Admin Account

If database seeding is available, the default admin account will be:
- **Phone**: [Provided during seeding]
- **Password**: [Provided during seeding]

## API Routes Summary

### Authentication Routes
- `POST /auth/login` - User login
- `POST /auth/register` - Patient registration
- `POST /auth/logout` - User logout
- `PATCH /auth/change-password` - Change password
- `GET /auth/me` - Get current user info

### Admin Routes
- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - List users
- `POST /admin/users` - Create user
- `PATCH /admin/users/:id/status` - Update user status
- `GET /admin/profiles` - List patient profiles
- `POST /admin/profiles` - Create patient profile
- `PATCH /admin/profiles/:id` - Update patient profile
- `GET /admin/appointments` - List appointments
- `POST /admin/appointments` - Create appointment
- `PATCH /admin/appointments/:id` - Update appointment
- `PATCH /admin/appointments/:id/confirm` - Confirm appointment
- `PATCH /admin/appointments/:id/complete` - Complete appointment
- `PATCH /admin/appointments/:id/cancel` - Cancel appointment
- `GET /admin/results` - List lab results
- `GET /admin/results/:id` - Get result details

### Doctor Routes
- `GET /doctor/dashboard` - Dashboard statistics
- `GET /doctor/appointments` - List appointments
- `GET /doctor/appointments/:id` - Get appointment details
- `PATCH /doctor/appointments/:id/complete` - Complete appointment
- `POST /doctor/results` - Upload lab result
- `GET /doctor/results` - List results
- `GET /doctor/patients` - List patients

### Patient Routes
- `GET /patient/dashboard` - Dashboard information
- `GET /patient/profiles` - Get patient profiles
- `POST /patient/select-profile` - Select active profile
- `GET /patient/appointments` - List appointments
- `POST /patient/appointments` - Book appointment
- `PATCH /patient/appointments/:id/cancel` - Cancel appointment
- `GET /patient/results` - List lab results
- `GET /patient/results/:id/download` - Download result PDF

### Receptionist Routes
- `GET /receptionist/dashboard` - Dashboard statistics
- `GET /receptionist/patients` - List patients
- `POST /receptionist/patients` - Create patient
- `GET /receptionist/patients/:id` - Get patient details
- `POST /receptionist/patients/:id/profiles` - Add family profile
- `GET /receptionist/appointments` - List appointments
- `POST /receptionist/appointments` - Create appointment
- `PATCH /receptionist/appointments/:id/confirm` - Confirm appointment
- `PATCH /receptionist/appointments/:id/reschedule` - Reschedule appointment
- `PATCH /receptionist/appointments/:id/cancel` - Cancel appointment

## Testing Checklist Summary

### Manual Testing Required
- ✅ All authentication flows
- ✅ Role-based access control
- ✅ CRUD operations for each role
- ✅ File upload/download functionality
- ✅ Form validation and error handling
- ✅ Loading states and user feedback
- ✅ Responsive design testing
- ✅ Cross-browser compatibility

### Automated Testing
- Unit tests for API endpoints
- Integration tests for user flows
- Security testing for authentication
- Performance testing for file uploads

For detailed testing instructions, see [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

## GitHub Workflow

### Development Workflow
1. Create feature branch from `main`
2. Implement changes following coding standards
3. Test all functionality manually
4. Update documentation if needed
5. Commit changes with descriptive messages
6. Push to feature branch
7. Create pull request for review
8. Merge to `main` after approval

### Git Commands for Final Push
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "finalize frontend integration and documentation"

# Push to main branch
git push origin main
```

### .gitignore Configuration
```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Uploads directory
uploads/

# Logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in .env file
   - Verify MongoDB service status

2. **Frontend Not Loading**
   - Check if frontend server is running
   - Verify port is not in use
   - Check browser console for errors

3. **Authentication Issues**
   - Verify JWT_SECRET is set in .env
   - Check token expiration settings
   - Clear browser cookies/localStorage

4. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure PDF files are valid

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the testing checklist for common issues

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Maintainers**: Medical Lab Development Team