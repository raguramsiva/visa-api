import axios from 'axios';

// Use TEST_HOST and TEST_PORT for test server to avoid conflicts with main server
const API_URL = `http://${process.env.TEST_HOST ?? 'localhost'}:${
  process.env.TEST_PORT ?? 3001
}`;

export const API = {
  baseURL: API_URL,
  visas: `${API_URL}/api/visas`,
  visa: (id: number) => `${API_URL}/api/visas/${id}`,
};

export const helpers = {
  async getFirstVisaId(): Promise<number> {
    const res = await axios.get(`${API.visas}?limit=1`);
    return res.data.data[0].id;
  },

  async createTestVisa(
    data?: Partial<{
      country: string;
      visaType: string;
      price: number;
      lengthOfStay: number;
      numberOfEntries: string;
      filingFee: number;
    }>
  ) {
    const defaultVisa = {
      country: 'Test Country',
      visaType: 'Test Type',
      price: 100,
      lengthOfStay: 30,
      numberOfEntries: 'Single',
      filingFee: 10,
      ...data,
    };
    const res = await axios.post(API.visas, defaultVisa);
    return res.data;
  },

  async expectError(
    request: () => Promise<unknown>,
    expectedStatus: number
  ): Promise<void> {
    try {
      await request();
      throw new Error(`Expected ${expectedStatus} error but request succeeded`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        expect(error.response?.status).toBe(expectedStatus);
      } else {
        throw error;
      }
    }
  },
};
