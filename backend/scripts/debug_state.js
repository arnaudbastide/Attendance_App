const { Sequelize, QueryTypes } = require('sequelize');
const fs = require('fs');
const util = require('util');
require('dotenv').config({ path: '../.env' });

const logFile = fs.createWriteStream('debug_output.txt', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) { // Overwrite console.log
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};
console.table = function (d) {
    if (Array.isArray(d) && d.length > 0) {
        // Simple manual table implementation for file output
        const keys = Object.keys(d[0]);
        const header = keys.join(' | ');
        const separator = keys.map(k => '-'.repeat(k.length)).join('-|-');
        logFile.write('\n' + header + '\n' + separator + '\n');
        d.forEach(row => {
            logFile.write(keys.map(k => row[k]).join(' | ') + '\n');
        });
        logFile.write('\n');
    } else {
        logFile.write(util.format(d) + '\n');
    }
    logStdout.write(util.format(d) + '\n');
};

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

async function runDebugQueries() {
    try {
        await sequelize.authenticate();
        console.log('--- DEBUG STATE START ---');

        // 1. ALL USERS
        const users = await sequelize.query(
            'SELECT id, name, email, "managerId", "isActive" FROM "Users" ORDER BY name',
            { type: QueryTypes.SELECT }
        );
        console.log('\n1. ALL USERS:');
        console.table(users);

        // 2. ATTENDANCE TODAY
        const attendance = await sequelize.query(
            `SELECT 
        a.id, u.name, a.status, a."clockIn", a."clockOut", a.date
      FROM "Attendances" a
      JOIN "Users" u ON a."userId" = u.id
      WHERE DATE(a.date) = CURRENT_DATE
      ORDER BY u.name`,
            { type: QueryTypes.SELECT }
        );
        console.log('\n2. ATTENDANCE TODAY:');
        console.table(attendance);

        // 3. LEAVES
        const leaves = await sequelize.query(
            `SELECT 
        l.id, u.name, l."leaveType", l."startDate", l."endDate", l.status
      FROM "Leaves" l
      JOIN "Users" u ON l."userId" = u.id
      ORDER BY l."startDate"`,
            { type: QueryTypes.SELECT }
        );
        console.log('\n3. ALL LEAVES:');
        console.table(leaves);

        // 4. TRUE ABSENT (DB Logic)
        const absent = await sequelize.query(
            `SELECT u.name, u.email
      FROM "Users" u
      WHERE u."isActive" = true
      AND NOT EXISTS (
        SELECT 1 FROM "Attendances" a 
        WHERE a."userId" = u.id 
        AND a.date = CURRENT_DATE
      )`,
            { type: QueryTypes.SELECT }
        );
        console.log('\n4. TRUE ABSENT (Calculated via SQL):');
        console.table(absent);

        // 5. MANAGER RELATIONSHIPS
        const relations = await sequelize.query(
            `SELECT 
        m.name as manager_name,
        e.name as employee_name
      FROM "Users" e
      LEFT JOIN "Users" m ON e."managerId" = m.id
      WHERE e."isActive" = true
      ORDER BY m.name, e.name`,
            { type: QueryTypes.SELECT }
        );
        console.log('\n5. MANAGER RELATIONSHIPS:');
        console.table(relations);

        console.log('--- DEBUG STATE END ---');
        process.exit(0);
    } catch (error) {
        console.error('Debug script failed:', error);
        process.exit(1);
    }
}

runDebugQueries();
