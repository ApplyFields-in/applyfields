import type {
  ApplicationTrackerItem,
  BookingDetail,
  GovServiceCard,
  GovServiceList,
  HomeSummary,
  InstitutionEnquiry,
  OpportunityCard,
  OpportunityList,
  OpportunityType,
  PartnerSummary,
  SearchResponse,
  SearchResult,
  SearchResultType,
  UpdateItem,
} from '@applyfields/types';

/* ------------------------------------------------------------------ OPPORTUNITIES */

export const MOCK_OPPORTUNITIES: OpportunityCard[] = [
  // Govt Jobs
  {
    slug: 'ssc-cgl-2026-recruitment',
    type: 'govt_job',
    title: 'SSC Combined Graduate Level (CGL) Examination 2026',
    organization: 'Staff Selection Commission (SSC)',
    location: 'All India',
    qualification: 'Graduate',
    vacancies: 14500,
    last_date: '2026-11-20',
    days_left: 27,
    tags: ['Central', 'SSC', 'Graduate', 'Group-B', 'Group-C'],
    eligibility: 'eligible',
  },
  {
    slug: 'upsc-civil-services-2026',
    type: 'govt_job',
    title: 'Civil Services (Preliminary) Examination 2026 (IAS/IPS/IFS)',
    organization: 'Union Public Service Commission (UPSC)',
    location: 'All India',
    qualification: 'Graduate',
    vacancies: 1056,
    last_date: '2026-11-15',
    days_left: 22,
    tags: ['Central', 'UPSC', 'Graduate', 'All India'],
    eligibility: 'eligible',
  },
  {
    slug: 'appsc-group-2-services-2026',
    type: 'govt_job',
    title: 'APPSC Group-2 Services Recruitment (Executive & Non-Executive)',
    organization: 'Andhra Pradesh Public Service Commission (APPSC)',
    location: 'Andhra Pradesh',
    qualification: 'Graduate',
    vacancies: 897,
    last_date: '2026-11-08',
    days_left: 15,
    tags: ['State', 'APPSC', 'Andhra Pradesh', 'Graduate'],
    eligibility: 'likely_eligible',
  },
  {
    slug: 'tspsc-group-1-services-2026',
    type: 'govt_job',
    title: 'TSPSC Group-1 Services 563 Gazetted Posts Notification',
    organization: 'Telangana State Public Service Commission (TSPSC)',
    location: 'Telangana',
    qualification: 'Graduate',
    vacancies: 563,
    last_date: '2026-11-12',
    days_left: 19,
    tags: ['State', 'TSPSC', 'Telangana', 'Graduate'],
    eligibility: 'eligible',
  },
  {
    slug: 'ibps-po-recruitment-2026',
    type: 'govt_job',
    title: 'IBPS Common Recruitment Process for Probationary Officers (CRP PO/MT-XIV)',
    organization: 'Institute of Banking Personnel Selection (IBPS)',
    location: 'All India',
    qualification: 'Graduate',
    vacancies: 4200,
    last_date: '2026-10-31',
    days_left: 7,
    tags: ['Banking', 'Central', 'Graduate'],
    eligibility: 'eligible',
  },
  {
    slug: 'rrb-ntpc-recruitment-2026',
    type: 'govt_job',
    title: 'RRB Non-Technical Popular Categories (NTPC) Undergraduate & Graduate Posts',
    organization: 'Railway Recruitment Control Board (RRB)',
    location: 'All India',
    qualification: '12th pass',
    vacancies: 11558,
    last_date: '2026-11-25',
    days_left: 32,
    tags: ['Railways', 'Central', '12th', 'Graduate'],
    eligibility: 'eligible',
  },
  {
    slug: 'isro-scientist-engineer-sc-2026',
    type: 'govt_job',
    title: 'ISRO Scientist/Engineer ‘SC’ in Civil, Electrical, Mechanical & CS',
    organization: 'Indian Space Research Organisation (ISRO)',
    location: 'All India',
    qualification: 'Graduate',
    vacancies: 320,
    last_date: '2026-11-10',
    days_left: 17,
    tags: ['PSU', 'Central', 'B.Tech', 'GATE'],
    eligibility: 'eligible',
  },
  {
    slug: 'sbi-junior-associates-clerk-2026',
    type: 'govt_job',
    title: 'State Bank of India (SBI) Junior Associates (Customer Support & Sales)',
    organization: 'State Bank of India (SBI)',
    location: 'All India',
    qualification: 'Graduate',
    vacancies: 8283,
    last_date: '2026-11-18',
    days_left: 25,
    tags: ['Banking', 'SBI', 'Graduate', 'Clerk'],
    eligibility: 'likely_eligible',
  },
  {
    slug: 'ap-police-sub-inspector-2026',
    type: 'govt_job',
    title: 'AP Police State Level Recruitment: Sub-Inspectors (Civil & APSP)',
    organization: 'AP State Level Police Recruitment Board (APSLPRB)',
    location: 'Andhra Pradesh',
    qualification: 'Graduate',
    vacancies: 651,
    last_date: '2026-11-30',
    days_left: 37,
    tags: ['Police', 'State', 'AP', 'Graduate'],
    eligibility: 'eligible',
  },
  {
    slug: 'drdo-ceptam-11-senior-technical-assistant',
    type: 'govt_job',
    title: 'DRDO CEPTAM-11 Senior Technical Assistant (STA-B) & Technician-A',
    organization: 'Defence Research and Development Organisation (DRDO)',
    location: 'All India',
    qualification: 'Diploma',
    vacancies: 1901,
    last_date: '2026-11-22',
    days_left: 29,
    tags: ['Defence', 'Central', 'Diploma', 'ITI'],
    eligibility: 'eligible',
  },

  // Exams
  {
    slug: 'neet-ug-2027-entrance-exam',
    type: 'exam',
    title: 'National Eligibility cum Entrance Test (NEET UG) 2027',
    organization: 'National Testing Agency (NTA)',
    location: 'All India',
    qualification: '12th pass',
    vacancies: null,
    last_date: '2026-12-15',
    days_left: 52,
    tags: ['Entrance', 'Medical', 'Central', '12th'],
    eligibility: 'eligible',
  },
  {
    slug: 'jee-advanced-2026',
    type: 'exam',
    title: 'Joint Entrance Examination (JEE Advanced) 2026 for IIT Admissions',
    organization: 'IIT Joint Admission Board (JAB)',
    location: 'All India',
    qualification: '12th pass',
    vacancies: null,
    last_date: '2026-12-01',
    days_left: 38,
    tags: ['Entrance', 'Engineering', 'IIT', '12th'],
    eligibility: 'eligible',
  },
  {
    slug: 'gate-2027-examination',
    type: 'exam',
    title: 'Graduate Aptitude Test in Engineering (GATE) 2027',
    organization: 'Indian Institute of Technology (IIT Roorkee)',
    location: 'All India',
    qualification: 'Graduate',
    vacancies: null,
    last_date: '2026-11-05',
    days_left: 12,
    tags: ['Competitive', 'Engineering', 'PSU', 'M.Tech'],
    eligibility: 'eligible',
  },
  {
    slug: 'cuet-ug-2026-central-universities',
    type: 'exam',
    title: 'Common University Entrance Test (CUET UG) 2026',
    organization: 'National Testing Agency (NTA)',
    location: 'All India',
    qualification: '12th pass',
    vacancies: null,
    last_date: '2026-11-28',
    days_left: 35,
    tags: ['Entrance', 'University', 'Central', '12th'],
    eligibility: 'eligible',
  },
  {
    slug: 'cat-2026-iim-entrance',
    type: 'exam',
    title: 'Common Admission Test (CAT) 2026 for IIMs & Top Business Schools',
    organization: 'Indian Institutes of Management (IIM)',
    location: 'All India',
    qualification: 'Graduate',
    vacancies: null,
    last_date: '2026-10-28',
    days_left: 4,
    tags: ['Entrance', 'Management', 'MBA', 'Graduate'],
    eligibility: 'eligible',
  },

  // Scholarships
  {
    slug: 'nsp-post-matric-scholarship-sc-st-obc',
    type: 'scholarship',
    title: 'National Scholarship Portal (NSP) Post-Matric Scholarship Scheme 2026-27',
    organization: 'Ministry of Social Justice & Empowerment (MoSJE)',
    location: 'All India',
    qualification: '10th pass',
    vacancies: null,
    last_date: '2026-11-30',
    days_left: 37,
    tags: ['Central', 'Post-Matric', 'OBC', 'SC', 'ST'],
    eligibility: 'eligible',
  },
  {
    slug: 'pm-yasasvi-central-scholarship-2026',
    type: 'scholarship',
    title: 'PM Young Achievers Scholarship Award Scheme (YASASVI) for Vibrant India',
    organization: 'Ministry of Social Justice & Empowerment',
    location: 'All India',
    qualification: '10th pass',
    vacancies: null,
    last_date: '2026-11-15',
    days_left: 22,
    tags: ['Central', 'School', 'College', 'Merit'],
    eligibility: 'eligible',
  },
  {
    slug: 'reliance-foundation-undergraduate-scholarships',
    type: 'scholarship',
    title: 'Reliance Foundation Undergraduate Scholarships 2026 (₹2 Lakhs Grant)',
    organization: 'Reliance Foundation',
    location: 'All India',
    qualification: '12th pass',
    vacancies: 5000,
    last_date: '2026-12-05',
    days_left: 42,
    tags: ['Merit', 'Private', 'Undergraduate', '₹2 Lakhs'],
    eligibility: 'eligible',
  },
  {
    slug: 'tata-trusts-medical-engineering-scholarships',
    type: 'scholarship',
    title: 'Tata Trusts Merit-cum-Means Scholarships for Medical & Engineering',
    organization: 'Tata Trusts Educational Community',
    location: 'All India',
    qualification: '12th pass',
    vacancies: null,
    last_date: '2026-11-20',
    days_left: 27,
    tags: ['Merit', 'Professional', 'Engineering', 'MBBS'],
    eligibility: 'likely_eligible',
  },

  // Admissions
  {
    slug: 'iit-madras-bs-data-science-admissions',
    type: 'admission',
    title: 'IIT Madras 4-Year BS Degree in Data Science & Artificial Intelligence',
    organization: 'Indian Institute of Technology Madras (IITM)',
    location: 'All India',
    qualification: '12th pass',
    vacancies: null,
    last_date: '2026-11-15',
    days_left: 22,
    tags: ['College', 'University', 'IIT', 'Data Science', 'Online'],
    eligibility: 'eligible',
  },
  {
    slug: 'delhi-university-ug-admissions-cuet',
    type: 'admission',
    title: 'University of Delhi Undergraduate Degree Admissions (CSAS 2026)',
    organization: 'University of Delhi (DU)',
    location: 'Delhi',
    qualification: '12th pass',
    vacancies: 71000,
    last_date: '2026-11-10',
    days_left: 17,
    tags: ['University', 'Central', 'Undergraduate', 'CUET'],
    eligibility: 'eligible',
  },
  {
    slug: 'aiims-new-delhi-mbbs-admissions',
    type: 'admission',
    title: 'All India Institute of Medical Sciences (AIIMS) MBBS Admissions 2026',
    organization: 'AIIMS New Delhi',
    location: 'All India',
    qualification: '12th pass',
    vacancies: 2044,
    last_date: '2026-12-10',
    days_left: 47,
    tags: ['College', 'Medical', 'AIIMS', 'NEET'],
    eligibility: 'eligible',
  },
  {
    slug: 'nlu-consortium-clat-integrated-law',
    type: 'admission',
    title: 'Consortium of NLUs 5-Year Integrated BA LLB & BBA LLB Admissions',
    organization: 'Consortium of National Law Universities',
    location: 'All India',
    qualification: '12th pass',
    vacancies: 3200,
    last_date: '2026-11-25',
    days_left: 32,
    tags: ['University', 'Law', 'CLAT', 'NLUs'],
    eligibility: 'eligible',
  },
];

