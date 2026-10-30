export type PartnerOrderStatus =
  | 'dispatched'
  | 'in_filing'
  | 'otp_pending'
  | 'defective'
  | 'completed';

export interface PartnerOrder {
  id: string;
  token: string;
  createdAt: string;
  citizenName: string;
  mobile: string;
  serviceTitle: string;
  targetPortalName: string;
  status: PartnerOrderStatus;
  assignedOperator: string | null;
  feesCollected: number;
  paymentMode: 'Cash' | 'UPI';
  securityPin?: string;
  presenceVerified?: boolean;
  escrowCommission?: number;
  candidateIntake?: {
    fatherName?: string;
    dob?: string;
    aadhaarLast4?: string;
    address?: string;
    email?: string;
  };

  // Details
  filingDetails?: {
    portalRegNumber?: string;
    challanReference?: string;
    completedAt?: string;
    defectReason?: string;
    defectNotes?: string;
    otpRequestedAt?: string;
    otpSecondsRemaining?: number;
  };
}

export const SAMPLE_PARTNER_ORDERS: PartnerOrder[] = [
  {
    id: 'ord-101',
    token: 'TK-042',
    createdAt: '8 mins ago',
    citizenName: 'KONGARA VENKATA NAVEEN',
    mobile: '+91 98480 23194',
    serviceTitle: 'SSC CGL 2026 Online Application Filing',
    targetPortalName: 'Staff Selection Commission (ssc.gov.in)',
    status: 'in_filing',
    assignedOperator: 'Operator #4 (P. Srinivas)',
    feesCollected: 190,
    paymentMode: 'UPI',
    securityPin: '4819',
    presenceVerified: true,
    escrowCommission: 45,
    candidateIntake: {
      fatherName: 'K. Subba Rao',
      dob: '1999-07-18',
      aadhaarLast4: '8839',
      address: 'H.No 3-41, Gachibowli, Hyderabad',
      email: 'naveen.k@example.com',
    },
  },
  {
    id: 'ord-102',
    token: 'TK-040',
    createdAt: '18 mins ago',
    citizenName: 'GUDURU POOJITHA',
    mobile: '+91 99890 44211',
    serviceTitle: 'UPSC Civil Services Examination (OTR + Prelims)',
    targetPortalName: 'Union Public Service Commission (upsconline.nic.in)',
    status: 'otp_pending',
    assignedOperator: 'Operator #2 (Anjali K.)',
    feesCollected: 125,
    paymentMode: 'Cash',
    securityPin: '6104',
    presenceVerified: true,
    escrowCommission: 30,
    candidateIntake: {
      fatherName: 'G. Nageswara Rao',
      dob: '2001-03-24',
      aadhaarLast4: '4190',
      address: 'Plot 12, Madhapur, Hyderabad',
      email: 'poojitha.g@example.com',
    },
    filingDetails: {
      otpRequestedAt: '2026-10-29T22:15:00+05:30',
      otpSecondsRemaining: 94,
    },
  },
  {
    id: 'ord-103',
    token: 'TK-038',
    createdAt: '42 mins ago',
    citizenName: 'CHINTHA RAVITEJA',
    mobile: '+91 94411 77283',
    serviceTitle: 'SSC CHSL 10+2 Application Filing',
    targetPortalName: 'Staff Selection Commission (ssc.gov.in)',
    status: 'defective',
    assignedOperator: 'Operator #4 (P. Srinivas)',
    feesCollected: 190,
    paymentMode: 'Cash',
    securityPin: '7302',
    presenceVerified: true,
    escrowCommission: 45,
    candidateIntake: {
      fatherName: 'C. Rama Murthy',
      dob: '2002-11-09',
      aadhaarLast4: '7721',
      address: 'Ameerpet Main Road, Hyderabad',
      email: 'raviteja.c@example.com',
    },
    filingDetails: {
      defectReason: 'Photograph and signature fail SSC biometric standards.',
      defectNotes: 'Please rescan candidate photo against plain white background and use black ballpoint pen for signature.',
    },
  },
  {
    id: 'ord-104',
    token: 'TK-035',
    createdAt: '1 hour ago',
    citizenName: 'BANOTH PREM CHANDER',
    mobile: '+91 97010 33910',
    serviceTitle: 'Integrated Caste & Domicile Certificate',
    targetPortalName: 'MeeSeva Telangana Revenue Portal',
    status: 'completed',
    assignedOperator: 'Operator #1 (V. Satyanarayana)',
    feesCollected: 115,
    paymentMode: 'Cash',
    securityPin: '1920',
    presenceVerified: true,
    escrowCommission: 25,
    candidateIntake: {
      fatherName: 'B. Somla Naik',
      dob: '1998-05-12',
      aadhaarLast4: '3391',
      address: 'Mahabubabad Village, Warangal',
      email: 'prem.b@example.com',
    },
    filingDetails: {
      portalRegNumber: 'TS-MEESEVA-CST-2026-99104',
      challanReference: 'CHL-MEE-8839102',
      completedAt: '2026-10-29T21:40:00+05:30',
    },
  },
  {
    id: 'ord-105',
    token: 'TK-031',
    createdAt: '2 hours ago',
    citizenName: 'MOHAMMED REHAN UDDIN',
    mobile: '+91 91210 99402',
    serviceTitle: 'TGPSC Group-II Services Online Submission',
    targetPortalName: 'Telangana Public Service Commission (tgpsc.gov.in)',
    status: 'completed',
    assignedOperator: 'Operator #3 (K. Swamy)',
    feesCollected: 290,
    paymentMode: 'UPI',
    securityPin: '8823',
    presenceVerified: true,
    escrowCommission: 60,
    candidateIntake: {
      fatherName: 'Md. Azam Uddin',
      dob: '1997-09-30',
      aadhaarLast4: '9940',
      address: 'Tolichowki, Hyderabad',
      email: 'rehan.md@example.com',
    },
    filingDetails: {
      portalRegNumber: 'TGPSC-GRP2-2026-881920',
      challanReference: 'SBI-EPAY-8831920',
      completedAt: '2026-10-29T20:30:00+05:30',
    },
  },
];

