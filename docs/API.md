# API Documentation

## Overview

The Roc4Tech Attendance API is a RESTful API built with Node.js and Express. It provides comprehensive endpoints for attendance management, user management, leave management, and reporting.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

## Endpoints

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "employee"
  }
}
```

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "role": "employee",
  "department": "Engineering",
  "position": "Developer"
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "department": "Engineering",
  "position": "Senior Developer"
}
```

### Attendance

#### Clock In
```http
POST /attendance/clock-in
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY"
  },
  "notes": "Starting work"
}
```

#### Clock Out
```http
POST /attendance/clock-out
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY"
  },
  "notes": "Ending work"
}
```

#### Get My Attendance
```http
GET /attendance/my?page=1&limit=10&startDate=2023-01-01&endDate=2023-12-31
Authorization: Bearer <token>
```

#### Get Team Attendance (Manager/Admin)
```http
GET /attendance/team?page=1&limit=10&department=Engineering&status=present
Authorization: Bearer <token>
```

#### Start Break
```http
POST /attendance/break/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "breakType": "lunch",
  "notes": "Lunch break"
}
```

#### End Break
```http
POST /attendance/break/end
Authorization: Bearer <token>
```

### Leave Management

#### Create Leave Request
```http
POST /leaves
Authorization: Bearer <token>
Content-Type: application/json

{
  "leaveType": "annual",
  "startDate": "2023-12-20",
  "endDate": "2023-12-25",
  "reason": "Family vacation",
  "attachment": "path/to/file.pdf"
}
```

#### Get My Leave Requests
```http
GET /leaves/my?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Get Pending Leaves (Manager/Admin)
```http
GET /leaves/pending?page=1&limit=10
Authorization: Bearer <token>
```

#### Approve/Reject Leave
```http
PUT /leaves/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "comments": "Approved for vacation"
}
```

#### Cancel Leave Request
```http
PUT /leaves/:id/cancel
Authorization: Bearer <token>
```

#### Get Leave Balance
```http
GET /leaves/balance
Authorization: Bearer <token>
```

### User Management

#### Get Users (Admin/Manager)
```http
GET /users?page=1&limit=10&search=john&department=Engineering
Authorization: Bearer <token>
```

#### Get User by ID
```http
GET /users/:id
Authorization: Bearer <token>
```

#### Update User
```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "department": "Engineering",
  "position": "Senior Developer",
  "role": "employee",
  "isActive": true
}
```

#### Deactivate User
```http
PUT /users/:id/deactivate
Authorization: Bearer <token>
```

#### Get Departments
```http
GET /users/departments
Authorization: Bearer <token>
```

#### Get Managers
```http
GET /users/managers
Authorization: Bearer <token>
```

### Reports

#### Get Dashboard Stats
```http
GET /reports/dashboard
Authorization: Bearer <token>
```

#### Get Attendance Report
```http
GET /reports/attendance?startDate=2023-01-01&endDate=2023-12-31&department=Engineering
Authorization: Bearer <token>
```

#### Get Leave Report
```http
GET /reports/leaves?startDate=2023-01-01&endDate=2023-12-31
Authorization: Bearer <token>
```

#### Export Attendance Report
```http
GET /reports/attendance/export?startDate=2023-01-01&endDate=2023-12-31&format=csv
Authorization: Bearer <token>
```

#### Export Leave Report
```http
GET /reports/leaves/export?startDate=2023-01-01&endDate=2023-12-31&format=pdf
Authorization: Bearer <token>
```

## WebSocket Events

### Client to Server

#### Join Room
```javascript
socket.emit('join_room', userId);
```

#### Attendance Update
```javascript
socket.emit('attendance_update', {
  userId: 'uuid',
  managerId: 'uuid',
  type: 'clock_in',
  timestamp: new Date()
});
```

#### Leave Request
```javascript
socket.emit('leave_request', {
  userId: 'uuid',
  managerId: 'uuid',
  leaveType: 'annual',
  startDate: '2023-12-20',
  endDate: '2023-12-25'
});
```

### Server to Client

#### New Attendance
```javascript
socket.on('new_attendance', (data) => {
  console.log('New attendance:', data);
});
```

#### New Leave Request
```javascript
socket.on('new_leave_request', (data) => {
  console.log('New leave request:', data);
});
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Invalid or missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |

## Rate Limiting

- Login attempts: 5 per 15 minutes
- General API: 100 per 15 minutes
- File uploads: 10 per hour

## Pagination

List endpoints support pagination with `page` and `limit` parameters:

```http
GET /users?page=2&limit=20
```

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Filtering

Most list endpoints support filtering:

```http
GET /attendance/my?startDate=2023-01-01&endDate=2023-12-31&status=present
```

## Search

Search functionality is available on user endpoints:

```http
GET /users?search=john
```

## Sorting

Sorting can be specified with `sort` and `order` parameters:

```http
GET /users?sort=name&order=desc
```

## Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@roc4tech.com","password":"admin123"}'

# Get profile
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

### Using Postman

1. Import the API collection
2. Set up environment variables
3. Use the pre-request script to handle authentication

## SDKs and Libraries

### JavaScript/Node.js
```javascript
import { authService } from './services/authService';

// Login
const response = await authService.login('user@example.com', 'password');

// Get profile
const profile = await authService.getProfile();
```

### Python
```python
import requests

# Login
response = requests.post('http://localhost:5000/api/auth/login', json={
    'email': 'user@example.com',
    'password': 'password'
})
```

## Support

For API support:
- Check the troubleshooting guide
- Review example implementations
- Contact support@roc4tech.com
- Create GitHub issues for bugs

## Versioning

Current API version: **v1**

Base URL: `/api/v1`

Breaking changes will be released as new versions with appropriate deprecation notices.