export function getMockOpportunities(
  type?: OpportunityType,
  params: {
    q?: string;
    category?: string;
    state?: string;
    qualification?: string;
    deadline?: string;
    eligible?: boolean;
  } = {},
): OpportunityList {
  let list = type ? MOCK_OPPORTUNITIES.filter((item) => item.type === type) : [...MOCK_OPPORTUNITIES];

  if (params.q) {
    const qLower = params.q.toLowerCase();
    list = list.filter(
      (item) =>
        item.title.toLowerCase().includes(qLower) ||
        item.organization.toLowerCase().includes(qLower) ||
        item.tags.some((t) => t.toLowerCase().includes(qLower)),
    );
  }

  if (params.category && params.category !== 'All') {
    const catLower = params.category.toLowerCase();
    list = list.filter(
      (item) =>
        item.tags.some((t) => t.toLowerCase() === catLower) ||
        item.organization.toLowerCase().includes(catLower) ||
        item.title.toLowerCase().includes(catLower),
    );
  }

  if (params.state) {
    const stLower = params.state.toLowerCase();
    list = list.filter(
      (item) =>
        item.location.toLowerCase() === 'all india' ||
        item.location.toLowerCase().includes(stLower) ||
        item.tags.some((t) => t.toLowerCase() === stLower),
    );
  }

  if (params.qualification) {
    const qualLower = params.qualification.toLowerCase();
    list = list.filter((item) => item.qualification.toLowerCase().includes(qualLower));
  }

  if (params.deadline) {
    if (params.deadline === 'closing_soon') {
      list = list.filter((item) => (item.days_left ?? 99) <= 7);
    } else if (params.deadline === 'this_month') {
      list = list.filter((item) => (item.days_left ?? 99) <= 30);
    } else if (params.deadline === 'today') {
      list = list.filter((item) => item.days_left === 0);
    }
  }

  if (params.eligible) {
    list = list.filter((item) => item.eligibility === 'eligible' || item.eligibility === 'likely_eligible');
  }

  return {
    total: list.length,
    type: type ?? 'govt_job',
    query: params.q || '',
    sample: false,
    items: list,
  };
}

