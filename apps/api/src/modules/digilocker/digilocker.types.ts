export interface DigiLockerPendingState {
  state: string;
  codeVerifier: string;
  userId?: string;
  redirectUri: string;
  createdAt: number;
}

export interface DigiLockerTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  digilockerid?: string;
  name?: string;
  dob?: string;
  gender?: string;
}

export interface DigiLockerUserConnection {
  digilockerId: string;
  accessToken: string;
  linkedAt: string;
  candidateName?: string;
  dob?: string;
  gender?: string;
}

export interface DigiLockerIssuedDocDefinition {
  uri: string;
  name: string;
  type: string;
  issuer: string;
  date: string;
  status: 'verified' | 'issued';
  mimeType: string;
  rawText: string;
  sampleIdentifier?: string;
}
