const request = require('supertest');
const express = require('express');
const { validateData, mintTwinSchema } = require('../middleware/validate');

const app = express();
app.use(express.json());

app.post('/api/twins/mint', validateData(mintTwinSchema), (req, res) => {
  res.status(201).json({ status: "Garment successfully minted to circular lifecycle log" });
});

describe('NFC Digital Passport Minting Tests', () => {
  it('Should approve minting when valid user and secure NFC hash are supplied', async () => {
    const res = await request(app)
      .post('/api/twins/mint')
      .send({
        user_id: "00000000-0000-0000-0000-000000000000",
        variant_name: "Sovereign Luxury Hoodie - Black / M",
        nfc_secure_tag: "nfc_hash_secure_123456"
      });
    
    expect(res.statusCode).toEqual(201);
  });

  it('Should block minting if the NFC tag string structure is dangerously short', async () => {
    const res = await request(app)
      .post('/api/twins/mint')
      .send({
        user_id: "00000000-0000-0000-0000-000000000000",
        variant_name: "Sovereign Luxury Hoodie",
        nfc_secure_tag: "short_tag" // Zod requires min 12 characters
      });
    
    expect(res.statusCode).toEqual(400);
  });
});
