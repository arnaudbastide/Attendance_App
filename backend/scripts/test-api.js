const axios = require('axios');

const testApi = async () => {
    try {
        console.log('1. Attempting login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@roc4tech.com',
            password: 'admin123'
        });

        if (loginRes.data.success) {
            console.log('Login successful!');
            const token = loginRes.data.token;
            console.log('Token received.');

            console.log('\n2. Fetching users (Page 1, Limit 10)...');
            try {
                const usersRes = await axios.get('http://localhost:5000/api/users?page=1&limit=10', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('User API Response Status:', usersRes.status);
                console.log('Success:', usersRes.data.success);
                console.log('Total Users:', usersRes.data.pagination.total);
                console.log('Users in this page:', usersRes.data.users.length);

                if (usersRes.data.pagination.total === 27) {
                    console.log('\nSUCCESS: API is returning correct count of 27 users.');
                } else {
                    console.log(`\nFAILURE: API returned total count of ${usersRes.data.pagination.total}`);
                }

            } catch (apiError) {
                console.error('API REQUEST FAILED:', apiError.response ? apiError.response.data : apiError.message);
                console.error('Status:', apiError.response ? apiError.response.status : 'N/A');
            }

        } else {
            console.error('Login failed:', loginRes.data);
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
};

testApi();