/* ------------------------------------------------------------------ CITIZEN SERVICES */

export const MOCK_GOV_SERVICES: GovServiceCard[] = [
  {
    id: 'srv-pan-card',
    slug: 'pan-card-new-application-49a',
    name: 'New Permanent Account Number (PAN Card) — Form 49A',
    category: 'Identity & Certificates',
    organization: 'Income Tax Department (ITD)',
    authority_name: 'Protean eGov / UTIITSL (NSDL)',
    authority_level: 'central',
    location: 'All India',
    state_codes: ['ALL'],
    description:
      'Official PAN card allotment under Section 139A of IT Act. Mandatory for bank accounts, tax filings, citizen investments, and government subsidies.',
    fee_text: '₹107 (Physical card within India) / ₹72 (e-PAN)',
    processing_time_text: '10–15 business days (Instant e-PAN within 2 hours)',
    required_documents_count: 3,
    official_url: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
    apply_url: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
    assistance_available: true,
    status: 'published',
    published_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'srv-passport',
    slug: 'indian-passport-fresh-reissue',
    name: 'Indian Passport (Fresh / Re-issue) — Normal & Tatkaal',
    category: 'Identity & Certificates',
    organization: 'Ministry of External Affairs (MEA)',
    authority_name: 'Passport Seva Kendra (PSK / POPSK)',
    authority_level: 'central',
    location: 'All India',
    state_codes: ['ALL'],
    description:
      '36-page or 60-page biometric Indian passport booklet for international travel. Online appointment booking at nearest Passport Seva Kendra.',
    fee_text: '₹1,500 (Normal 36 pages) / ₹3,500 (Tatkaal)',
    processing_time_text: '7–10 days (Normal) / 1–3 days (Tatkaal)',
    required_documents_count: 4,
    official_url: 'https://www.passportindia.gov.in',
    apply_url: 'https://www.passportindia.gov.in',
    assistance_available: true,
    status: 'published',
    published_at: '2026-09-05T00:00:00Z',
  },
  {
    id: 'srv-caste-certificate',
    slug: 'integrated-caste-community-certificate',
    name: 'Integrated Caste, Community & Nativity Certificate',
    category: 'Identity & Certificates',
    organization: 'Revenue Department',
    authority_name: 'Tahsildar / MeeSeva / e-District',
    authority_level: 'state',
    location: 'All States / State Portals',
    state_codes: ['AP', 'TS', 'KA', 'TN', 'MH'],
    description:
      'Statutory caste certificate for SC, ST, BC, OBC categories. Required for college admissions, fee reimbursements, reservation quotas, and welfare schemes.',
    fee_text: '₹45 (MeeSeva / e-District statutory fee)',
    processing_time_text: '15–30 calendar days',
    required_documents_count: 4,
    official_url: 'https://meeseva.telangana.gov.in',
    apply_url: 'https://meeseva.telangana.gov.in',
    assistance_available: true,
    status: 'published',
    published_at: '2026-09-10T00:00:00Z',
  },
  {
    id: 'srv-income-certificate',
    slug: 'income-and-asset-certificate',
    name: 'Income & Asset Certificate (EWS & Scholarship Verification)',
    category: 'Identity & Certificates',
    organization: 'Revenue Department',
    authority_name: 'Tahsildar / Village Revenue Officer (VRO)',
    authority_level: 'state',
    location: 'All States',
    state_codes: ['ALL'],
    description:
      'Authoritative annual family income certificate issued after ground verification. Prerequisite for NSP scholarships, EWS quota (10%), and government fee concessions.',
    fee_text: '₹45 (Statutory application fee)',
    processing_time_text: '7–15 business days',
    required_documents_count: 3,
    official_url: 'https://gramawardsachivalayam.ap.gov.in',
    apply_url: 'https://gramawardsachivalayam.ap.gov.in',
    assistance_available: true,
    status: 'published',
    published_at: '2026-09-12T00:00:00Z',
  },
  {
    id: 'srv-driving-license',
    slug: 'driving-license-learner-permanent',
    name: 'Learner & Permanent Driving License (Sarathi Parivahan)',
    category: 'Transport & Vehicles',
    organization: 'Ministry of Road Transport and Highways (MoRTH)',
    authority_name: 'Regional Transport Authority (RTO / Sarathi)',
    authority_level: 'central',
    location: 'All India',
    state_codes: ['ALL'],
    description:
      'Online application, slot booking for computerized learner test, and biometric driving skill test at regional RTO tracks.',
    fee_text: '₹150 (Learner) + ₹200 (Permanent License) + ₹200 (Smart card)',
    processing_time_text: 'Slot instant; License dispatched in 5–7 days',
    required_documents_count: 4,
    official_url: 'https://parivahan.gov.in/parivahan',
    apply_url: 'https://parivahan.gov.in/parivahan',
    assistance_available: true,
    status: 'published',
    published_at: '2026-09-15T00:00:00Z',
  },
  {
    id: 'srv-digilocker-sync',
    slug: 'digilocker-aadhaar-document-wallet',
    name: 'DigiLocker Government Document Wallet & Verification',
    category: 'Identity & Certificates',
    organization: 'Ministry of Electronics & Information Technology (MeitY)',
    authority_name: 'National e-Governance Division (NeGD)',
    authority_level: 'central',
    location: 'All India',
    state_codes: ['ALL'],
    description:
      'Legally valid digital copies of Aadhaar, Driving License, Class 10/12 Marksheets, and Vehicle RC under Information Technology Rules 2016.',
    fee_text: 'Free (Government of India initiative)',
    processing_time_text: 'Instant Aadhaar OTP verification',
    required_documents_count: 1,
    official_url: 'https://www.digilocker.gov.in',
    apply_url: 'https://www.digilocker.gov.in',
    assistance_available: true,
    status: 'published',
    published_at: '2026-09-18T00:00:00Z',
  },
  {
    id: 'srv-birth-certificate',
    slug: 'birth-certificate-registration-correction',
    name: 'Birth Certificate Issuance & Digital Name Inclusion',
    category: 'Utility & Municipal',
    organization: 'Office of the Registrar General of India (ORGI)',
    authority_name: 'Municipal Corporation / Civil Registration System (CRS)',
    authority_level: 'local',
    location: 'All States / Urban Local Bodies',
    state_codes: ['ALL'],
    description:
      'Official birth registration certificate under Section 12/17 of the Registration of Births and Deaths Act. Essential for passport and school admissions.',
    fee_text: '₹20 to ₹50 depending on state municipality',
    processing_time_text: '7–21 calendar days',
    required_documents_count: 3,
    official_url: 'https://crsorgi.gov.in',
    apply_url: 'https://crsorgi.gov.in',
    assistance_available: true,
    status: 'published',
    published_at: '2026-09-20T00:00:00Z',
  },
  {
    id: 'srv-ration-card',
    slug: 'ration-card-family-member-addition-split',
    name: 'Ration Card Member Addition, Modification & Split',
    category: 'Social Welfare & Pensions',
    organization: 'Department of Consumer Affairs, Food & Civil Supplies',
    authority_name: 'National Food Security Portal (NFSA) / ePDS',
    authority_level: 'state',
    location: 'All States',
    state_codes: ['ALL'],
    description:
      'Add new family members, update Aadhaar seeding, or apply for new National Food Security Act (NFSA) White/Pink Ration Card.',
    fee_text: '₹35 processing fee',
    processing_time_text: '15–30 days',
    required_documents_count: 4,
    official_url: 'https://nfsa.gov.in',
    apply_url: 'https://nfsa.gov.in',
    assistance_available: true,
    status: 'published',
    published_at: '2026-09-22T00:00:00Z',
  },
];

