const { User } = require('../models');
const sequelize = require('../config/database');

(async () => {
    try {
        await sequelize.authenticate();
        const u = await User.findOne({ where: { email: 'employee1@roc4tech.com' } });
        console.log('--- RESULT ---');
        console.log(u ? u.name : 'User Not Found');
        console.log('--------------');
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
})();
