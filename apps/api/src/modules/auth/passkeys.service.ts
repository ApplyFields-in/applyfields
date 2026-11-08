/**
 * Passkeys (WebAuthn): sign in with fingerprint / face / device PIN.
 *
 * Add (signed in):  registerOptions → browser creates a key pair → verifyRegistration stores the PUBLIC key.
 * Sign in:          loginOptions → device signs our challenge → verifyLogin checks the signature with that key.
 *
 * Passkeys are discoverable (no email typed) and always require user verification (biometric/PIN).
 * A passkey only works on its RP ID's domain (WEBAUTHN_RP_ID, e.g. applyfields.com) and the origins
 * listed in WEBAUTHN_ORIGINS. Challenges are signed by us, expire in 5 minutes and work once.
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { jwtAccessSecret } from '../../common/jwt-secret.js';
import { UsersStore, type PasskeyEntity } from '../users/users.store.js';
import { AuthService } from './auth.service.js';

const CHALLENGE_TTL_S = 5 * 60;

export function webauthnConfig() {
  const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
  const origins = (process.env.WEBAUTHN_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return { rpID, rpName: process.env.WEBAUTHN_RP_NAME || 'ApplyFields', origins };
}

export type PasskeySummary = Pick<PasskeyEntity, 'id' | 'name' | 'device_type' | 'backed_up' | 'last_used_at' | 'created_at'>;
const summary = ({ id, name, device_type, backed_up, last_used_at, created_at }: PasskeyEntity): PasskeySummary => ({
  id,
  name,
  device_type,
  backed_up,
  last_used_at,
  created_at,
});

type ChallengeKind = 'passkey-register' | 'passkey-login';

@Injectable()
export class PasskeysService {
  /** Challenges already spent, until they expire. ponytail: per API instance; move to Redis/DB if the API runs on several instances. */
  private spent = new Map<string, number>();

  constructor(
    private readonly store: UsersStore,
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  private signChallenge(kind: ChallengeKind, challenge: string, sub?: string): Promise<string> {
    return this.jwt.signAsync({ typ: kind, challenge, sub }, { secret: jwtAccessSecret(), expiresIn: CHALLENGE_TTL_S });
  }

  /** Reads our signed challenge and spends it, so one challenge can sign in once. */
  private async spendChallenge(token: string, kind: ChallengeKind, sub?: string): Promise<string> {
    let payload: { typ?: string; challenge?: string; sub?: string; exp?: number };
    try {
      payload = await this.jwt.verifyAsync(token, { secret: jwtAccessSecret() });
    } catch {
      throw new BadRequestException('This passkey request expired. Please try again.');
    }
    if (payload.typ !== kind || !payload.challenge || (sub && payload.sub !== sub)) {
      throw new BadRequestException('Invalid passkey request.');
    }
    const now = Date.now();
    for (const [c, exp] of this.spent) if (exp < now) this.spent.delete(c);
    if (this.spent.has(payload.challenge)) throw new BadRequestException('This passkey request was already used.');
    this.spent.set(payload.challenge, (payload.exp ?? 0) * 1000);
    return payload.challenge;
  }

  // ---------- Add a passkey (signed-in user) ----------

  async registerOptions(userId: string) {
    const user = await this.store.findUserById(userId);
    if (!user || user.status !== 'active') throw new UnauthorizedException('Sign in again to add a passkey.');
    const { rpID, rpName } = webauthnConfig();
    const existing = await this.store.listPasskeys(userId);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.email ?? user.phone ?? user.id,
      userID: new TextEncoder().encode(user.id),
      attestationType: 'none',
      excludeCredentials: existing.map((p) => ({ id: p.credential_id, transports: p.transports })),
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    });
    return { options, challengeToken: await this.signChallenge('passkey-register', options.challenge, userId) };
  }

  async verifyRegistration(
    userId: string,
    input: { response: RegistrationResponseJSON; challengeToken: string; name?: string },
  ): Promise<PasskeySummary> {
    const expectedChallenge = await this.spendChallenge(input.challengeToken, 'passkey-register', userId);
    const { rpID, origins } = webauthnConfig();

    let result;
    try {
      result = await verifyRegistrationResponse({
        response: input.response,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
    } catch (err) {
      throw new BadRequestException(`Passkey could not be added: ${(err as Error).message}`);
    }
    if (!result.verified) throw new BadRequestException('Passkey could not be added.');

    const { credential, credentialDeviceType, credentialBackedUp } = result.registrationInfo;
    let saved: PasskeyEntity;
    try {
      saved = await this.store.addPasskey({
        user_id: userId,
        credential_id: credential.id,
        public_key: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports ?? [],
        device_type: credentialDeviceType,
        backed_up: credentialBackedUp,
        name: input.name?.trim().slice(0, 60) || null,
      });
    } catch {
      throw new ConflictException('This passkey is already added.');
    }
    // users.mfa_enabled now means "has a real passkey" (shown as has_passkey).
    await this.store.updateUser(userId, { mfa_enabled: true });
    return summary(saved);
  }

  // ---------- Sign in with a passkey ----------

  async loginOptions() {
    const { rpID } = webauthnConfig();
    // No allowCredentials: the device offers its own passkeys for this site (no email needed).
    const options = await generateAuthenticationOptions({ rpID, userVerification: 'required' });
    return { options, challengeToken: await this.signChallenge('passkey-login', options.challenge) };
  }

  async verifyLogin(
    input: { response: AuthenticationResponseJSON; challengeToken: string },
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    const expectedChallenge = await this.spendChallenge(input.challengeToken, 'passkey-login');
    const passkey = input.response?.id ? await this.store.findPasskeyByCredentialId(input.response.id) : undefined;
    if (!passkey) {
      throw new UnauthorizedException('This passkey is not linked to an ApplyFields account. Sign in another way and add it from your account page.');
    }
    const { rpID, origins } = webauthnConfig();

    let result;
    try {
      result = await verifyAuthenticationResponse({
        response: input.response,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        credential: {
          id: passkey.credential_id,
          publicKey: passkey.public_key,
          counter: passkey.counter,
          transports: passkey.transports,
        },
        requireUserVerification: true,
      });
    } catch {
      throw new UnauthorizedException('Passkey sign-in could not be verified.');
    }
    if (!result.verified) throw new UnauthorizedException('Passkey sign-in could not be verified.');

    await this.store.touchPasskey(passkey.id, result.authenticationInfo.newCounter);
    // Device possession + biometric/PIN: counts as two-step for the staff portal too.
    return this.auth.sessionFor(passkey.user_id, meta, true);
  }

  // ---------- Manage ----------

  async list(userId: string): Promise<PasskeySummary[]> {
    return (await this.store.listPasskeys(userId)).map(summary);
  }

  async remove(userId: string, id: string): Promise<{ removed: true }> {
    if (!(await this.store.deletePasskey(userId, id))) throw new NotFoundException('Passkey not found');
    if ((await this.store.listPasskeys(userId)).length === 0) {
      await this.store.updateUser(userId, { mfa_enabled: false });
    }
    return { removed: true };
  }
}
