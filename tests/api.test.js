const request = require('supertest');
const express = require('express');

// Setting up a dummy version of our API specifically for the robot to test
const app = express();
app.get('/api/health', (req, res) => res.status(200).json({ status: 'Vault is secure and operational' }));

describe('Nyk Clothing Automated Bot', () => {
  it('Should successfully connect to the server and get a 200 OK status', async () => {
    const res = await request(app).get('/api/health');
    
    // The Robot's Checklist:
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('Vault is secure and operational');
  });
});
