import axios from 'axios';
import { API, helpers } from '../support/test-helpers';

describe('PUT /api/visas/:id', () => {
  it('should update single and multiple fields', async () => {
    const visaId = await helpers.getFirstVisaId();

    const singleUpdate = await axios.put(API.visa(visaId), {
      price: 999,
    });
    expect(singleUpdate.status).toBe(200);
    expect(singleUpdate.data.price).toBe(999);

    const multiUpdate = await axios.put(API.visa(visaId), {
      price: 500,
      country: 'Updated Country',
      numberOfEntries: 'Multiple',
    });
    expect(multiUpdate.status).toBe(200);
    expect(multiUpdate.data.price).toBe(500);
    expect(multiUpdate.data.country).toBe('Updated Country');
    expect(multiUpdate.data.numberOfEntries).toBe('Multiple');
  });

  it('should return unchanged visa when no fields provided', async () => {
    const visaId = await helpers.getFirstVisaId();
    const before = await axios.get(API.visa(visaId));
    const res = await axios.put(API.visa(visaId), {});

    expect(res.status).toBe(200);
    expect(res.data).toEqual(before.data);
  });

  it('should return 404 for non-existent visa and 400 for invalid id', async () => {
    await helpers.expectError(
      () => axios.put(API.visa(99999), { price: 100 }),
      404
    );

    await helpers.expectError(
      () => axios.put(`${API.visas}/abc`, { price: 100 }),
      400
    );
  });

  it('should return 400 for invalid update values', async () => {
    const visaId = await helpers.getFirstVisaId();

    await helpers.expectError(
      () =>
        axios.put(API.visa(visaId), {
          numberOfEntries: 'Invalid',
        }),
      400
    );

    await helpers.expectError(
      () => axios.put(API.visa(visaId), { price: -10 }),
      400
    );
  });
});
