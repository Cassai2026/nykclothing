const request = require('supertest');
const app = require('../server');

describe('Nyk Clothing API', () => {
  it('returns healthy status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('Vault is secure and operational');
  });

  it('rejects invalid checkout payload', async () => {
    const res = await request(app)
      .post('/api/payments/create-checkout-session')
      .send({ items: [{ product_variant_id: -1, quantity: 0 }] });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Invalid data format');
  });
});
