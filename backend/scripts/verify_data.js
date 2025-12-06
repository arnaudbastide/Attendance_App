const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

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

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const [users] = await sequelize.query('SELECT COUNT(*) FROM "Users"');
        const [attendances] = await sequelize.query('SELECT COUNT(*) FROM "Attendances"');
        const [leaves] = await sequelize.query('SELECT COUNT(*) FROM "Leaves"');
        const [present] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM "Attendances" 
      WHERE date = CURRENT_DATE 
      AND status IN ('present', 'late', 'early_leave')
    `);

        // Manager Team Count (John Manager)
        const [managerTeam] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM "Users" 
      WHERE "managerId" = (SELECT id FROM "Users" WHERE email = 'john.manager@roc4tech.com')
    `);

        // Absent Count
        const [absent] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM "Users" u
      WHERE u."isActive" = true 
      AND NOT EXISTS (
        SELECT 1 FROM "Attendances" a 
        WHERE a."userId" = u.id 
        AND a.date = CURRENT_DATE
      )
    `);

        console.log('--- VERIFICATION RESULTS ---');
        console.log(`Users Input: ${users[0].count}`);
        console.log(`Attendances Total: ${attendances[0].count}`);
        console.log(`Leaves Total: ${leaves[0].count}`);
        console.log(`Present Today (incl late/early): ${present[0].count}`);
        console.log(`Manager Team Count: ${managerTeam[0].count}`);
        console.log(`Absent Count: ${absent[0].count}`);
        console.log('---------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

verify();
