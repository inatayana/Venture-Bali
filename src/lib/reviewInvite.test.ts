import { createInviteToken, verifyInviteToken } from './reviewInvite';

const SECRET = 'test-review-invite-secret-32chars';

describe('founding guest invite token', () => {
  const previousSecret = process.env.CUSTOMER_LINK_SECRET;
  const previousAdmin = process.env.ADMIN_SESSION_SECRET;

  beforeAll(() => {
    process.env.CUSTOMER_LINK_SECRET = SECRET;
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.CUSTOMER_LINK_SECRET;
    else process.env.CUSTOMER_LINK_SECRET = previousSecret;
    if (previousAdmin === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previousAdmin;
  });

  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  it('round-trips for the matching invite id', () => {
    const token = createInviteToken('invite-1', future);
    expect(token).not.toBeNull();
    expect(verifyInviteToken('invite-1', token)).toEqual({ inviteId: 'invite-1' });
    expect(verifyInviteToken('invite-2', token)).toBeNull();
  });

  it('rejects tampered and expired tokens', () => {
    const token = createInviteToken('invite-1', future) as string;
    expect(verifyInviteToken('invite-1', `${token}x`)).toBeNull();
    expect(verifyInviteToken('invite-1', 'garbage')).toBeNull();

    const expired = createInviteToken('invite-1', new Date(Date.now() - 1000));
    expect(verifyInviteToken('invite-1', expired)).toBeNull();
  });

  it('issues nothing without a secret', () => {
    delete process.env.CUSTOMER_LINK_SECRET;
    delete process.env.ADMIN_SESSION_SECRET;
    expect(createInviteToken('invite-1', future)).toBeNull();
    expect(verifyInviteToken('invite-1', 'ri1.a.b')).toBeNull();
  });
});
