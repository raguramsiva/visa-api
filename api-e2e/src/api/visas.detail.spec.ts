import axios from 'axios';
import { API, helpers } from '../support/test-helpers';

describe('GET /api/visas/:id', () => {
  it('should return a visa by id', async () => {
    const visaId = await helpers.getFirstVisaId();
    const res = await axios.get(API.visa(visaId));

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(visaId);
    expect(res.data).toHaveProperty('country');
    expect(res.data).toHaveProperty('visaType');
    expect(res.data).toHaveProperty('price');
  });

  it('should return 404 for non-existent visa', async () => {
    await helpers.expectError(() => axios.get(API.visa(99999)), 404);
  });

  it('should return 400 for invalid id (non-numeric, negative, zero)', async () => {
    await helpers.expectError(() => axios.get(`${API.visas}/abc`), 400);
    await helpers.expectError(() => axios.get(`${API.visas}/-1`), 400);
    await helpers.expectError(() => axios.get(`${API.visas}/0`), 400);
  });
});
