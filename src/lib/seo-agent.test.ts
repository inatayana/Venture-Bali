import { requestIndexing } from './seo-agent';

describe('requestIndexing', () => {
  it('does not claim success while the Google Indexing API is not connected', async () => {
    const result = await requestIndexing('https://baliwild.com/experiences/v1/tubing');

    expect(result.success).toBe(false);
    expect(result.message).toContain('not connected');
    expect(result.message).toContain('no request was sent');
  });
});