export function getMockGovServices(params: { q?: string; category?: string; state?: string } = {}): GovServiceList {
  let list = [...MOCK_GOV_SERVICES];

  if (params.q) {
    const qLower = params.q.toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(qLower) ||
        (s.description && s.description.toLowerCase().includes(qLower)) ||
        (s.authority_name && s.authority_name.toLowerCase().includes(qLower)),
    );
  }

  if (params.category && params.category !== 'All' && params.category !== 'All Services') {
    const catLower = params.category.toLowerCase();
    list = list.filter((s) => s.category?.toLowerCase() === catLower);
  }

  return {
    total: list.length,
    query: params.q || '',
    category: params.category || '',
    items: list,
  };
}

/* ------------------------------------------------------------------ CITIZEN APPLICATIONS & BOOKINGS */

export const MOCK_APPLICATIONS: ApplicationTrackerItem[] = [
  {
    id: 'app-tracker-1',
    user_id: 'user-demo-citizen',
    opportunity_id: 'opp-cgl-2026',
    title: 'SSC Combined Graduate Level (CGL) 2026',
    organization: 'Staff Selection Commission (SSC)',
    type: 'govt_job',
    slug: 'ssc-cgl-2026-recruitment',
    mode: 'official',
    status: 'applied',
    application_number: 'SSC-CGL-2026-8921470',
    roll_number: '2201089241',
    exam_date: '2026-12-18',
    exam_center: 'iON Digital Zone iDZ, Karmanghat, Hyderabad',
    applied_on: '2026-10-15',
    deadline: '2026-11-20',
    notes: 'Tier-1 admit card expected by 1st week of December. Prepared with reasoning and quantitative mock tests.',
    documents_ready: true,
    created_at: '2026-10-15T10:30:00Z',
    updated_at: '2026-10-18T14:20:00Z',
  },
  {
    id: 'app-tracker-2',
    user_id: 'user-demo-citizen',
    opportunity_id: 'opp-appsc-g2',
    title: 'APPSC Group-2 Services Recruitment 2026',
    organization: 'Andhra Pradesh Public Service Commission (APPSC)',
    type: 'govt_job',
    slug: 'appsc-group-2-services-2026',
    mode: 'applyfields_assisted',
    status: 'exam_interview',
    application_number: 'APPSC-G2-2026-44129',
    roll_number: '78201449',
    exam_date: '2026-11-24',
    exam_center: 'Govt Polytechnic College, Benz Circle, Vijayawada',
    applied_on: '2026-10-02',
    deadline: '2026-11-08',
    notes: 'Hall Ticket downloaded. Need to carry 2 passport photos and original Aadhaar card.',
    documents_ready: true,
    created_at: '2026-10-02T08:00:00Z',
    updated_at: '2026-10-20T16:00:00Z',
  },
  {
    id: 'app-tracker-3',
    user_id: 'user-demo-citizen',
    opportunity_id: 'opp-ibps-po-14',
    title: 'IBPS CRP PO/MT-XIV Probationary Officer',
    organization: 'Institute of Banking Personnel Selection (IBPS)',
    type: 'govt_job',
    slug: 'ibps-po-recruitment-2026',
    mode: 'official',
    status: 'selected',
    application_number: 'IBPS-PO-XIV-783210',
    roll_number: '14902188',
    exam_date: '2026-10-10',
    exam_center: 'Online Computer Center, Ameerpet, Hyderabad',
    applied_on: '2026-09-20',
    deadline: '2026-10-31',
    notes: 'Prelims cleared with 78.5 marks! Mains exam scheduled for 30th November.',
    documents_ready: true,
    created_at: '2026-09-20T11:15:00Z',
    updated_at: '2026-10-22T09:45:00Z',
  },
  {
    id: 'app-tracker-4',
    user_id: 'user-demo-citizen',
    opportunity_id: 'opp-isro-scientist',
    title: 'ISRO Scientist/Engineer SC Computer Science',
    organization: 'Indian Space Research Organisation (ISRO)',
    type: 'govt_job',
    slug: 'isro-scientist-engineer-sc-2026',
    mode: 'official',
    status: 'planning',
    application_number: null,
    roll_number: null,
    exam_date: null,
    exam_center: null,
    applied_on: null,
    deadline: '2026-11-10',
    notes: 'Gathering B.Tech consolidated marks memo and caste certificate scans before final submission.',
    documents_ready: false,
    created_at: '2026-10-21T18:00:00Z',
    updated_at: '2026-10-21T18:00:00Z',
  },
  {
    id: 'app-tracker-5',
    user_id: 'user-demo-citizen',
    opportunity_id: 'opp-nsp-scholarship',
    title: 'NSP Post-Matric Scholarship Scheme 2026',
    organization: 'Ministry of Social Justice & Empowerment',
    type: 'scholarship',
    slug: 'nsp-post-matric-scholarship-sc-st-obc',
    mode: 'official',
    status: 'completed',
    application_number: 'NSP-TS-2026-99214',
    roll_number: null,
    exam_date: null,
    exam_center: null,
    applied_on: '2026-08-14',
    deadline: '2026-11-30',
    notes: 'Institution verification completed. DBT payment of ₹25,000 disbursed to Aadhaar-linked bank account.',
    documents_ready: true,
    created_at: '2026-08-14T12:00:00Z',
    updated_at: '2026-10-01T15:30:00Z',
  },
];

