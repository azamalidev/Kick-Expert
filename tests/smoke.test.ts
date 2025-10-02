// Mock sendEmail
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe('Smoke Test', () => {
  it('should mock send transactional email', async () => {
    expect(true).toBe(true);
  });
});