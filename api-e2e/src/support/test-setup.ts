import axios from 'axios';

module.exports = async function () {
  // Configure axios for tests to use TEST_HOST and TEST_PORT
  const host = process.env.TEST_HOST ?? 'localhost';
  const port = process.env.TEST_PORT ?? '3001';
  axios.defaults.baseURL = `http://${host}:${port}`;
};
