export type UserGender = 'male' | 'female' | 'transgender' | 'prefer_not_to_say';
export type SocialCategory = 'GEN' | 'OBC' | 'SC' | 'ST' | 'EWS';
export type EducationLevel = '10th' | '12th' | 'iti' | 'diploma' | 'graduate' | 'post_graduate' | 'phd';
export type EducationStatus = 'completed' | 'pursuing';
export type ScoreType = 'percentage' | 'cgpa' | 'grade';
export type OtpPurpose = 'verify_email' | 'verify_phone' | 'login' | 'reset_password';
export type ConsentPurpose = 'terms' | 'privacy' | 'sms' | 'whatsapp' | 'email_updates' | 'analytics';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface UserSummary {
  id: string;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  email_verified: boolean;
  phone_verified: boolean;
  has_passkey?: boolean;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  date_of_birth: string | null; // YYYY-MM-DD
  gender: UserGender | null;
  category: SocialCategory | null;
  is_pwbd: boolean;
  pwbd_type: string | null;
  is_ex_serviceman: boolean;
  is_minority: boolean;
  special_conditions: string[];
  annual_family_income: number | null;
  state_code: string | null;
  district: string | null;
  domicile_state_code: string | null;
  preferred_language: string;
  avatar_url: string | null;
  is_public?: boolean;
  handle?: string | null;
  updated_at: string;
}

export interface UserCompetitiveExamScore {
  id: string;
  user_id: string;
  exam_type: string;
  exam_name: string;
  year: number;
  roll_number?: string | null;
  registration_number?: string | null;
  discipline_or_paper?: string | null;
  score?: string | null;
  marks?: string | null;
  percentile?: string | null;
  all_india_rank?: string | null;
  category_rank?: string | null;
  award_or_status?: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSessionItem {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface UserDataExport {
  platform: string;
  exported_at: string;
  compliance: string;
  account: {
    id: string;
    email: string | null;
    phone: string | null;
    status: string;
    created_at: string;
  };
  profile: UserProfile | null;
  education: UserEducation[];
  exam_scores: UserCompetitiveExamScore[];
  saved_items: Array<{
    id: string;
    opportunity_id: string;
    title?: string;
    created_at: string;
  }>;
  applications: Array<{
    id: string;
    title: string;
    organization: string;
    status: string;
    created_at: string;
  }>;
  documents: Array<{
    id: string;
    title: string | null;
    file_name: string | null;
    mime_type: string | null;
    size_bytes: number | null;
    created_at: string;
  }>;
}

export interface PublicProfileResponse {
  fullName: string;
  handle: string;
  avatarUrl?: string;
  stateName?: string;
  district?: string;
  domicileState?: string;
  category?: string;
  highestDegree?: string;
  stream?: string;
  institution?: string;
  yearOfPassing?: number | string;
  score?: number | string;
  scoreType?: string;
  skills: string[];
  targetJobTypes: string[];
  examScores: UserCompetitiveExamScore[];
  isVerified: boolean;
}

export interface UserEducation {
  id: string;
  user_id: string;
  level: EducationLevel;
  degree: string | null;
  stream: string | null;
  board_or_university: string | null;
  institution_name: string | null;
  year_of_passing: number | null;
  score: number | null;
  score_type: ScoreType | null;
  status: EducationStatus;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: UserSummary;
}

export interface MeResponse {
  user: UserSummary;
  profile: UserProfile | null;
  education?: UserEducation[];
}

export interface ExtractedEducationItem {
  level: EducationLevel;
  degree: string;
  stream: string;
  board_or_university: string;
  institution_name: string;
  year_of_passing: number | null;
  score: number | null;
  score_type: ScoreType;
  status: EducationStatus;
  confidence: number;
}

export interface UserResumeDocument {
  id: string;
  user_id: string;
  document_type_code: string;
  title: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path?: string;
  details?: {
    extracted_text?: string;
    qualifications?: ExtractedEducationItem[];
    uploaded_at?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ResumeApiResponse {
  success: boolean;
  resume: UserResumeDocument | null;
  qualifications?: ExtractedEducationItem[];
  text?: string;
}

