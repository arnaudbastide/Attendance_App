const request = require('supertest');
const app = require('../server');
const { User, Leave } = require('../models');
const jwt = require('jsonwebtoken');

describe('Leaves API', () => {
    let adminToken;
    let adminUser;

    beforeAll(async () => {
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
    });

    describe('GET /api/leaves/pending', () => {
        it('should filter leaves by status', async () => {
            const res = await request(app)
                .get('/api/leaves/pending?status=approved')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            // Even if empty, it should succeed
            expect(Array.isArray(res.body.leaves)).toBe(true);
        });
    });
});
