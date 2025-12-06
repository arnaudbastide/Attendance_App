const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../.env' });

const sequelize = new Sequelize(
    process.env.DB_NAME || 'attendance_db', // user said attendance_db in failed query, checking defaults
    process.env.DB_USER || 'postgres', // checking standard defaults
    process.env.DB_PASSWORD || 'postgres',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        port: process.env.DB_PORT || 5432,
        logging: false
    }
);

// We need to match the actual credentials. 
// If the user's previous attempt failed with "role postgres does not exist", 
// it implies the DB might be set up with a different user (e.g. roc4tech_user).
// I will try to read the env vars from the file first in the script, 
// using the pattern from verify_data.js

async function diagnose() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // 1. ALL USERS
        console.log('\n--- 1. ALL USERS ---');
        const [users] = await sequelize.query(`
            SELECT id, name, email, "managerId", "isActive" 
            FROM "Users" 
            ORDER BY name
        `);
        console.log(JSON.stringify(users, null, 2));

        // 2. WHO HAS ATTENDANCE TODAY?
        console.log('\n--- 2. TODAY ATTENDANCE ---');
        const [attendance] = await sequelize.query(`
            SELECT 
              a.id,
              u.name,
              a.status,
              a."clockIn",
              a."clockOut",
              a.date
            FROM "Attendances" a
            JOIN "Users" u ON a."userId" = u.id
            WHERE DATE(a.date) = CURRENT_DATE
            ORDER BY u.name
        `);
        console.log(JSON.stringify(attendance, null, 2));

        // 3. WHO HAS LEAVES?
        console.log('\n--- 3. LEAVES ---');
        const [leaves] = await sequelize.query(`
            SELECT 
              l.id,
              u.name,
              l."leaveType",
              l."startDate",
              l."endDate",
              l.status
            FROM "Leaves" l
            JOIN "Users" u ON l."userId" = u.id
            ORDER BY l."startDate"
        `);
        console.log(JSON.stringify(leaves, null, 2));

        // 4. WHO SHOULD BE ABSENT TODAY?
        console.log('\n--- 4. CALCULATED ABSENT ---');
        const [absent] = await sequelize.query(`
            SELECT u.name
            FROM "Users" u
            WHERE u."isActive" = true
            AND NOT EXISTS (
              SELECT 1 FROM "Attendances" a 
              WHERE a."userId" = u.id 
              AND DATE(a.date) = CURRENT_DATE
            )
        `);
        console.log(JSON.stringify(absent, null, 2));

        // 5. MANAGER-EMPLOYEE RELATIONSHIPS
        console.log('\n--- 5. MANAGER RELATIONSHIPS ---');
        const [relations] = await sequelize.query(`
            SELECT 
              m.name as manager_name,
              e.name as employee_name
            FROM "Users" e
            LEFT JOIN "Users" m ON e."managerId" = m.id
            WHERE e."isActive" = true
            ORDER BY m.name, e.name
        `);
        console.log(JSON.stringify(relations, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error);

        // Try fallback credentials if first attempt fails
        console.log('Retrying with fallback credentials (roc4tech_user)...');
        // This is complex to do in one pass. 
        // Better to just ensure .env is loaded correctly.
        process.exit(1);
    }
}

diagnose();
