# Roc4Tech Attendance Management System

A comprehensive, enterprise-grade attendance management solution built with modern technologies.

## 🚀 Project Overview

Roc4Tech Attendance is a full-stack attendance management system designed for workforce teams. It provides real-time attendance tracking, leave management, comprehensive reporting, and analytics capabilities.

## 📁 Project Structure

```
roc4tech_attendance_app/
├── backend/                 # Node.js REST API
├── mobile-app/             # React Native mobile application
├── admin-dashboard/        # React.js admin dashboard
├── docs/                   # Documentation
├── reports/                # Business reports and analysis
├── slides/                 # Presentation materials
├── wordpress-site/         # Marketing website
└── README.md              # Main project README
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **Socket.IO** - Real-time updates
- **Docker** - Containerization

### Mobile App
- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **React Native Paper** - UI components
- **Socket.IO Client** - Real-time updates

### Admin Dashboard
- **React.js** - Frontend framework
- **Material-UI** - UI components
- **React Router** - Routing
- **Recharts** - Data visualization
- **Axios** - HTTP client

## 📋 Features

### Core Features
- ✅ **Real-time Attendance Tracking** - Clock in/out with GPS location
- ✅ **Leave Management** - Request, approve, and track leave
- ✅ **Role-based Access Control** - Admin, Manager, Employee roles
- ✅ **Comprehensive Reporting** - Export reports in CSV, PDF formats
- ✅ **Analytics Dashboard** - Visual charts and KPIs
- ✅ **WebSocket Integration** - Real-time updates and notifications
- ✅ **Offline Support** - Mobile app works without internet
- ✅ **GPS Location Tracking** - Track employee location on clock in/out

### Advanced Features
- ✅ **Break Management** - Track lunch and other breaks
- ✅ **Overtime Calculation** - Automatic overtime tracking
- ✅ **Multi-department Support** - Organize by departments
- ✅ **Email Notifications** - Automated email alerts
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Export Capabilities** - CSV, PDF, Excel formats
- ✅ **Audit Trail** - Complete history of all actions

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- React Native development environment
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/roc4tech-attendance.git
   cd roc4tech-attendance
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run seed
   npm start
   ```

3. **Setup Admin Dashboard**
   ```bash
   cd admin-dashboard
   npm install
   npm start
   ```

4. **Setup Mobile App**
   ```bash
   cd mobile-app
   npm install
   expo start
   ```

### Default Login Credentials
- **Admin**: admin@roc4tech.com / admin123
- **Manager**: john.manager@roc4tech.com / manager123
- **Employee**: alice@roc4tech.com / employee123

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Attendance Endpoints
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/my` - Get my attendance
- `GET /api/attendance/team` - Get team attendance (Manager/Admin)
- `POST /api/attendance/break/start` - Start break
- `POST /api/attendance/break/end` - End break

### Leave Endpoints
- `POST /api/leaves` - Create leave request
- `GET /api/leaves/my` - Get my leave requests
- `GET /api/leaves/pending` - Get pending leaves (Manager/Admin)
- `PUT /api/leaves/:id/approve` - Approve/reject leave
- `PUT /api/leaves/:id/cancel` - Cancel leave request
- `GET /api/leaves/balance` - Get leave balance

### Report Endpoints
- `GET /api/reports/dashboard` - Get dashboard stats
- `GET /api/reports/attendance` - Get attendance report
- `GET /api/reports/leaves` - Get leave report

### User Management Endpoints
- `GET /api/users` - Get users list
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/deactivate` - Deactivate user
- `GET /api/users/departments` - Get departments
- `GET /api/users/managers` - Get managers

## 🔧 Configuration

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=roc4tech_attendance
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🐳 Docker Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

### Individual Services
```bash
# Backend
cd backend
docker build -t roc4tech-backend .
docker run -p 5000:5000 roc4tech-backend

# Admin Dashboard
cd admin-dashboard
docker build -t roc4tech-admin .
docker run -p 3000:3000 roc4tech-admin
```

## 📱 Mobile App Features

### Employee Features
- Clock in/out with GPS location
- View attendance history
- Request leave
- View leave balance
- Offline support
- Push notifications

### Manager Features
- Approve/reject leave requests
- View team attendance
- Generate reports
- Real-time notifications

## 💻 Admin Dashboard Features

### Dashboard
- Real-time attendance overview
- Key performance indicators
- Interactive charts and graphs
- Recent activity feed

### Employee Management
- Add/edit employees
- Assign roles and departments
- Deactivate/activate accounts
- Bulk operations

### Attendance Management
- View all attendance records
- Filter by date, department, status
- Export reports
- Manual adjustments

### Leave Management
- View all leave requests
- Approve/reject leaves
- Leave balance management
- Leave policy configuration

### Reports & Analytics
- Comprehensive reports
- Custom date ranges
- Multiple export formats
- Visual analytics

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- HTTPS support

## 📈 Performance Optimization

- Database indexing
- Query optimization
- Image compression
- Lazy loading
- Caching strategies
- CDN integration

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Mobile App Testing
```bash
cd mobile-app
npm test
```

### Admin Dashboard Testing
```bash
cd admin-dashboard
npm test
```

## 🚀 Production Deployment

### Prerequisites
- Production database
- SSL certificates
- Domain name
- Email service
- Monitoring tools

### Deployment Steps
1. Set up production database
2. Configure environment variables
3. Build and deploy backend
4. Build and deploy admin dashboard
5. Deploy mobile app to stores
6. Configure monitoring and logging
7. Set up backup strategies

## 📞 Support

For support and questions:
- Email: support@roc4tech.com
- Documentation: /docs
- Issues: GitHub Issues
- Discussions: GitHub Discussions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Thanks to all contributors
- Open source libraries used
- Design inspiration
- Testing tools and frameworks

---

**Built with ❤️ by the Roc4Tech Team**