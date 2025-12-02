import 'dotenv/config';
import axios from 'axios';
import { API, helpers } from '../support/test-helpers';

// Check if currency service is available
const hasCurrencyApiKey = !!process.env.CURRENCY_API_KEY;

describe('Currency Conversion', () => {
  describe('GET /api/visas with currency', () => {
    it('should convert prices to EUR or return 503 if service unavailable', async () => {
      if (hasCurrencyApiKey) {
        // Test normal conversion when service is available
        const usdRes = await axios.get(`${API.visas}?limit=1`);
        const eurRes = await axios.get(`${API.visas}?limit=1&currency=EUR`);

        expect(eurRes.status).toBe(200);
        expect(eurRes.data.data.length).toBeGreaterThan(0);

        const usdVisa = usdRes.data.data[0];
        const eurVisa = eurRes.data.data[0];

        // EUR should be different from USD (unless rate is exactly 1)
        expect(eurVisa.price).not.toBe(usdVisa.price);
        expect(eurVisa.filingFee).not.toBe(usdVisa.filingFee);
        // Prices should be positive
        expect(eurVisa.price).toBeGreaterThan(0);
        expect(eurVisa.filingFee).toBeGreaterThan(0);
      } else {
        // Test 503 error when service is unavailable
        // validateStatus makes 503 "successful" so we can assert on it directly
        const response = await axios.get(`${API.visas}?limit=1&currency=EUR`, {
          validateStatus: (status) => status === 503,
        });
        expect(response.status).toBe(503);
        expect(response.data.error).toBe(
          'Currency exchange rates are currently unavailable'
        );
        expect(response.data.details).toBeDefined();
        expect(response.data.details.fallback).toContain('USD');
      }
    });

    it('should convert prices to GBP or return 503 if service unavailable', async () => {
      if (hasCurrencyApiKey) {
        // Test normal conversion when service is available
        const usdRes = await axios.get(`${API.visas}?limit=1`);
        const gbpRes = await axios.get(`${API.visas}?limit=1&currency=GBP`);

        expect(gbpRes.status).toBe(200);
        const gbpVisa = gbpRes.data.data[0];
        const usdVisa = usdRes.data.data[0];

        expect(gbpVisa.price).not.toBe(usdVisa.price);
        expect(gbpVisa.filingFee).not.toBe(usdVisa.filingFee);
      } else {
        // Test 503 error when service is unavailable
        const response = await axios.get(`${API.visas}?limit=1&currency=GBP`, {
          validateStatus: (status) => status === 503,
        });
        expect(response.status).toBe(503);
        expect(response.data.error).toBe(
          'Currency exchange rates are currently unavailable'
        );
      }
    });

    it('should return USD prices when currency=USD (works regardless of service availability)', async () => {
      // USD is the default currency, so it should work even without currency service
      const usdRes1 = await axios.get(`${API.visas}?limit=1`);
      const usdRes2 = await axios.get(`${API.visas}?limit=1&currency=USD`);

      expect(usdRes2.status).toBe(200);
      expect(usdRes1.data.data[0].price).toBe(usdRes2.data.data[0].price);
      expect(usdRes1.data.data[0].filingFee).toBe(
        usdRes2.data.data[0].filingFee
      );
      // USD currency parameter should work even when service is unavailable
      // because USD is the default currency and requires no conversion
    });

    it('should convert both price and filingFee or return 503 if service unavailable', async () => {
      if (hasCurrencyApiKey) {
        // Test normal conversion when service is available
        const usdRes = await axios.get(`${API.visas}?limit=1`);
        const eurRes = await axios.get(`${API.visas}?limit=1&currency=EUR`);

        const usdVisa = usdRes.data.data[0];
        const eurVisa = eurRes.data.data[0];

        // Both fields should be converted
        expect(eurVisa.price).not.toBe(usdVisa.price);
        expect(eurVisa.filingFee).not.toBe(usdVisa.filingFee);
        // Ratio should be similar for both (same exchange rate)
        const priceRatio = eurVisa.price / usdVisa.price;
        const feeRatio = eurVisa.filingFee / usdVisa.filingFee;
        expect(Math.abs(priceRatio - feeRatio)).toBeLessThan(0.01); // Within 1% tolerance
      } else {
        // Test 503 error when service is unavailable
        const response = await axios.get(`${API.visas}?limit=1&currency=EUR`, {
          validateStatus: (status) => status === 503,
        });
        expect(response.status).toBe(503);
      }
    });

    it('should work with currency conversion and pagination or return 503 if service unavailable', async () => {
      if (hasCurrencyApiKey) {
        // Test normal behavior when service is available
        // Make requests sequentially to ensure they see the same database state
        const usdRes = await axios.get(`${API.visas}?offset=0&limit=3`);
        const eurRes = await axios.get(
          `${API.visas}?offset=0&limit=3&currency=EUR`
        );

        expect(eurRes.status).toBe(200);
        expect(eurRes.data.data).toHaveLength(3);
        expect(eurRes.data.total).toBe(usdRes.data.total);
        // Prices should be converted
        expect(eurRes.data.data[0].price).not.toBe(usdRes.data.data[0].price);
      } else {
        // Test 503 error when service is unavailable
        const response = await axios.get(
          `${API.visas}?offset=0&limit=3&currency=EUR`,
          {
            validateStatus: (status) => status === 503,
          }
        );
        expect(response.status).toBe(503);
        expect(response.data.error).toBe(
          'Currency exchange rates are currently unavailable'
        );
      }
    });

    it('should work with currency and filters combined or return 503 if service unavailable', async () => {
      if (hasCurrencyApiKey) {
        // Test normal behavior when service is available
        const res = await axios.get(
          `${API.visas}?country=USA&limit=5&currency=EUR`
        );

        expect(res.status).toBe(200);
        expect(res.data.data.length).toBeGreaterThan(0);
        expect(
          res.data.data.every((v: { country: string }) =>
            v.country.toLowerCase().includes('usa')
          )
        ).toBe(true);
        // All prices should be in EUR (different from USD)
        const usdRes = await axios.get(`${API.visas}?country=USA&limit=5`);
        res.data.data.forEach((eurVisa: { price: number; id: number }) => {
          const usdVisa = usdRes.data.data.find(
            (v: { id: number }) => v.id === eurVisa.id
          );
          if (usdVisa) {
            expect(eurVisa.price).not.toBe(usdVisa.price);
          }
        });
      } else {
        // Test 503 error when service is unavailable
        const response = await axios.get(
          `${API.visas}?country=USA&limit=5&currency=EUR`,
          {
            validateStatus: (status) => status === 503,
          }
        );
        expect(response.status).toBe(503);
      }
    });
  });

  describe('GET /api/visas/:id with currency', () => {
    it('should convert single visa to EUR or return 503 if service unavailable', async () => {
      const visaId = await helpers.getFirstVisaId();
      if (hasCurrencyApiKey) {
        // Test normal conversion when service is available
        const usdRes = await axios.get(API.visa(visaId));
        const eurRes = await axios.get(`${API.visa(visaId)}?currency=EUR`);

        expect(eurRes.status).toBe(200);
        expect(eurRes.data.id).toBe(visaId);
        expect(eurRes.data.price).not.toBe(usdRes.data.price);
        expect(eurRes.data.filingFee).not.toBe(usdRes.data.filingFee);
      } else {
        // Test 503 error when service is unavailable
        const response = await axios.get(`${API.visa(visaId)}?currency=EUR`, {
          validateStatus: (status) => status === 503,
        });
        expect(response.status).toBe(503);
        expect(response.data.error).toBe(
          'Currency exchange rates are currently unavailable'
        );
      }
    });

    it('should convert single visa to GBP or return 503 if service unavailable', async () => {
      const visaId = await helpers.getFirstVisaId();
      if (hasCurrencyApiKey) {
        // Test normal conversion when service is available
        const gbpRes = await axios.get(`${API.visa(visaId)}?currency=GBP`);

        expect(gbpRes.status).toBe(200);
        expect(gbpRes.data.id).toBe(visaId);
        expect(gbpRes.data.price).toBeGreaterThan(0);
        expect(gbpRes.data.filingFee).toBeGreaterThan(0);
      } else {
        // Test 503 error when service is unavailable
        const response = await axios.get(`${API.visa(visaId)}?currency=GBP`, {
          validateStatus: (status) => status === 503,
        });
        expect(response.status).toBe(503);
      }
    });
  });

  describe('Currency edge cases', () => {
    it('should return 503 for invalid currency (always)', async () => {
      // Invalid currency should always return 503, regardless of service availability
      const response = await axios.get(
        `${API.visas}?limit=1&currency=INVALID`,
        {
          validateStatus: (status) => status === 503,
        }
      );
      expect(response.status).toBe(503);
      expect(response.data.error).toBe(
        'Currency exchange rates are currently unavailable'
      );
      expect(response.data.details).toBeDefined();
      expect(response.data.details.fallback).toContain('USD');
    });

    it('should handle case-insensitive currency codes or return 503 if service unavailable', async () => {
      if (hasCurrencyApiKey) {
        // Test normal behavior when service is available
        const eurLower = await axios.get(`${API.visas}?limit=1&currency=eur`);
        const eurUpper = await axios.get(`${API.visas}?limit=1&currency=EUR`);

        expect(eurLower.status).toBe(200);
        expect(eurUpper.status).toBe(200);
        // Should produce same results (case-insensitive)
        expect(eurLower.data.data[0].price).toBe(eurUpper.data.data[0].price);
      } else {
        // Test 503 error when service is unavailable
        const response = await axios.get(`${API.visas}?limit=1&currency=eur`, {
          validateStatus: (status) => status === 503,
        });
        expect(response.status).toBe(503);
      }
    });
  });
});
