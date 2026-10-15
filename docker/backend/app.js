const express = require('express');
const cors = require('cors');
const os = require('os');
const client = require('prom-client');

const ENVIRONMENT = process.env.APP_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * App factory: keeps the Express app separate from app.listen() so that
 * unit tests (supertest) can import it without opening a real port.
 */
function createApp() {
    const app = express();
    const PORT = process.env.PORT || 5000;

    // ---- Prometheus metrics (own registry => safe to create many apps in tests)
    const register = new client.Registry();
    client.collectDefaultMetrics({ register }); // CPU, memory, event loop, GC...

    const httpRequestsTotal = new client.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
        registers: [register],
    });

    const httpRequestDuration = new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request latency in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
        registers: [register],
    });

    app.use(cors());
    app.use(express.json());

    // Request logger
    app.use((req, res, next) => {
        if (process.env.NODE_ENV !== 'test') {
            console.log(`[${new Date().toISOString()}] [${LOG_LEVEL.toUpperCase()}] ${req.method} ${req.url}`);
        }
        next();
    });

    // Metrics middleware (records every request except the scrape itself)
    app.use((req, res, next) => {
        if (req.path === '/metrics') return next();
        const end = httpRequestDuration.startTimer();
        res.on('finish', () => {
            const labels = {
                method: req.method,
                route: req.route ? req.route.path : 'unmatched',
                status_code: res.statusCode,
            };
            httpRequestsTotal.inc(labels);
            end(labels);
        });
        next();
    });

    // Root route
    app.get('/', (req, res) => {
        res.json({
            message: 'FA1 Microservices Backend API is up and running!',
            environment: ENVIRONMENT,
            version: '1.0.0',
        });
    });

    // Health check endpoint (also used by Kubernetes probes)
    app.get('/api/health', (req, res) => {
        res.status(200).json({
            status: 'UP',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });

    // Environment status endpoint
    app.get('/api/status', (req, res) => {
        res.json({
            environment: ENVIRONMENT,
            service: 'fa1-backend-api',
            status: 'healthy',
            hostname: os.hostname(),
            platform: os.platform(),
            timestamp: new Date().toISOString(),
            config: { log_level: LOG_LEVEL, port: PORT },
        });
    });

    // Prometheus scrape endpoint
    app.get('/metrics', async (req, res) => {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    });

    return app;
}

module.exports = { createApp };
