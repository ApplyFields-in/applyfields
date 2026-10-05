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
  updated_at: string;
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
  accessToken: string;
}

export interface MeResponse {
  user: UserSummary;
  profile: UserProfile | null;
  education?: UserEducation[];
}
