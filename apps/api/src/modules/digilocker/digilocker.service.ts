import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  DigiLockerAuthorizeResponse,
  DigiLockerImportResponse,
  DigiLockerIssuedDocument,
  DigiLockerIssuedDocumentsResponse,
  DigiLockerStatusResponse,
  UserDocumentSummary,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DocumentsService } from '../documents/documents.service.js';
import { UsersStore } from '../users/users.store.js';
import type {
  DigiLockerPendingState,
  DigiLockerTokenResponse,
  DigiLockerUserConnection,
} from './digilocker.types.js';

const STORE_FILE_PATH = join(process.cwd(), '.data', 'digilocker-store.json');

/**
 * No sample or demo documents: until DigiLocker (API Setu) credentials are set, nothing is listed and
 * nothing can be imported. A fake "DigiLocker verified" certificate must never reach a citizen's vault.
 */

@Injectable()
export class DigilockerService {
  private readonly logger = new Logger(DigilockerService.name);

  // In-memory state storage with file persistence fallback
  private pendingStates = new Map<string, DigiLockerPendingState>();
  private userConnections = new Map<string, DigiLockerUserConnection>();

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly usersStore: UsersStore,
    @Optional() private readonly prisma?: PrismaService,
  ) {
    this.loadStateFromFile();
  }

  private loadStateFromFile(): void {
    try {
      if (existsSync(STORE_FILE_PATH)) {
        const raw = readFileSync(STORE_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (data.userConnections && typeof data.userConnections === 'object') {
          for (const [k, v] of Object.entries(data.userConnections)) {
            this.userConnections.set(k, v as DigiLockerUserConnection);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not load DigiLocker state: ${err?.message}`);
    }
  }

  private persistStateToFile(): void {
    try {
      const dir = join(process.cwd(), '.data');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const data = {
        userConnections: Object.fromEntries(this.userConnections.entries()),
      };
      writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.warn(`Could not persist DigiLocker state: ${err?.message}`);
    }
  }

  public isConfigured(): boolean {
    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    return Boolean(
      clientId &&
      clientId.trim() !== '' &&
      clientId !== 'APPLYFIELDS_SANDBOX_CLIENT',
    );
  }

  private getClientId(): string {
    return process.env.DIGILOCKER_CLIENT_ID?.trim() ?? '';
  }

  private getClientSecret(): string {
    return process.env.DIGILOCKER_CLIENT_SECRET?.trim() ?? '';
  }

  public getRedirectUri(): string {
    if (process.env.DIGILOCKER_REDIRECT_URI?.trim()) {
      return process.env.DIGILOCKER_REDIRECT_URI.trim();
    }
    const publicUrl =
      process.env.API_PUBLIC_URL?.replace(/\/$/, '') ||
      'http://localhost:4000/api/v1';
    return `${publicUrl}/auth/digilocker/callback`;
  }

  public getFrontendCallbackUrl(): string {
    if (process.env.DIGILOCKER_FRONTEND_URL?.trim()) {
      return process.env.DIGILOCKER_FRONTEND_URL.trim();
    }
    const webUrl =
      process.env.WEB_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    return `${webUrl}/account`;
  }

  /**
   * Generates DigiLocker OAuth 2.0 PKCE Authorization URL
   */
  async generateAuthorizationUrl(
    userId?: string,
  ): Promise<DigiLockerAuthorizeResponse> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('DigiLocker is not connected to ApplyFields yet.');
    }
    const state = randomBytes(16).toString('hex');
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    const redirectUri = this.getRedirectUri();
    const clientId = this.getClientId();

    this.pendingStates.set(state, {
      state,
      codeVerifier,
      userId,
      redirectUri,
      createdAt: Date.now(),
    });

    // Auto-clean expired states older than 15 minutes
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [k, v] of this.pendingStates.entries()) {
      if (v.createdAt < cutoff) {
        this.pendingStates.delete(k);
      }
    }

    const authorizeBase =
      process.env.DIGILOCKER_AUTHORIZE_URL ||
      'https://api.digitallocker.gov.in/public/oauth2/1/authorize';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      redirect_uri: redirectUri,
    });

    const authorizationUrl = `${authorizeBase}?${params.toString()}`;

    return {
      authorizationUrl,
      state,
      codeVerifier,
    };
  }

  /**
   * Exchanges authorization code for access token via DigiLocker (API Setu)
   */
  async handleCallback(
    code: string,
    state: string,
    providedUserId?: string,
  ): Promise<{ success: boolean; digilockerId: string; userId?: string }> {
    const pending = this.pendingStates.get(state);
    const resolvedUserId = pending?.userId || providedUserId;
    if (!pending || !resolvedUserId || !this.isConfigured()) {
      throw new BadRequestException('DigiLocker sign-in expired or is not available. Please try again.');
    }
    const codeVerifier = pending.codeVerifier;

    // Remove consumed state
    if (pending) {
      this.pendingStates.delete(state);
    }

    let tokenData: DigiLockerTokenResponse | null = null;
    const tokenUrl =
      process.env.DIGILOCKER_TOKEN_URL ||
      'https://api.digitallocker.gov.in/public/oauth2/1/token';

    {
      try {
        const bodyParams = new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: this.getClientId(),
          client_secret: this.getClientSecret(),
          redirect_uri: this.getRedirectUri(),
          code_verifier: codeVerifier,
        });

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          tokenData = (await response.json()) as DigiLockerTokenResponse;
          this.logger.log(
            `DigiLocker token exchange succeeded for candidate: ${tokenData.name || tokenData.digilockerid}`,
          );
        } else {
          const errText = await response.text();
          this.logger.warn(`DigiLocker token endpoint returned ${response.status}: ${errText}`);
        }
      } catch (err: any) {
        this.logger.warn(`DigiLocker token network call failed: ${err?.message}`);
      }
    }

    // Only a real token links the account: never an invented DigiLocker id or token.
    if (!tokenData?.access_token) {
      throw new BadRequestException('DigiLocker sign-in could not be completed. Please try again.');
    }
    const digilockerId = tokenData.digilockerid ?? '';
    const accessToken = tokenData.access_token;

    const connection: DigiLockerUserConnection = {
      digilockerId,
      accessToken,
      linkedAt: new Date().toISOString(),
      candidateName: tokenData?.name,
      dob: tokenData?.dob,
      gender: tokenData?.gender,
    };

    this.userConnections.set(resolvedUserId, connection);
    this.persistStateToFile();

    return {
      success: true,
      digilockerId,
      userId: resolvedUserId,
    };
  }

  /**
   * Retrieves DigiLocker connection status for a user
   */
  async getStatus(
    userId: string,
  ): Promise<
    DigiLockerStatusResponse & {
      configured: boolean;
      authorizeUrl: string;
      candidate_name?: string | null;
    }
  > {
    const connection = this.userConnections.get(userId);
    const configured = this.isConfigured();
    const authorizeUrl = configured ? (await this.generateAuthorizationUrl(userId)).authorizationUrl : '';

    if (!connection) {
      return {
        linked: false,
        digilocker_id: null,
        linked_at: null,
        configured,
        authorizeUrl,
      };
    }

    return {
      linked: true,
      digilocker_id: connection.digilockerId,
      linked_at: connection.linkedAt,
      candidate_name: connection.candidateName,
      configured,
      authorizeUrl,
    };
  }

  /**
   * Disconnects DigiLocker connection for a user
   */
  async disconnect(userId: string): Promise<{ success: boolean }> {
    this.userConnections.delete(userId);
    this.persistStateToFile();
    return { success: true };
  }

  /**
   * Queries the candidate's issued certificates from DigiLocker API / Setu
   */
  async getIssuedDocuments(
    userId: string,
  ): Promise<DigiLockerIssuedDocumentsResponse> {
    // Get existing user documents to check if already imported
    let userDocs: UserDocumentSummary[] = [];
    try {
      const listRes = await this.documentsService.listDocuments(userId);
      userDocs = listRes.items;
    } catch {
      // fallback
    }

    const importedUris = new Set<string>();
    for (const d of userDocs) {
      if (d.source === 'digilocker' && d.digilocker_uri) {
        importedUris.add(d.digilocker_uri);
      }
    }

    // If candidate has a live connection and client is configured, attempt live fetch
    const connection = this.userConnections.get(userId);
    if (connection?.accessToken && this.isConfigured()) {
      try {
        const liveDocs = await this.fetchLiveIssuedDocuments(connection.accessToken);
        if (liveDocs.length > 0) {
          return {
            items: liveDocs.map((doc) => ({
              ...doc,
              isImported: importedUris.has(doc.uri),
            })),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Could not load live DigiLocker documents: ${err?.message}`);
      }
    }

    return { items: [] };
  }

  private async fetchLiveIssuedDocuments(
    accessToken: string,
  ): Promise<DigiLockerIssuedDocument[]> {
    const liveEndpoint =
      process.env.DIGILOCKER_ISSUED_URL ||
      'https://api.digitallocker.gov.in/public/oauth2/2/xml/issued';

    try {
      const res = await fetch(liveEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/xml, text/xml, application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return [];
      }

      const text = await res.text();
      return this.parseIssuedDocumentsResponse(text);
    } catch (err: any) {
      this.logger.warn(`Failed fetching live documents from DigiLocker: ${err?.message}`);
      return [];
    }
  }

  private parseIssuedDocumentsResponse(raw: string): DigiLockerIssuedDocument[] {
    const results: DigiLockerIssuedDocument[] = [];

    // Try JSON
    try {
      const data = JSON.parse(raw);
      const list = Array.isArray(data)
        ? data
        : data.items || data.certificates || [];
      for (const item of list) {
        if (item.uri) {
          results.push({
            uri: item.uri,
            name: item.name || item.docName || 'Issued Certificate',
            type: item.type || item.doctype || 'certificate',
            issuer: item.issuer || item.issuerName || 'Government Issuer',
            date:
              item.date ||
              item.issueDate ||
              new Date().toISOString().slice(0, 10),
            status: 'verified',
            mimeType: 'application/pdf',
          });
        }
      }
      if (results.length > 0) return results;
    } catch {
      // Not JSON, continue to XML
    }

    // Regex XML parser for <certificate> or <item> nodes
    const certRegex =
      /<(?:certificate|item|docDetails)>([\s\S]*?)<\/(?:certificate|item|docDetails)>/gi;
    let match: RegExpExecArray | null;
    while ((match = certRegex.exec(raw)) !== null) {
      const block = match[1];
      const uri = /<uri>([^<]+)<\/uri>/i.exec(block)?.[1]?.trim();
      const name =
        /<name>([^<]+)<\/name>/i.exec(block)?.[1]?.trim() ||
        'Government Issued Certificate';
      const type =
        /<(?:type|doctype)>([^<]+)<\/(?:type|doctype)>/i.exec(block)?.[1]?.trim() ||
        'certificate';
      const issuer =
        /<issuer>([^<]+)<\/issuer>/i.exec(block)?.[1]?.trim() ||
        'Government Issuer';
      const date =
        /<date>([^<]+)<\/date>/i.exec(block)?.[1]?.trim() ||
        new Date().toISOString().slice(0, 10);

      if (uri) {
        results.push({
          uri,
          name,
          type,
          issuer,
          date,
          status: 'verified',
          mimeType: 'application/pdf',
        });
      }
    }

    return results;
  }

  /**
   * Importing a file from DigiLocker needs the live API Setu file endpoint, which is not built yet.
   * Until then nothing is imported (no generated stand-in certificates).
   */
  async importDocument(_userId: string, _uri: string): Promise<DigiLockerImportResponse> {
    throw new ServiceUnavailableException('Importing from DigiLocker is not available yet.');
  }
}
