# Roc4Tech Attendance Management System

A comprehensive, enterprise-grade attendance management solution built with modern technologies.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Docker (optional)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/roc4tech-attendance.git
   cd roc4tech-attendance
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```

4. **Or start manually**
   ```bash
   # Start backend
   cd backend && npm install && npm run dev
   
   # Start admin dashboard (new terminal)
   cd admin-dashboard && npm install && npm start
   
   # Start mobile app (new terminal)
   cd mobile-app && npm install && expo start
   ```

### Default Credentials
- **Admin**: admin@roc4tech.com / admin123
- **Manager**: john.manager@roc4tech.com / manager123
- **Employee**: alice@roc4tech.com / employee123

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
├── docker-compose.yml      # Docker configuration
├── nginx.conf             # Nginx configuration
└── README.md              # This file
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **Socket.IO** - Real-time updates

### Mobile App
- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **React Native Paper** - UI components

### Admin Dashboard
- **React.js** - Frontend framework
- **Material-UI** - UI components
- **React Router** - Routing
- **Recharts** - Data visualization

## 📋 Features

### Core Features
- ✅ Real-time attendance tracking with GPS
- ✅ Comprehensive leave management
- ✅ Role-based access control
- ✅ Advanced reporting and analytics
- ✅ Mobile app with offline support
- ✅ WebSocket-powered live updates

### Advanced Features
- ✅ Break management
- ✅ Overtime calculation
- ✅ Multi-department support
- ✅ Email notifications
- ✅ Export capabilities (CSV, PDF)
- ✅ Audit trail

## 🚀 Getting Started

### Development Setup

1. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb roc4tech_attendance
   
   # Run migrations
   cd backend && npm run migrate
   
   # Seed database (optional)
   npm run seed
   ```

2. **Backend API**
   ```bash
   cd backend
   npm install
   npm run dev
   # API runs on http://localhost:5000
   ```

3. **Admin Dashboard**
   ```bash
   cd admin-dashboard
   npm install
   npm start
   # Dashboard runs on http://localhost:3000
   ```

4. **Mobile App**
   ```bash
   cd mobile-app
   npm install
   expo start
   # Follow Expo instructions
   ```

### Production Deployment

#### Using Docker
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Manual Deployment
1. Setup production database
2. Configure environment variables
3. Build applications
4. Setup reverse proxy (Nginx)
5. Configure SSL certificates

## 📊 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/my` - Get my attendance

### Leave Management
- `POST /api/leaves` - Create leave request
- `GET /api/leaves/my` - Get my leaves
- `PUT /api/leaves/:id/approve` - Approve leave

Full API documentation available at `/docs/API.md`

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
```

## 🐳 Docker Support

### Development
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up backend
```

### Production
```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📱 Mobile App

### Running the App
```bash
cd mobile-app
expo start
```

### Building for Production
```bash
# iOS
expo build:ios

# Android
expo build:android
```

## 💻 Admin Dashboard

### Features
- Real-time attendance monitoring
- Employee management
- Leave request approval
- Comprehensive reporting
- System settings

### Access
- Navigate to `http://localhost:3000`
- Login with admin credentials

## 🔐 Security

### Features
- JWT authentication
- Role-based access control
- Input validation
- Rate limiting
- CORS protection
- HTTPS support

### Best Practices
- Use strong passwords
- Enable 2FA where possible
- Regular security audits
- Keep dependencies updated

## 📈 Monitoring

### Health Checks
- API: `GET /health`
- Database: Automatic health checks
- Services: Docker health checks

### Logging
- Application logs
- Database logs
- System logs
- Error tracking

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd admin-dashboard && npm test

# Mobile tests
cd mobile-app && npm test
```

## 📚 Documentation

### Available Documentation
- `docs/README.md` - Project overview
- `docs/API.md` - API documentation
- `docs/DATABASE.md` - Database schema
- `docs/DEPLOYMENT.md` - Deployment guide

### Business Documents
- `reports/COMPETITIVE_BATTLECARD.txt` - Market analysis
- `reports/PROJECT_COST_ESTIMATION.txt` - Cost analysis
- `slides/EXECUTIVE_SLIDE_DECK.txt` - Presentation materials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- ESLint configuration
- Prettier formatting
- Conventional commits
- Pull request templates

## 📞 Support

### Getting Help
- Check documentation
- Review troubleshooting guide
- Create GitHub issue
- Contact support team

### Community
- GitHub Discussions
- Stack Overflow
- Discord Channel (coming soon)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Thanks to all contributors
- Open source libraries used
- Design inspiration
- Testing tools and frameworks

---

**Built with ❤️ by the Roc4Tech Team**

For more information, visit our [documentation](docs/README.md) or check out our [website](https://roc4tech.com).