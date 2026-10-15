const { createApp } = require('./app');

const PORT = process.env.PORT || 5000;
const ENVIRONMENT = process.env.APP_ENV || 'development';

createApp().listen(PORT, '0.0.0.0', () => {
    console.log(`FA1 Backend Service listening on port ${PORT} in ${ENVIRONMENT.toUpperCase()} environment`);
});