export const MOCK_BOOKINGS: BookingDetail[] = [
  {
    id: 'bk-demo-1',
    user_id: 'user-demo-citizen',
    partner_id: 'pt-1',
    partner_business_name: 'Sri Lakshmi Digital Seva & MeeSeva Kendra',
    partner_slug: 'sri-lakshmi-digital-seva-hyderabad',
    partner_phone: '+91 98480 12345',
    partner_address: 'Shop #12, Ground Floor, Opp Metro Pillar 1042, Ameerpet, Hyderabad',
    partner_service_id: 'ps-5',
    service_id: 'srv-passport',
    service_name: 'Tatkaal Passport Form Filling & Document Collation',
    opportunity_id: null,
    status: 'accepted',
    quoted_paise: 35000,
    final_paise: 35000,
    appointment_at: '2026-10-28T11:30:00Z',
    user_note: 'Assistance booked for Annexure preparation and online appointment slot lock.',
    partner_note: 'Documents verified. Appointment confirmed.',
    cancelled_reason: null,
    completed_at: null,
    created_at: '2026-10-22T09:00:00Z',
    updated_at: '2026-10-22T09:30:00Z',
    events: [],
    review: null,
  },
  {
    id: 'bk-demo-2',
    user_id: 'user-demo-citizen',
    partner_id: 'pt-2',
    partner_business_name: 'Apex Citizen Assistance & Cyber Point',
    partner_slug: 'apex-citizen-cyber-bangalore',
    partner_phone: '+91 98801 54321',
    partner_address: 'No 45, Brigade Road, Ashok Nagar, Bangalore, Karnataka',
    partner_service_id: 'ps-1',
    service_id: 'srv-pan-card',
    service_name: 'Aadhaar Biometric Update & Name Correction Token',
    opportunity_id: null,
    status: 'in_progress',
    quoted_paise: 15000,
    final_paise: 15000,
    appointment_at: '2026-10-29T15:00:00Z',
    user_note: 'Token issued. Citizen requested to bring 10th marks memo as DOB proof.',
    partner_note: null,
    cancelled_reason: null,
    completed_at: null,
    created_at: '2026-10-23T14:00:00Z',
    updated_at: '2026-10-24T10:00:00Z',
    events: [],
    review: null,
  },
];

