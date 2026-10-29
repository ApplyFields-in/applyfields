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

export const SAMPLE_SERVICE_REQUESTS: ServiceDeskRequest[] = [
  {
    id: 'req-001',
    token: 'AF-SSC-2026-9041',
    serviceTitle: 'SSC CGL 2026 Online Application Filing',
    serviceCategory: 'Exam Application',
    targetPortalName: 'Staff Selection Commission (SSC One-Time Portal)',
    targetPortalUrl: 'https://ssc.gov.in',
    status: 'ready_for_filing',
    priority: 'critical',
    portalDeadline: '2026-10-30T17:00:00+05:30', // Less than 24h
    createdAt: '2026-10-29T10:15:00+05:30',
    assignedOperator: 'Operator #4 (P. Srinivas)',
    applicant: {
      fullName: 'KONGARA VENKATA NAVEEN',
      fatherName: 'KONGARA RAMESH BABU',
      motherName: 'KONGARA LAKSHMI',
      dob: '2001-08-14',
      gender: 'Male',
      aadhaarMasked: 'XXXX-XXXX-4812',
      mobile: '+91 98480 23194',
      email: 'naveen.kongara2001@gmail.com',
      socialCategory: 'OBC-NCL',
      subCaste: 'Yadava (BC-D)',
      domicileState: 'Telangana',
      identificationMark1: 'A mole on the right side of the collar bone',
      identificationMark2: 'A small scar on the left index finger',
      address: {
        street: 'Flat 402, Sai Balaji Residency, Pillar 142, Ameerpet',
        city: 'Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        pincode: '500016',
      },
      education: {
        boardName: 'Board of Secondary Education, Telangana (BSE-TS)',
        hallTicketNo: '1628104921',
        yearOfPassing: 2017,
        percentageOrGpa: '9.8 CGPA',
        schoolName: 'St. Joseph High School, Ameerpet',
      },
    },
    partner: {
      id: 'pt-1',
      name: 'Sri Balaji MeeSeva & Xerox Centre',
      type: 'MeeSeva',
      centerCode: 'TS-HYD-0419',
      operatorName: 'R. Krishna Murthy',
      phone: '+91 94401 88392',
      city: 'Hyderabad',
    },
    fees: {
      govtFeePaise: 10000, // Rs. 100
      kioskFeePaise: 7000,  // Rs. 70
      platformFeePaise: 3000, // Rs. 30
      totalPaise: 20000,
    },
    documents: [
      {
        id: 'doc-1',
        name: 'Passport Photograph',
        type: 'photo',
        fileName: 'naveen_passport_photo_ssc_compliant.jpg',
        fileSize: '34.2 KB',
        dimensions: '200 x 230 px',
        url: '/sample-photo.jpg',
        verified: true,
        notes: 'White background, ears clearly visible, no spectacles.',
      },
      {
        id: 'doc-2',
        name: 'Candidate Signature',
        type: 'signature',
        fileName: 'naveen_signature_black_ink.jpg',
        fileSize: '14.8 KB',
        dimensions: '140 x 60 px',
        url: '/sample-sign.jpg',
        verified: true,
        notes: 'Black ballpoint ink on crisp white paper.',
      },
      {
        id: 'doc-3',
        name: '10th SSC Marks Memo',
        type: 'marks_memo',
        fileName: 'ssc_10th_memo_1628104921.pdf',
        fileSize: '245 KB',
        url: '/sample-marks-memo.pdf',
        verified: true,
        notes: 'Verified against BSE-TS roll number 1628104921.',
      },
      {
        id: 'doc-4',
        name: 'OBC Non-Creamy Layer Certificate',
        type: 'caste_cert',
        fileName: 'obc_ncl_cert_2026_27.pdf',
        fileSize: '312 KB',
        url: '/sample-caste-cert.pdf',
        verified: true,
        notes: 'Issued by Tahsildar Ameerpet Mandal. Valid for Central Govt employment.',
      },
    ],
  },
  {
    id: 'req-002',
    token: 'AF-UPSC-2026-3810',
    serviceTitle: 'UPSC Civil Services Examination (OTR + Prelims)',
    serviceCategory: 'Exam Application',
    targetPortalName: 'Union Public Service Commission (upsconline.nic.in)',
    targetPortalUrl: 'https://upsconline.nic.in',
    status: 'otp_pending',
    priority: 'high',
    portalDeadline: '2026-11-05T18:00:00+05:30',
    createdAt: '2026-10-29T11:40:00+05:30',
    assignedOperator: 'Operator #2 (Anjali K.)',
    applicant: {
      fullName: 'GUDURU POOJITHA',
      fatherName: 'GUDURU SIVA PRASAD',
      motherName: 'GUDURU SARADHA',
      dob: '2002-03-22',
      gender: 'Female',
      aadhaarMasked: 'XXXX-XXXX-9914',
      mobile: '+91 99890 44211',
      email: 'poojitha.guduru@gmail.com',
      socialCategory: 'EWS',
      subCaste: 'Reddy (Economically Weaker Section)',
      domicileState: 'Andhra Pradesh',
      identificationMark1: 'A birthmark on the left wrist',
      identificationMark2: 'A mole above the right eyebrow',
      address: {
        street: 'D.No 4-192, Main Bazaar, near Gandhi Statue',
        city: 'Guntur',
        district: 'Guntur',
        state: 'Andhra Pradesh',
        pincode: '522002',
      },
      education: {
        boardName: 'Board of Secondary Education, Andhra Pradesh (BSE-AP)',
        hallTicketNo: '1839201948',
        yearOfPassing: 2018,
        percentageOrGpa: '10.0 CGPA',
        schoolName: 'Z.P. High School, Guntur',
      },
    },
    partner: {
      id: 'pt-2',
      name: 'Kakatiya Digital CSC & MeeSeva Kendra',
      type: 'CSC',
      centerCode: 'AP-GNT-1022',
      operatorName: 'M. Sambasiva Rao',
      phone: '+91 98481 77210',
      city: 'Guntur',
    },
    fees: {
      govtFeePaise: 0, // Female applicants exempt in UPSC
      kioskFeePaise: 10500, // Rs. 105
      platformFeePaise: 4500, // Rs. 45
      totalPaise: 15000,
    },
    documents: [
      {
        id: 'doc-201',
        name: 'Passport Photograph',
        type: 'photo',
        fileName: 'poojitha_upsc_photo.jpg',
        fileSize: '41.0 KB',
        dimensions: '350 x 350 px',
        url: '/sample-photo-2.jpg',
        verified: true,
      },
      {
        id: 'doc-202',
        name: 'Signature Scan',
        type: 'signature',
        fileName: 'poojitha_sign.jpg',
        fileSize: '18.2 KB',
        dimensions: '140 x 60 px',
        url: '/sample-sign-2.jpg',
        verified: true,
      },
      {
        id: 'doc-203',
        name: 'Government Photo ID (Aadhaar)',
        type: 'aadhaar',
        fileName: 'aadhaar_card_masked.pdf',
        fileSize: '190 KB',
        url: '/sample-aadhaar.pdf',
        verified: true,
      },
    ],
    processingDetails: {
      portalRegNumber: 'OTR-2026-9481029',
      otpStatus: 'active',
      otpRequestedAt: '2026-10-29T21:45:00+05:30',
    },
  },
  {
    id: 'req-003',
    token: 'AF-TGPSC-2026-1184',
    serviceTitle: 'TGPSC Group-II Services Online Submission',
    serviceCategory: 'Exam Application',
    targetPortalName: 'Telangana Public Service Commission (tgpsc.gov.in)',
    targetPortalUrl: 'https://tgpsc.gov.in',
    status: 'triage',
    priority: 'normal',
    portalDeadline: '2026-11-12T23:59:00+05:30',
    createdAt: '2026-10-29T14:10:00+05:30',
    assignedOperator: null,
    applicant: {
      fullName: 'MOHAMMED REHAN UDDIN',
      fatherName: 'MOHAMMED AZHAR UDDIN',
      motherName: 'BEGUM SHAHIDA',
      dob: '1999-11-04',
      gender: 'Male',
      aadhaarMasked: 'XXXX-XXXX-3301',
      mobile: '+91 91210 99402',
      email: 'rehan.uddin99@gmail.com',
      socialCategory: 'OBC-NCL',
      subCaste: 'Muslim Shaikh (BC-E)',
      domicileState: 'Telangana',
      identificationMark1: 'A mole on the left thumb',
      identificationMark2: 'A scar on the left side of the forehead',
      address: {
        street: 'House 18-2-104/A, Falaknuma',
        city: 'Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        pincode: '500053',
      },
      education: {
        boardName: 'Board of Secondary Education, Telangana',
        hallTicketNo: '1429103982',
        yearOfPassing: 2015,
        percentageOrGpa: '8.7 CGPA',
        schoolName: 'Progressive Model School, Old City',
      },
    },
    partner: {
      id: 'pt-3',
      name: 'Charminar MeeSeva & Citizen Services',
      type: 'MeeSeva',
      centerCode: 'TS-HYD-0199',
      operatorName: 'Syed Farooq',
      phone: '+91 98492 10492',
      city: 'Hyderabad',
    },
    fees: {
      govtFeePaise: 20000,
      kioskFeePaise: 7000,
      platformFeePaise: 3000,
      totalPaise: 30000,
    },
    documents: [
      {
        id: 'doc-301',
        name: 'Passport Photograph',
        type: 'photo',
        fileName: 'rehan_photo.jpg',
        fileSize: '32.0 KB',
        dimensions: '200 x 230 px',
        url: '/sample-photo.jpg',
        verified: false,
      },
      {
        id: 'doc-302',
        name: 'Signature Scan',
        type: 'signature',
        fileName: 'rehan_sign.jpg',
        fileSize: '12.0 KB',
        dimensions: '140 x 60 px',
        url: '/sample-sign.jpg',
        verified: false,
      },
      {
        id: 'doc-303',
        name: '10th Class Memo',
        type: 'marks_memo',
        fileName: 'memo_1429103982.pdf',
        fileSize: '290 KB',
        url: '/sample-memo.pdf',
        verified: false,
      },
    ],
  },
  {
    id: 'req-004',
    token: 'AF-CERT-2026-8801',
    serviceTitle: 'Telangana Revenue Integrated Caste & Date of Birth Certificate',
    serviceCategory: 'Certificate',
    targetPortalName: 'MeeSeva Telangana Revenue Portal',
    targetPortalUrl: 'https://ts.meeseva.telangana.gov.in',
    status: 'completed',
    priority: 'normal',
    portalDeadline: '2026-11-20T17:00:00+05:30',
    createdAt: '2026-10-28T09:20:00+05:30',
    assignedOperator: 'Operator #1 (V. Satyanarayana)',
    applicant: {
      fullName: 'BANOTH PREM CHANDER',
      fatherName: 'BANOTH MOHAN',
      motherName: 'BANOTH BHARATHI',
      dob: '2003-05-18',
      gender: 'Male',
      aadhaarMasked: 'XXXX-XXXX-8193',
      mobile: '+91 97010 33910',
      email: 'prem.banoth@gmail.com',
      socialCategory: 'ST',
      subCaste: 'Lambada (Scheduled Tribe)',
      domicileState: 'Telangana',
      identificationMark1: 'A mole on the right ear lobe',
      identificationMark2: 'A mole on the left shoulder',
      address: {
        street: 'Thanda Road, Near Gram Panchayat Office',
        city: 'Mahabubabad',
        district: 'Mahabubabad',
        state: 'Telangana',
        pincode: '506101',
      },
      education: {
        boardName: 'Board of Secondary Education, Telangana',
        hallTicketNo: '1928301928',
        yearOfPassing: 2019,
        percentageOrGpa: '9.2 CGPA',
        schoolName: 'Tribal Welfare Residential School',
      },
    },
    partner: {
      id: 'pt-4',
      name: 'Bhadradri MeeSeva & Xerox',
      type: 'MeeSeva',
      centerCode: 'TS-MBD-0042',
      operatorName: 'B. Jagadeesh',
      phone: '+91 99480 11928',
      city: 'Mahabubabad',
    },
    fees: {
      govtFeePaise: 4500,
      kioskFeePaise: 5000,
      platformFeePaise: 2500,
      totalPaise: 12000,
    },
    documents: [
      {
        id: 'doc-401',
        name: 'Aadhaar Card',
        type: 'aadhaar',
        fileName: 'prem_aadhaar.pdf',
        fileSize: '180 KB',
        url: '/sample-aadhaar.pdf',
        verified: true,
      },
      {
        id: 'doc-402',
        name: 'School Study Certificate 1st to 10th',
        type: 'other',
        fileName: 'study_certificate_1to10.pdf',
        fileSize: '820 KB',
        url: '/sample-study.pdf',
        verified: true,
      },
    ],
    processingDetails: {
      portalRegNumber: 'TS-MEESEVA-CST-2026-99104',
      challanReference: 'CHL-MEE-8839102',
      submissionTimestamp: '2026-10-28T16:45:00+05:30',
      acknowledgementPdfUrl: '/receipts/TS-MEESEVA-CST-2026-99104.pdf',
    },
  },
  {
    id: 'req-005',
    token: 'AF-SSC-2026-7721',
    serviceTitle: 'SSC CHSL 10+2 Data Entry Operator Registration',
    serviceCategory: 'Exam Application',
    targetPortalName: 'Staff Selection Commission (SSC One-Time Portal)',
    targetPortalUrl: 'https://ssc.gov.in',
    status: 'defective',
    priority: 'high',
    portalDeadline: '2026-11-02T17:00:00+05:30',
    createdAt: '2026-10-29T08:00:00+05:30',
    assignedOperator: 'Operator #4 (P. Srinivas)',
    applicant: {
      fullName: 'CHINTHA RAVITEJA',
      fatherName: 'CHINTHA SRINIVAS',
      motherName: 'CHINTHA PADMA',
      dob: '2004-01-10',
      gender: 'Male',
      aadhaarMasked: 'XXXX-XXXX-1029',
      mobile: '+91 94411 77283',
      email: 'raviteja.chintha@gmail.com',
      socialCategory: 'OBC-NCL',
      subCaste: 'Padmashali (BC-B)',
      domicileState: 'Telangana',
      identificationMark1: 'A mole on the right temple',
      identificationMark2: 'A cut mark on the chin',
      address: {
        street: 'Weavers Colony, Ward 3',
        city: 'Sircilla',
        district: 'Rajanna Sircilla',
        state: 'Telangana',
        pincode: '505405',
      },
      education: {
        boardName: 'Board of Intermediate Education, Telangana',
        hallTicketNo: '2109283719',
        yearOfPassing: 2022,
        percentageOrGpa: '86.4%',
        schoolName: 'Govt Junior College, Sircilla',
      },
    },
    partner: {
      id: 'pt-5',
      name: 'Venkateshwara MeeSeva & Net Point',
      type: 'MeeSeva',
      centerCode: 'TS-SRC-0112',
      operatorName: 'Ch. Madhusudhan',
      phone: '+91 98488 44019',
      city: 'Sircilla',
    },
    fees: {
      govtFeePaise: 10000,
      kioskFeePaise: 7000,
      platformFeePaise: 3000,
      totalPaise: 20000,
    },
    documents: [
      {
        id: 'doc-501',
        name: 'Passport Photograph',
        type: 'photo',
        fileName: 'selfie_camera_photo.jpg',
        fileSize: '88.0 KB',
        dimensions: '400 x 500 px',
        url: '/sample-photo.jpg',
        verified: false,
        notes: 'Rejected: Photo is a selfie with blue curtain background and shadows on face.',
      },
      {
        id: 'doc-502',
        name: 'Candidate Signature',
        type: 'signature',
        fileName: 'signature_blue_pen.jpg',
        fileSize: '8.4 KB',
        dimensions: '140 x 40 px',
        url: '/sample-sign.jpg',
        verified: false,
        notes: 'Rejected: Signed in light blue ink on ruled paper; SSC requires black ballpoint ink on plain white paper.',
      },
    ],
    processingDetails: {
      defectReason: 'Photograph and signature fail SSC biometric ingestion standards.',
      defectChecklist: [
        'Photo must be taken against plain white background without flash glare',
        'Signature must be signed with black ballpoint ink on unlined plain white paper',
      ],
    },
  },
];
