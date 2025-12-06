const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config({ path: '../.env' });

const sequelize = new Sequelize(
    process.env.DB_NAME || 'roc4tech_attendance',
    process.env.DB_USER || 'roc4tech_user',
    process.env.DB_PASSWORD || 'your_secure_password',
    {
        host: 'localhost',
        dialect: 'postgres',
        port: 5432,
        logging: false
    }
);

async function run() {
    try {
        await sequelize.authenticate();

        const results = {};

        results.allUsers = await sequelize.query(
            'SELECT id, name, email, "managerId", "isActive" FROM "Users" ORDER BY name',
            { type: QueryTypes.SELECT }
        );

        results.attendanceToday = await sequelize.query(
            `SELECT 
        a.id, u.name, a.status, a."clockIn", a."clockOut", a.date
      FROM "Attendances" a
      JOIN "Users" u ON a."userId" = u.id
      WHERE DATE(a.date) = CURRENT_DATE
      ORDER BY u.name`,
            { type: QueryTypes.SELECT }
        );

        results.leaves = await sequelize.query(
            `SELECT 
        l.id, u.name, l."leaveType", l."startDate", l."endDate", l.status
      FROM "Leaves" l
      JOIN "Users" u ON l."userId" = u.id
      ORDER BY l."startDate"`,
            { type: QueryTypes.SELECT }
        );

        results.trueAbsent = await sequelize.query(
            `SELECT u.name, u.email
      FROM "Users" u
      WHERE u."isActive" = true
      AND NOT EXISTS (
        SELECT 1 FROM "Attendances" a 
        WHERE a."userId" = u.id 
        AND DATE(a.date) = CURRENT_DATE
      )`,
            { type: QueryTypes.SELECT }
        );

        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

run();