export const MOCK_ENQUIRIES: InstitutionEnquiry[] = [
  {
    id: 'enq-demo-1',
    institution_id: 'inst-iit-madras',
    institution_name: 'Indian Institute of Technology Madras (IITM)',
    institution_slug: 'iit-madras',
    user_id: 'user-demo-citizen',
    course_id: 'course-bs-ds',
    course_name: 'BS Degree in Data Science & Artificial Intelligence',
    name: 'Yendluri Ghana Sathya Karthik',
    phone: '+91 98480 99887',
    email: 'karthik@example.com',
    message: 'Inquiring about credit waiver for diploma holders and upcoming term qualifier test dates.',
    status: 'responded',
    response:
      'Qualifier exam registrations are active until Nov 15. Diploma holders can apply directly under the general qualifier track.',
    responded_at: '2026-10-23T11:00:00Z',
    created_at: '2026-10-20T10:00:00Z',
    updated_at: '2026-10-23T11:00:00Z',
  },
  {
    id: 'enq-demo-2',
    institution_id: 'inst-bits-pilani',
    institution_name: 'BITS Pilani Work Integrated Learning Programmes',
    institution_slug: 'bits-pilani',
    user_id: 'user-demo-citizen',
    course_id: 'course-mtech-se',
    course_name: 'M.Tech Software Engineering for Working Professionals',
    name: 'Yendluri Ghana Sathya Karthik',
    phone: '+91 98480 99887',
    email: 'karthik@example.com',
    message: 'Requesting syllabus details, semester fee schedule, and company sponsorship guidelines.',
    status: 'new',
    response: null,
    responded_at: null,
    created_at: '2026-10-24T09:30:00Z',
    updated_at: '2026-10-24T09:30:00Z',
  },
];

/* ------------------------------------------------------------------ CITIZEN ASSISTANCE PARTNERS */

