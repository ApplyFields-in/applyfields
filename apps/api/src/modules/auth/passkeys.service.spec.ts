import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import * as webauthn from '@simplewebauthn/server';
import { AuthService } from './auth.service.js';
import { PasskeysService } from './passkeys.service.js';
import { UsersStore } from '../users/users.store.js';

// The signature maths is the library's job (and needs a real authenticator); these tests cover our rules.
vi.mock('@simplewebauthn/server', async (orig) => ({
  ...(await orig<typeof import('@simplewebauthn/server')>()),
  verifyRegistrationResponse: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}));
const verifyReg = vi.mocked(webauthn.verifyRegistrationResponse);
const verifyAuth = vi.mocked(webauthn.verifyAuthenticationResponse);

const claims = (jwt: string) => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());

describe('PasskeysService', () => {
  let passkeys: PasskeysService;
  let auth: AuthService;
  let store: UsersStore;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test_jwt_secret_key_32_characters_long_minimum' })],
      providers: [AuthService, UsersStore, PasskeysService],
    }).compile();
    passkeys = mod.get(PasskeysService);
    auth = mod.get(AuthService);
    store = mod.get(UsersStore);
    verifyReg.mockReset();
    verifyAuth.mockReset();
  }, 30000);

  async function userWithPasskey(email: string) {
    const { user } = await auth.register({ email, password: 'Password123!' });
    const { challengeToken } = await passkeys.registerOptions(user.id);
    verifyReg.mockResolvedValueOnce({
      verified: true,
      registrationInfo: {
        credential: { id: Buffer.from(`cred-${email}`).toString('base64url'), publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['internal'] },
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
      },
    } as never);
    const pk = await passkeys.verifyRegistration(user.id, { response: {} as never, challengeToken, name: 'My phone' });
    return { user, pk };
  }

  it('adds a passkey: public key stored, account shows has_passkey, challenge works once', async () => {
    const { user, pk } = await userWithPasskey('pk1@example.com');
    expect(pk).toMatchObject({ name: 'My phone', device_type: 'multiDevice', backed_up: true });
    expect(store.toUserSummary((await store.findUserById(user.id))!).has_passkey).toBe(true);

    // Second passkey on the same account excludes the first one at the browser.
    const again = await passkeys.registerOptions(user.id);
    expect(again.options.excludeCredentials?.map((c: { id: string }) => c.id)).toEqual([Buffer.from('cred-pk1@example.com').toString('base64url')]);
    expect(again.options.authenticatorSelection).toMatchObject({ residentKey: 'required', userVerification: 'required' });
  });

  it('refuses a reused or someone else\'s registration challenge, and a failed verification', async () => {
    const a = (await auth.register({ email: 'a@example.com', password: 'Password123!' })).user;
    const b = (await auth.register({ email: 'b@example.com', password: 'Password123!' })).user;
    const { challengeToken } = await passkeys.registerOptions(a.id);

    await expect(passkeys.verifyRegistration(b.id, { response: {} as never, challengeToken })).rejects.toThrow('Invalid passkey request');

    verifyReg.mockResolvedValueOnce({ verified: false } as never);
    await expect(passkeys.verifyRegistration(a.id, { response: {} as never, challengeToken })).rejects.toThrow('could not be added');
    await expect(passkeys.verifyRegistration(a.id, { response: {} as never, challengeToken })).rejects.toThrow('already used');
    expect(await passkeys.list(a.id)).toEqual([]);
  });

  it('signs in with a verified passkey: mfa session, counter updated, challenge spent', async () => {
    const { user } = await userWithPasskey('pk2@example.com');
    const { options, challengeToken } = await passkeys.loginOptions();
    expect(options.allowCredentials ?? []).toEqual([]); // device offers its own passkey; no email typed

    verifyAuth.mockResolvedValueOnce({ verified: true, authenticationInfo: { newCounter: 7 } } as never);
    const res = await passkeys.verifyLogin({ response: { id: Buffer.from('cred-pk2@example.com').toString('base64url') } as never, challengeToken }, {});
    expect(res.user.id).toBe(user.id);
    expect(claims(res.accessToken).mfa).toBe(true);
    expect((await store.findPasskeyByCredentialId(Buffer.from('cred-pk2@example.com').toString('base64url')))?.counter).toBe(7);

    await expect(
      passkeys.verifyLogin({ response: { id: Buffer.from('cred-pk2@example.com').toString('base64url') } as never, challengeToken }, {}),
    ).rejects.toThrow('already used');
  });

  it('refuses unknown passkeys, bad signatures, forged challenges and blocked accounts', async () => {
    const { user } = await userWithPasskey('pk3@example.com');
    const login = (id: string, token: string) => passkeys.verifyLogin({ response: { id } as never, challengeToken: token }, {});

    await expect(login('nope', (await passkeys.loginOptions()).challengeToken)).rejects.toThrow('not linked');

    verifyAuth.mockResolvedValueOnce({ verified: false, authenticationInfo: { newCounter: 0 } } as never);
    await expect(login(Buffer.from('cred-pk3@example.com').toString('base64url'), (await passkeys.loginOptions()).challengeToken)).rejects.toThrow('could not be verified');

    // A registration challenge can't be used to sign in, and a made-up token is rejected.
    const regToken = (await passkeys.registerOptions(user.id)).challengeToken;
    await expect(login(Buffer.from('cred-pk3@example.com').toString('base64url'), regToken)).rejects.toThrow('Invalid passkey request');
    await expect(login(Buffer.from('cred-pk3@example.com').toString('base64url'), 'x.y.z')).rejects.toThrow('expired');

    await store.updateUser(user.id, { status: 'suspended' } as never);
    verifyAuth.mockResolvedValueOnce({ verified: true, authenticationInfo: { newCounter: 1 } } as never);
    await expect(login(Buffer.from('cred-pk3@example.com').toString('base64url'), (await passkeys.loginOptions()).challengeToken)).rejects.toThrow('not active');
  });

  it('only the owner can remove a passkey; removing the last one clears has_passkey', async () => {
    const { user, pk } = await userWithPasskey('pk4@example.com');
    const other = (await auth.register({ email: 'other@example.com', password: 'Password123!' })).user;

    await expect(passkeys.remove(other.id, pk.id)).rejects.toThrow('not found');
    await passkeys.remove(user.id, pk.id);
    expect(await passkeys.list(user.id)).toEqual([]);
    expect(store.toUserSummary((await store.findUserById(user.id))!).has_passkey).toBe(false);
  });
});
