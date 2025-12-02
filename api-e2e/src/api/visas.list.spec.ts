import axios from 'axios';
import { API } from '../support/test-helpers';

describe('GET /api/visas', () => {
  it('should return visas with pagination', async () => {
    const res = await axios.get(`${API.visas}?offset=0&limit=5`);

    expect(res.status).toBe(200);
    expect(res.data.data).toHaveLength(5);
    expect(res.data.total).toBeGreaterThan(0);
  });

  it('should handle pagination edge cases', async () => {
    const largeOffset = await axios.get(`${API.visas}?offset=99999&limit=5`);
    expect(largeOffset.data.data).toHaveLength(0);

    const cappedLimit = await axios.get(`${API.visas}?limit=1000`);
    expect(cappedLimit.data.data.length).toBeLessThanOrEqual(100);
  });

  it('should filter by country (case insensitive)', async () => {
    const res = await axios.get(`${API.visas}?country=usa`);

    expect(res.status).toBe(200);
    expect(res.data.data.length).toBeGreaterThan(0);
    expect(
      res.data.data.every((v: { country: string }) =>
        v.country.toLowerCase().includes('usa')
      )
    ).toBe(true);
  });

  it('should filter by price range', async () => {
    const res = await axios.get(`${API.visas}?minPrice=100&maxPrice=200`);

    expect(res.status).toBe(200);
    expect(
      res.data.data.every(
        (v: { price: number }) => v.price >= 100 && v.price <= 200
      )
    ).toBe(true);
  });

  it('should filter by visaType and numberOfEntries', async () => {
    const res = await axios.get(
      `${API.visas}?visaType=Tourist&numberOfEntries=Single`
    );

    expect(res.status).toBe(200);
    expect(
      res.data.data.every(
        (v: { visaType: string; numberOfEntries: string }) =>
          v.visaType === 'Tourist' && v.numberOfEntries === 'Single'
      )
    ).toBe(true);
  });

  it('should combine multiple filters', async () => {
    // Get all visas to find a valid combination
    const allVisas = await axios.get(`${API.visas}`);
    expect(allVisas.data.data.length).toBeGreaterThan(0);

    // Use the first visa's properties for filtering
    const firstVisa = allVisas.data.data[0];
    const res = await axios.get(
      `${API.visas}?country=${firstVisa.country}&visaType=${
        firstVisa.visaType
      }&minPrice=${firstVisa.price - 50}&maxPrice=${firstVisa.price + 50}`
    );

    expect(res.status).toBe(200);
    expect(res.data.data.length).toBeGreaterThan(0);
    expect(
      res.data.data.every(
        (v: { country: string; visaType: string; price: number }) =>
          v.country.toLowerCase().includes(firstVisa.country.toLowerCase()) &&
          v.visaType.toLowerCase().includes(firstVisa.visaType.toLowerCase()) &&
          v.price >= firstVisa.price - 50 &&
          v.price <= firstVisa.price + 50
      )
    ).toBe(true);
  });

  it('should return empty array for non-matching filters', async () => {
    const res = await axios.get(`${API.visas}?country=NonexistentCountry`);

    expect(res.status).toBe(200);
    expect(res.data.data).toHaveLength(0);
    expect(res.data.total).toBe(0);
  });
});