export const MOCK_PARTNER_SUMMARIES: PartnerSummary[] = [
  {
    id: 'pt-1',
    slug: 'sri-lakshmi-digital-seva-hyderabad',
    type: 'csc',
    business_name: 'Sri Lakshmi Digital Seva & MeeSeva Kendra',
    description:
      'Certified Government E-Seva center providing prompt online application filing, certificates, biometric updates, and Tatkaal passport processing.',
    logo_url: null,
    owner_name: 'K. Venkat Rao',
    phone: '+91 98480 12345',
    whatsapp: '+91 98480 12345',
    email: 'srilakshmi.meeseva@gmail.com',
    address: 'Shop #12, Ground Floor, Opp Metro Pillar 1042, Ameerpet',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state_code: 'TS',
    pincode: '500016',
    latitude: 17.437462,
    longitude: 78.448288,
    service_areas: ['Ameerpet', 'SR Nagar', 'Panjagutta', 'Sanjeeva Reddy Nagar'],
    working_hours: {
      mon: ['09:00', '20:00'],
      tue: ['09:00', '20:00'],
      wed: ['09:00', '20:00'],
      thu: ['09:00', '20:00'],
      fri: ['09:00', '20:00'],
      sat: ['09:00', '18:00'],
    },
    is_available: true,
    verification_status: 'verified',
    is_listed: true,
    rating_avg: 4.9,
    rating_count: 218,
    services: [
      { id: 'ps-1', partner_id: 'pt-1', service_id: 'srv-pan-card', name: 'PAN Card Form 49A Application', description: 'PAN card application with photo and signature upload.', charge_paise: 15000, charge_text: '₹150', estimated_time_text: '1-2 days', is_active: true },
      { id: 'ps-2', partner_id: 'pt-1', service_id: null, name: 'Aadhaar PVC Card Print & Lamination', description: 'Color print and thermal lamination of official Aadhaar PVC.', charge_paise: 5000, charge_text: '₹50', estimated_time_text: 'Same day', is_active: true },
      { id: 'ps-3', partner_id: 'pt-1', service_id: 'srv-caste-certificate', name: 'Caste & Income Certificate Online Filing', description: 'Submission on MeeSeva portal with Tahsildar approval tracking.', charge_paise: 10000, charge_text: '₹100', estimated_time_text: '3-5 days', is_active: true },
      { id: 'ps-4', partner_id: 'pt-1', service_id: null, name: 'Govt Job Online Form Submission (UPSC/SSC/APPSC)', description: 'Document resizing, fee payment, and final PDF generation.', charge_paise: 20000, charge_text: '₹200', estimated_time_text: '1 hour', is_active: true },
    ],
  },
  {
    id: 'pt-2',
    slug: 'apex-citizen-cyber-bangalore',
    type: 'browsing_centre',
    business_name: 'Apex Citizen Assistance & Cyber Point',
    description:
      'High-speed scanning, color printing, document collation, passport appointment booking, and university admission form filling desk.',
    logo_url: null,
    owner_name: 'Ramesh Hegde',
    phone: '+91 98801 54321',
    whatsapp: '+91 98801 54321',
    email: 'apex.cyber.blr@gmail.com',
    address: 'No 45, Brigade Road, Ashok Nagar',
    city: 'Bangalore',
    district: 'Bengaluru Urban',
    state_code: 'KA',
    pincode: '560001',
    latitude: 12.971599,
    longitude: 77.594566,
    service_areas: ['MG Road', 'Brigade Road', 'Indiranagar', 'Richmond Town'],
    working_hours: {
      mon: ['09:30', '19:30'],
      tue: ['09:30', '19:30'],
      wed: ['09:30', '19:30'],
      thu: ['09:30', '19:30'],
      fri: ['09:30', '19:30'],
      sat: ['10:00', '17:00'],
    },
    is_available: true,
    verification_status: 'verified',
    is_listed: true,
    rating_avg: 4.8,
    rating_count: 145,
    services: [
      { id: 'ps-5', partner_id: 'pt-2', service_id: 'srv-passport', name: 'Tatkaal Passport Appointment & Form Filling', description: 'Expedited passport filing and appointment slot allocation.', charge_paise: 35000, charge_text: '₹350', estimated_time_text: 'Same day', is_active: true },
      { id: 'ps-6', partner_id: 'pt-2', service_id: null, name: 'National Scholarship Portal (NSP) Application', description: 'Income proof upload, bonafide certificate submission.', charge_paise: 12000, charge_text: '₹120', estimated_time_text: '1-2 days', is_active: true },
      { id: 'ps-7', partner_id: 'pt-2', service_id: 'srv-driving-license', name: 'Driving License Online Learner Slot Booking', description: 'Sarathi portal registration and RTO test slot lock.', charge_paise: 15000, charge_text: '₹150', estimated_time_text: 'Same day', is_active: true },
    ],
  },
  {
    id: 'pt-3',
    slug: 'balaji-e-seva-tirupati',
    type: 'application_assistance',
    business_name: 'Balaji E-Seva & Citizen Assistance Desk',
    description:
      'Dedicated student assistance center for entrance examination forms (NEET, JEE, EAMCET, CUET) and social welfare scholarships.',
    logo_url: null,
    owner_name: 'P. Govinda Raju',
    phone: '+91 94401 23890',
    whatsapp: '+91 94401 23890',
    email: 'balaji.tirupati.eseva@gmail.com',
    address: 'Door 10-3-42, Opp SV University Main Gate',
    city: 'Tirupati',
    district: 'Tirupati',
    state_code: 'AP',
    pincode: '517502',
    latitude: 13.628756,
    longitude: 79.419179,
    service_areas: ['SV University Campus', 'Alipiri', 'Chandragiri'],
    working_hours: {
      mon: ['08:30', '20:30'],
      tue: ['08:30', '20:30'],
      wed: ['08:30', '20:30'],
      thu: ['08:30', '20:30'],
      fri: ['08:30', '20:30'],
      sat: ['08:30', '20:30'],
      sun: ['09:00', '14:00'],
    },
    is_available: true,
    verification_status: 'verified',
    is_listed: true,
    rating_avg: 5.0,
    rating_count: 312,
    services: [
      { id: 'ps-8', partner_id: 'pt-3', service_id: null, name: 'AP EAMCET / NEET UG Form Registration & Photo Resize', description: 'Accurate category certificate upload and fee payment.', charge_paise: 15000, charge_text: '₹150', estimated_time_text: '1 hour', is_active: true },
      { id: 'ps-9', partner_id: 'pt-3', service_id: null, name: 'AP Jagananna Vidya Deevena Fee Reimbursement Verification', description: 'Village secretarial authentication document collection.', charge_paise: 8000, charge_text: '₹80', estimated_time_text: '1 day', is_active: true },
      { id: 'ps-10', partner_id: 'pt-3', service_id: 'srv-ration-card', name: 'Ration Card Member Addition Online', description: 'Family member Aadhaar biometric seeding form.', charge_paise: 10000, charge_text: '₹100', estimated_time_text: '2-3 days', is_active: true },
    ],
  },
];

