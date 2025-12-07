const { User, Attendance } = require('./models');

async function checkStatus() {
    try {
        const email = 'alice@roc4tech.com';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User NOT FOUND:', email);
            return;
        }

        console.log('User Found:', user.toJSON());

        const attendances = await Attendance.findAll({
            where: { userId: user.id },
            order: [['createdAt', 'DESC']]
        });

        console.log(`Found ${attendances.length} attendance records.`);
        attendances.forEach(a => {
            console.log(`- ID: ${a.id}, Date: ${a.date}, In: ${a.clockIn}, Out: ${a.clockOut}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkStatus();
