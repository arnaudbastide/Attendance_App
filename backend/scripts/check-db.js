const { User, Attendance } = require('../models');
const sequelize = require('../config/database');

const checkCounts = async () => {
    try {
        console.log('Connecting to database...');
        const userCount = await User.count();
        console.log(`\n=== DATABASE COUNTS ===`);
        console.log(`Users: ${userCount}`);

        if (userCount > 10) {
            console.log('SUCCESS: Data appears to be seeded.');

            // Try the exact query from the controller to test associations
            console.log('Testing controller query with associations...');
            try {
                const users = await User.findAndCountAll({
                    attributes: { exclude: ['password'] },
                    include: [
                        {
                            model: User,
                            as: 'manager',
                            attributes: ['id', 'name', 'email']
                        }
                    ],
                    limit: 10,
                    offset: 0
                });
                console.log(`Controller query successful! Retrieved ${users.rows.length} users.`);

                // Print first user and their manager to verify structure
                const firstUser = users.rows[0];
                console.log(`Sample User: ${firstUser.name} (${firstUser.email})`);
                if (firstUser.manager) {
                    console.log(`Manager: ${firstUser.manager.name}`);
                } else {
                    console.log('No manager assigned (which is valid for top admins/managers)');
                }

            } catch (queryError) {
                console.error('CONTROLLER QUERY FAILED:', queryError);
            }
        } else {
            console.log('FAILURE: Data count is too low.');
        }
    } catch (error) {
        console.error('Error checking counts:', error);
    } finally {
        await sequelize.close();
    }
};

checkCounts();
