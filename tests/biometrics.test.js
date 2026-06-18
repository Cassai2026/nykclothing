const request = require('supertest');
const express = require('express');
const { validateData, biometricSchema } = require('../middleware/validate');

const app = express();
app.use(express.json());

// Dummy endpoint simulating our live biometric route for the bot to test
app.post('/api/users/biometrics', validateData(biometricSchema), (req, res) => {
  const { chest_cm } = req.body;
  let size = 'M';
  if (chest_cm < 95) size = 'S';
  else if (chest_cm >= 95 && chest_cm < 105) size = 'M';
  else if (chest_cm >= 105 && chest_cm < 115) size = 'L';
  else size = 'XL';
  
  res.status(200).json({ status: "Dimensions verified", suggested_fit: size });
});

describe('AI Biometric Sizing Engine Tests', () => {
  it('Should correctly calculate a Size Small for chest dimensions under 95cm', async () => {
    const res = await request(app)
      .post('/api/users/biometrics')
      .send({
        user_id: "00000000-0000-0000-0000-000000000000",
        height_cm: 175,
        chest_cm: 90,
        waist_cm: 80,
        hips_cm: 95
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.suggested_fit).toEqual('S');
  });

  it('Should reject requests with missing or corrupted measurement data', async () => {
    const res = await request(app)
      .post('/api/users/biometrics')
      .send({
        user_id: "00000000-0000-0000-0000-000000000000",
        height_cm: -10, // Invalid coordinate
        chest_cm: 100
      });
    
    expect(res.statusCode).toEqual(400); // Should be blocked by Zod bouncer
  });
});
