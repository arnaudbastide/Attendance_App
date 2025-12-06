const request = require('supertest');
const app = require('../server');
const { User, Attendance } = require('../models');
const jwt = require('jsonwebtoken');

describe('Attendance API', () => {
    let adminToken;
    let adminUser;

    beforeAll(async () => {
        // Create or find admin user
        try {
            adminUser = await User.findOne({ where: { email: 'testadmin@example.com' } });
            if (!adminUser) {
                adminUser = await User.create({
                    id: '550e8400-e29b-41d4-a716-446655440001',
                    name: 'Test Admin',
                    email: 'testadmin@example.com',
                    password: 'password123',
                    role: 'admin',
                    department: 'IT'
                });
            }

            adminToken = jwt.sign(
                { id: adminUser.id, role: adminUser.role },
                process.env.JWT_SECRET || 'secret_key',
                { expiresIn: '1h' }
            );
        } catch (e) {
            console.error("Setup failed:", e);
        }
    });

    afterAll(async () => {
        // Cleanup if necessary
        if (adminUser) {
            // await Attendance.destroy({ where: { userId: adminUser.id } });
            // await adminUser.destroy();
        }
    });

    describe('GET /api/attendance/team', () => {
        it('should return team attendance for admin', async () => {
            const res = await request(app)
                .get('/api/attendance/team')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.attendances)).toBe(true);
        });
    });

    describe('POST /api/attendance/clock-in', () => {
        it('should allow admin to clock in', async () => {
            // Cleanup today's attendance first to ensure fresh clock-in
            const today = new Date().toISOString().split('T')[0];
            await Attendance.destroy({
                where: {
                    userId: adminUser.id,
                    date: today
                }
            });

            const res = await request(app)
                .post('/api/attendance/clock-in')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    location: { lat: 0, lng: 0 }
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
        });
    });
});
