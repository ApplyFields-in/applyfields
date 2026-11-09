import type { BookingDetail } from '@applyfields/types';

export type ServiceRequestStatus =
  | 'triage'
  | 'in_review'
  | 'ready_for_filing'
  | 'otp_pending'
  | 'submitted'
  | 'completed'
  | 'defective';

export type ServicePriority = 'critical' | 'high' | 'normal';

export interface ApplicantDocument {
  id: string;
  name: string;
  type: 'photo' | 'signature' | 'marks_memo' | 'caste_cert' | 'income_cert' | 'aadhaar' | 'other';
  fileName: string;
  fileSize: string;
  dimensions?: string;
  url: string;
  verified: boolean;
  notes?: string;
}

export interface ServiceDeskRequest {
  id: string;
  /** true = a real service_requests row; false/absent = demo sample */
  live?: boolean;
  token: string;
  serviceTitle: string;
  serviceCategory: 'Exam Application' | 'Certificate' | 'Scheme Enrollment' | 'Correction';
  targetPortalName: string;
  targetPortalUrl: string;
  status: ServiceRequestStatus;
  priority: ServicePriority;
  portalDeadline: string;
  createdAt: string;
  assignedOperator: string | null;

  // Applicant Particulars
  applicant: {
    fullName: string;
    fatherName: string;
    motherName: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    aadhaarMasked: string;
    mobile: string;
    email: string;
    socialCategory: 'UR' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS';
    subCaste: string;
    domicileState: string;
    identificationMark1: string;
    identificationMark2: string;
    address: {
      street: string;
      city: string;
      district: string;
      state: string;
      pincode: string;
    };
    education: {
      boardName: string;
      hallTicketNo: string;
      yearOfPassing: number;
      percentageOrGpa: string;
      schoolName: string;
    };
  };

  // Originating Kiosk Partner
  partner: {
    id: string;
    name: string;
    type: 'MeeSeva' | 'CSC' | 'Online Citizen';
    centerCode: string;
    operatorName: string;
    phone: string;
    city: string;
  };

  // Fees & Commission
  fees: {
    govtFeePaise: number;
    kioskFeePaise: number;
    platformFeePaise: number;
    totalPaise: number;
  };

  // Attached Documents
  documents: ApplicantDocument[];

  // Processing state
  processingDetails?: {
    portalRegNumber?: string;
    challanReference?: string;
    submissionTimestamp?: string;
    acknowledgementPdfUrl?: string;
    defectReason?: string;
    defectChecklist?: string[];
    otpStatus?: 'not_started' | 'active' | 'verified' | 'expired';
    otpRequestedAt?: string;
  };
}



/** A real service_requests row (vs the demo samples above). Applicant biodata isn't in BookingDetail yet. */
export function fromBooking(b: BookingDetail): ServiceDeskRequest {
  const status: ServiceRequestStatus =
    b.status === 'completed'
      ? 'completed'
      : b.status === 'new'
        ? 'triage'
        : b.status === 'rejected' || b.status === 'cancelled'
          ? 'defective'
          : 'ready_for_filing';
  const total = b.final_paise ?? b.quoted_paise ?? 0;
  const applicantName = b.user_note?.match(/Applicant:\s*([^;\n]+)/)?.[1]?.trim() ?? 'Citizen applicant';
  const dash = '—';
  return {
    id: b.id,
    live: true,
    token: `AF-${b.id.slice(0, 8).toUpperCase()}`,
    serviceTitle: b.service_name ?? 'Citizen service request',
    serviceCategory: 'Certificate',
    targetPortalName: 'Official government portal',
    targetPortalUrl: 'https://www.india.gov.in',
    status,
    priority: 'normal',
    portalDeadline: b.appointment_at ?? new Date(Date.now() + 3 * 864e5).toISOString(),
    createdAt: b.created_at,
    assignedOperator: null,
    applicant: {
      fullName: applicantName,
      fatherName: dash,
      motherName: dash,
      dob: dash,
      gender: 'Other',
      aadhaarMasked: dash,
      mobile: dash,
      email: dash,
      socialCategory: 'UR',
      subCaste: dash,
      domicileState: dash,
      identificationMark1: dash,
      identificationMark2: dash,
      address: { street: dash, city: dash, district: dash, state: dash, pincode: dash },
      education: { boardName: dash, hallTicketNo: dash, yearOfPassing: 0, percentageOrGpa: dash, schoolName: dash },
    },
    partner: {
      id: b.partner_id,
      name: b.partner_business_name,
      type: 'MeeSeva',
      centerCode: b.partner_slug,
      operatorName: dash,
      phone: b.partner_phone ?? dash,
      city: b.partner_address ?? dash,
    },
    fees: { govtFeePaise: 0, kioskFeePaise: total, platformFeePaise: 0, totalPaise: total },
    documents: [],
    processingDetails: {
      portalRegNumber: b.official_app_number ?? undefined,
      acknowledgementPdfUrl: b.has_acknowledgment_slip ? 'stored' : undefined,
    },
  };
}
