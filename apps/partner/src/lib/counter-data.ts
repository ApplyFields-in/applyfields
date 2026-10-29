export interface CounterServiceItem {
  id: string;
  title: string;
  category: 'Recruitment Exam' | 'MeeSeva Certificate' | 'Identity & Card' | 'Printing & Xerox';
  govtFeePaise: number;
  kioskFeePaise: number;
  femaleExemptGovtFee?: boolean;
  requiredDocuments: string[];
  portalUrl: string;
}

export const COUNTER_CATALOG: CounterServiceItem[] = [
  {
    id: 'srv-ssc-cgl',
    title: 'SSC CGL 2026 Application Filing',
    category: 'Recruitment Exam',
    govtFeePaise: 10000, // ₹100
    kioskFeePaise: 7000,  // ₹70
    femaleExemptGovtFee: true,
    requiredDocuments: [
      '10th SSC Marks Memo',
      'Passport Photo (White BG, 20-50KB)',
      'Candidate Signature (Black Ink, 10-20KB)',
      'Aadhaar Card',
    ],
    portalUrl: 'https://ssc.gov.in',
  },
  {
    id: 'srv-upsc-prelims',
    title: 'UPSC Civil Services Examination (OTR + Prelims)',
    category: 'Recruitment Exam',
    govtFeePaise: 10000, // ₹100
    kioskFeePaise: 10500, // ₹105
    femaleExemptGovtFee: true,
    requiredDocuments: [
      '10th Marks Memo (DOB Proof)',
      'Government Photo ID (Aadhaar/Voter/Passport)',
      'Passport Photo (350x350px)',
      'Signature Scan',
    ],
    portalUrl: 'https://upsconline.nic.in',
  },
  {
    id: 'srv-tgpsc-grp2',
    title: 'TGPSC Group-II Services Online Submission',
    category: 'Recruitment Exam',
    govtFeePaise: 20000, // ₹200
    kioskFeePaise: 7000,  // ₹70
    requiredDocuments: [
      'TGPSC OTR ID or 10th Memo',
      'Degree Certificate',
      'Caste Certificate (if claiming quota)',
      'Passport Photo & Signature',
    ],
    portalUrl: 'https://tgpsc.gov.in',
  },
  {
    id: 'srv-caste-cert',
    title: 'Integrated Caste & Domicile Certificate (MeeSeva)',
    category: 'MeeSeva Certificate',
    govtFeePaise: 4500,  // ₹45
    kioskFeePaise: 5000,  // ₹50
    requiredDocuments: [
      'Aadhaar Card',
      '1st to 10th Study Certificates',
      'Father/Paternal Relative Caste Certificate',
      'Ration Card / Food Security Card',
    ],
    portalUrl: 'https://ts.meeseva.telangana.gov.in',
  },
  {
    id: 'srv-income-cert',
    title: 'Annual Income Certificate for EBC / Scholarships',
    category: 'MeeSeva Certificate',
    govtFeePaise: 4500,  // ₹45
    kioskFeePaise: 5000,  // ₹50
    requiredDocuments: [
      'Ration Card / Food Security Card',
      'Aadhaar Card of Head of Household',
      'Salary Slip or Mandal Revenue Affidavit',
    ],
    portalUrl: 'https://ts.meeseva.telangana.gov.in',
  },
  {
    id: 'srv-pan-card',
    title: 'New Instant PAN Card (Physical + e-PAN)',
    category: 'Identity & Card',
    govtFeePaise: 10700, // ₹107
    kioskFeePaise: 7000,  // ₹70
    requiredDocuments: [
      'Aadhaar Card with active mobile link',
      '2 Passport Size Photographs',
      'Proof of Identity & Address',
    ],
    portalUrl: 'https://www.onlineservices.nsdl.com',
  },
  {
    id: 'srv-print-pack',
    title: 'Document Digitization, Color Scan & Print Pack',
    category: 'Printing & Xerox',
    govtFeePaise: 0,
    kioskFeePaise: 3000, // ₹30
    requiredDocuments: ['Original Physical Documents'],
    portalUrl: '',
  },
];

export interface WalkInTicket {
  tokenNumber: string;
  createdAt: string;
  citizenName: string;
  mobile: string;
  gender: 'Male' | 'Female' | 'Other';
  category: 'UR' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS';
  serviceTitle: string;
  govtFee: number;
  kioskFee: number;
  printFee: number;
  totalCollected: number;
  paymentMode: 'Cash' | 'UPI';
  status: 'counter_registered' | 'scanning_pending' | 'dispatched_to_backoffice';
}
