import axios from 'axios';
import { API, helpers } from '../support/test-helpers';

describe('DELETE /api/visas/:id', () => {
  it('should delete a visa and verify deletion', async () => {
    const created = await helpers.createTestVisa({ country: 'ToDelete' });

    const res = await axios.delete(API.visa(created.id));
    expect(res.status).toBe(204);

    // Verify it's actually deleted
    await helpers.expectError(
      () => axios.get(API.visa(created.id)),
      404
    );
  });

  it('should return 404 for non-existent visa and 400 for invalid id', async () => {
    await helpers.expectError(
      () => axios.delete(API.visa(99999)),
      404
    );

    await helpers.expectError(
      () => axios.delete(`${API.visas}/abc`),
      400
    );
  });
});

