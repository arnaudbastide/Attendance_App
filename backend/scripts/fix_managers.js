const { User } = require('../models');
const sequelize = require('../config/database');

async function fixManagers() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // 1. Find John Manager
        const manager = await User.findOne({ where: { email: 'john.manager@roc4tech.com' } });
        if (!manager) {
            console.error('❌ John Manager not found!');
            process.exit(1);
        }
        console.log(`Found Manager: ${manager.name} (${manager.id})`);

        // 2. Find Orphan Users (Bob Designer, Test Admin)
        const orphans = await User.findAll({
            where: {
                email: ['bob@roc4tech.com', 'testadmin@example.com'] // Explicitly targeting these two
            }
        });

        console.log(`Found ${orphans.length} orphans to fix.`);

        // 3. Update them
        for (const user of orphans) {
            if (user.managerId !== manager.id) {
                user.managerId = manager.id;
                await user.save();
                console.log(`✅ Updated ${user.name} -> Manager: ${manager.name}`);
            } else {
                console.log(`ℹ️ ${user.name} is already assigned correctly.`);
            }
        }

        console.log('🎉 Fix completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixManagers();
