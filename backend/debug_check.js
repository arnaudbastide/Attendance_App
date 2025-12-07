const { User } = require('./models');

async function debugUser() {
    try {
        console.log('--- DEBUG USER CHECK ---');
        const users = await User.findAll({ attributes: ['id', 'email', 'isActive', 'role'] });
        console.log(`Total Users in DB: ${users.length}`);
        users.forEach(u => console.log(`- ${u.email} (ID: ${u.id}, Active: ${u.isActive})`));
        console.log('------------------------');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

debugUser();
