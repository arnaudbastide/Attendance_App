const sequelize = require('../config/database');
const seedExtended = require('./seed-extended');

const resetAndSeed = async () => {
    try {
        console.log('Force syncing database...');
        // Force sync drops tables if they exist and recreates them
        await sequelize.sync({ force: true });
        console.log('Database tables dropped and recreated successfully.');

        console.log('Starting extended seed...');
        await seedExtended();
        console.log('Reset and Seed sequence completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during reset and seed:', error);
        process.exit(1);
    }
};

resetAndSeed();