export function getMockPartnerSummaries(params: { q?: string; type?: string } = {}): PartnerSummary[] {
  let list = [...MOCK_PARTNER_SUMMARIES];
  if (params.type) {
    list = list.filter((p) => p.type === params.type);
  }
  if (params.q) {
    const qLower = params.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.business_name.toLowerCase().includes(qLower) ||
        (p.city && p.city.toLowerCase().includes(qLower)) ||
        (p.district && p.district.toLowerCase().includes(qLower)) ||
        (p.pincode && p.pincode.includes(qLower)) ||
        p.service_areas.some((area) => area.toLowerCase().includes(qLower)),
    );
  }
  return list;
}

/* ------------------------------------------------------------------ HOME SUMMARY */

export const MOCK_HOME_SUMMARY: HomeSummary = {
  generated_at: '2026-10-24T12:00:00Z',
  stats: [
    { key: 'open_jobs', label: 'Central & State Govt Jobs', value: 2450, hint: '+140 this week' },
    { key: 'exams_this_month', label: 'Entrance & Competitive Exams', value: 120, hint: 'Active notices' },
    { key: 'scholarships_open', label: 'Scholarships & Grants', value: 480, hint: 'All categories' },
    { key: 'closing_this_week', label: 'Closing This Week', value: 36, hint: 'Deadlines approaching' },
  ],
  closing_soon: MOCK_OPPORTUNITIES.slice(0, 6),
  popular: MOCK_OPPORTUNITIES.slice(0, 4),
  updates: [
    {
      id: 'up-1',
      kind: 'date_change',
      title: 'SSC CGL 2026 Tier-1 tentative dates released',
      organization: 'Staff Selection Commission (SSC)',
      date: '2026-10-24',
      opportunity_slug: 'ssc-cgl-2026-recruitment',
    },
    {
      id: 'up-2',
      kind: 'correction_window',
      title: 'APPSC Group-2 Application Form Correction Window Open',
      organization: 'Andhra Pradesh Public Service Commission (APPSC)',
      date: '2026-10-23',
      opportunity_slug: 'appsc-group-2-services-2026',
    },
    {
      id: 'up-3',
      kind: 'admit_card',
      title: 'NEET UG 2027 City Intimation Slip & Admit Card Schedule',
      organization: 'National Testing Agency (NTA)',
      date: '2026-10-22',
      opportunity_slug: 'neet-ug-2027-entrance-exam',
    },
  ],
  popular_searches: ['SSC CGL', 'UPSC Prelims', 'NEET UG', 'APPSC Group 2', 'NSP Scholarship', 'IIT Madras BS'],
  personal: null,
  sample: false,
};

/* ------------------------------------------------------------------ UNIVERSAL SEARCH ------------------------------------------------------------------ */

export function getMockSearchResults(query: string, type?: SearchResultType): SearchResponse {
  const qLower = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search opportunities
  for (const opp of MOCK_OPPORTUNITIES) {
    if (type && opp.type !== type) continue;
    if (
      !query ||
      opp.title.toLowerCase().includes(qLower) ||
      opp.organization.toLowerCase().includes(qLower) ||
      opp.location.toLowerCase().includes(qLower) ||
      (opp.qualification && opp.qualification.toLowerCase().includes(qLower))
    ) {
      let path = '/jobs';
      if (opp.type === 'exam') path = '/exams';
      else if (opp.type === 'scholarship') path = '/scholarships';
      else if (opp.type === 'admission') path = '/admissions';

      results.push({
        type: opp.type,
        title: opp.title,
        subtitle: opp.organization,
        url: `${path}/${opp.slug}`,
        location: opp.location,
        last_date: opp.last_date,
        days_left: opp.days_left,
      });
    }
  }

  // Search services
  if (!type || type === 'service') {
    for (const srv of MOCK_GOV_SERVICES) {
      if (
        !query ||
        srv.name.toLowerCase().includes(qLower) ||
        (srv.authority_name && srv.authority_name.toLowerCase().includes(qLower)) ||
        (srv.description && srv.description.toLowerCase().includes(qLower)) ||
        (srv.category && srv.category.toLowerCase().includes(qLower))
      ) {
        results.push({
          type: 'service',
          title: srv.name,
          subtitle: srv.authority_name || srv.organization,
          url: `/services/${srv.slug}`,
          location: srv.location,
          last_date: null,
          days_left: null,
        });
      }
    }
  }

  return {
    query,
    total: results.length,
    items: results,
  };
}



