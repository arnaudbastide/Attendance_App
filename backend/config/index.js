const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Validate critical environment variables in production
if (process.env.NODE_ENV === 'production') {
    const required = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,
    apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api`,

    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        logging: process.env.NODE_ENV === 'development' ? console.log : false
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE || '7d'
    },

    cors: {
        origins: [
            process.env.FRONTEND_URL,
            process.env.MOBILE_APP_URL,
            'http://localhost:3000',
            'http://localhost:3001'
        ].filter(Boolean),
        credentials: true
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },

    uploads: {
        path: path.join(__dirname, '../uploads'),
        maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5000000
    }
};
