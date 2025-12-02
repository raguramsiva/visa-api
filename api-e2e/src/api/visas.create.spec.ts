import axios from 'axios';
import { API, helpers } from '../support/test-helpers';

describe('POST /api/visas', () => {
  it('should create a new visa with all fields', async () => {
    const newVisa = {
      country: 'New Zealand',
      visaType: 'Tourist',
      price: 120,
      lengthOfStay: 90,
      numberOfEntries: 'Single',
      filingFee: 15,
    };

    const res = await axios.post(API.visas, newVisa);

    expect(res.status).toBe(201);
    expect(res.data.country).toBe('New Zealand');
    expect(res.data.id).toBeDefined();
    expect(typeof res.data.id).toBe('number');
  });

  it('should create visa with Multiple entries and assign unique ids', async () => {
    const visa1 = await helpers.createTestVisa({
      numberOfEntries: 'Multiple',
      country: 'Country1',
    });
    const visa2 = await helpers.createTestVisa({ country: 'Country2' });

    expect(visa1.numberOfEntries).toBe('Multiple');
    expect(visa2.id).toBeGreaterThan(visa1.id);
  });

  it('should return 400 for missing required fields', async () => {
    await helpers.expectError(
      () =>
        axios.post(API.visas, {
          visaType: 'Tourist',
          price: 100,
        }),
      400
    );
  });

  it('should return 400 for invalid values (negative, zero, invalid enum)', async () => {
    await helpers.expectError(
      () =>
        axios.post(API.visas, {
          country: 'USA',
          visaType: 'Tourist',
          price: -10,
          lengthOfStay: 30,
          numberOfEntries: 'Single',
          filingFee: 10,
        }),
      400
    );

    await helpers.expectError(
      () =>
        axios.post(API.visas, {
          country: 'USA',
          visaType: 'Tourist',
          price: 100,
          lengthOfStay: 0,
          numberOfEntries: 'Single',
          filingFee: 10,
        }),
      400
    );

    await helpers.expectError(
      () =>
        axios.post(API.visas, {
          country: 'USA',
          visaType: 'Tourist',
          price: 100,
          lengthOfStay: 30,
          numberOfEntries: 'Invalid',
          filingFee: 10,
        }),
      400
    );
  });
});
