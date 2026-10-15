const request = require('supertest');
const { createApp } = require('../app');

describe('Backend API', () => {
    let app;
    beforeEach(() => {
        app = createApp();
    });

    test('GET /api/health returns 200 and status UP', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('DOWN');
        expect(typeof res.body.uptime).toBe('number');
    });

    test('GET /api/status reports service name and healthy state', async () => {
        const res = await request(app).get('/api/status');
        expect(res.statusCode).toBe(200);
        expect(res.body.service).toBe('fa1-backend-api');
        expect(res.body.status).toBe('healthy');
        expect(res.body.config).toHaveProperty('port');
    });

    test('GET / returns the welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/up and running/);
    });

    test('unknown routes return 404', async () => {
        const res = await request(app).get('/does-not-exist');
        expect(res.statusCode).toBe(404);
    });

    test('GET /metrics exposes Prometheus metrics incl. request counter', async () => {
        await request(app).get('/api/health');
        await request(app).get('/api/health');
        const res = await request(app).get('/metrics');
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('http_requests_total{method="GET",route="/api/health",status_code="200"} 2');
        expect(res.text).toContain('process_cpu_seconds_total');
        expect(res.text).toContain('process_resident_memory_bytes');
    });
});

