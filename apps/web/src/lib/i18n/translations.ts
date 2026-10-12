export type SupportedLanguage = 'en' | 'te' | 'hi';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export const translations = {
  en: {
    // Navigation
    nav_home: 'Home',
    nav_explore: 'Explore',
    nav_apply: 'Apply',
    nav_career: 'Career',
    nav_community: 'Community',
    nav_assistance: 'Assistance',
    nav_documents: 'Documents',
    nav_saved: 'Saved',
    nav_notifications: 'Notifications',
    nav_profile: 'My Profile',
    nav_applications: 'My Applications',
    nav_search: 'Search opportunities, careers, exams...',

    // Core Actions
    btn_apply_now: 'Apply Directly',
    btn_save: 'Save',
    btn_saved: 'Saved',
    btn_share: 'Share',
    btn_check_eligibility: 'Check Eligibility',
    btn_ask_question: 'Ask Community',
    btn_inquire_admission: 'Inquire Admission',
    btn_book_assistance: 'Get Center Assistance',
    btn_view_details: 'View Details',
    btn_official_notice: 'Official Notification',
    btn_filter: 'Filter',
    btn_clear: 'Clear Filters',
    btn_submit: 'Submit',
    btn_cancel: 'Cancel',

    // Badges & Labels
    badge_govt_job: 'Government Job',
    badge_exam: 'Entrance Exam',
    badge_scholarship: 'Scholarship',
    badge_admission: 'College Admission',
    badge_central: 'Central Govt',
    badge_state: 'State Govt',
    badge_free: 'Free Application',
    badge_verified_partner: 'Verified Partner',
    badge_closing_soon: 'Closing Soon',
    badge_official: 'Official Route',

    // Sections
    sec_universal_search: 'Universal Search',
    sec_upcoming_deadlines: 'Upcoming Deadlines & Actions',
    sec_verified_assistance: 'Nearby Verified Assistance Centers',
    sec_career_roadmaps: 'Step-by-Step Career Roadmaps',
    sec_community_discussions: 'Candidate Community Discussions',
    sec_qa_title: 'Community Q&A & Inquiries',
    sec_qa_subtitle: 'Ask questions regarding syllabus, exam centers, admit cards, cutoff scores, and counseling.',

    // Official Source Disclaimer
    disclaimer_title: 'Authoritative Source Notice',
    disclaimer_text:
      'Legal Notice: The official department notification remains the authoritative legal source of truth. ApplyFields summaries are provided in English, Telugu, and Hindi for candidate understanding.',
    translated_summary_tab: 'Official Summary',
  },

  te: {
    // Navigation
    nav_home: 'హోమ్',
    nav_explore: 'అన్వేషణ',
    nav_apply: 'దరఖాస్తు',
    nav_career: 'కెరీర్',
    nav_community: 'కమ్యూనిటీ',
    nav_assistance: 'కేంద్ర సహాయం',
    nav_documents: 'పత్రాలు',
    nav_saved: 'సేవ్ చేసినవి',
    nav_notifications: 'నోటిఫికేషన్లు',
    nav_profile: 'నా ప్రొఫైల్',
    nav_applications: 'నా దరఖాస్తులు',
    nav_search: 'ఉద్యోగాలు, పరీక్షలు, కాలేజీలను శోధించండి...',

    // Core Actions
    btn_apply_now: 'నేరుగా దరఖాస్తు చేసుకోండి',
    btn_save: 'సేవ్ చేయండి',
    btn_saved: 'సేవ్ చేయబడింది',
    btn_share: 'షేర్ చేయండి',
    btn_check_eligibility: 'అర్హత తనిఖీ',
    btn_ask_question: 'ప్రశ్న అడగండి',
    btn_inquire_admission: 'ప్రవేశ విచారణ',
    btn_book_assistance: 'కేంద్ర సహాయం పొందండి',
    btn_view_details: 'వివరాలు చూడండి',
    btn_official_notice: 'అధికారిక నోటిఫికేషన్',
    btn_filter: 'ఫిల్టర్',
    btn_clear: 'ఫిల్టర్లు తొలగించు',
    btn_submit: 'సమర్పించండి',
    btn_cancel: 'రద్దు చేయి',

    // Badges & Labels
    badge_govt_job: 'ప్రభుత్వ ఉద్యోగం',
    badge_exam: 'ప్రవేశ పరీక్ష',
    badge_scholarship: 'స్కాలర్‌షిప్',
    badge_admission: 'కళాశాల ప్రవేశం',
    badge_central: 'కేంద్ర ప్రభుత్వం',
    badge_state: 'రాష్ట్ర ప్రభుత్వం',
    badge_free: 'ఉచిత దరఖాస్తు',
    badge_verified_partner: 'ధృవీకరించబడిన కేంద్రం',
    badge_closing_soon: 'త్వరలో ముగియనుంది',
    badge_official: 'అధికారిక మార్గం',

    // Sections
    sec_universal_search: 'సమగ్ర శోధన',
    sec_upcoming_deadlines: 'రాబోయే ముఖ్య గడువులు',
    sec_verified_assistance: 'సమీప ధృవీకృత మీసేవ & CSC కేంద్రాలు',
    sec_career_roadmaps: 'కెరీర్ మార్గదర్శక రోడ్‌మ్యాప్‌లు',
    sec_community_discussions: 'అభ్యర్థుల చర్చలు & సమాచారం',
    sec_qa_title: 'కమ్యూనిటీ ప్రశ్నలు & సమాధానాలు',
    sec_qa_subtitle: 'సిలబస్, పరీక్షా కేంద్రాలు, హాల్ టికెట్లు, కటాఫ్ మార్కులపై ప్రశ్నలు అడగండి.',

    // Official Source Disclaimer
    disclaimer_title: 'అధికారిక ఆధార సమాచారం',
    disclaimer_text:
      'చట్టపరమైన సమాచారం: సంబంధిత ప్రభుత్వ అధికారిక నోటిఫికేషన్ మాత్రమే చట్టబద్ధమైన మూల సమాచారం. అభ్యర్థుల సౌలభ్యం కోసం అప్లైఫీల్డ్స్ తెలుగు, ఇంగ్లీష్, హిందీలలో వివరణలను అందిస్తోంది.',
    translated_summary_tab: 'తెలుగు సారాంశం',
  },

  hi: {
    // Navigation
    nav_home: 'होम',
    nav_explore: 'एक्सप्लोर करें',
    nav_apply: 'आवेदन करें',
    nav_career: 'करियर',
    nav_community: 'कम्युनिटी',
    nav_assistance: 'सहायता केंद्र',
    nav_documents: 'दस्तावेज़',
    nav_saved: 'सेव किए गए',
    nav_notifications: 'सूचनाएं',
    nav_profile: 'मेरी प्रोफाइल',
    nav_applications: 'मेरे आवेदन',
    nav_search: 'नौकरियां, परीक्षाएं, छात्रवृत्तियां खोजें...',

    // Core Actions
    btn_apply_now: 'सीधे आवेदन करें',
    btn_save: 'सेव करें',
    btn_saved: 'सेव किया गया',
    btn_share: 'शेयर करें',
    btn_check_eligibility: 'पात्रता जांचें',
    btn_ask_question: 'सवाल पूछें',
    btn_inquire_admission: 'प्रवेश पूछताछ',
    btn_book_assistance: 'केंद्र सहायता लें',
    btn_view_details: 'विवरण देखें',
    btn_official_notice: 'आधिकारिक अधिसूचना',
    btn_filter: 'फ़िल्टर',
    btn_clear: 'फ़िल्टर हटाएं',
    btn_submit: 'जमा करें',
    btn_cancel: 'रद्द करें',

    // Badges & Labels
    badge_govt_job: 'सरकारी नौकरी',
    badge_exam: 'प्रवेश / प्रतियोगी परीक्षा',
    badge_scholarship: 'छात्रवृत्ति',
    badge_admission: 'कॉलेज प्रवेश',
    badge_central: 'केंद्र सरकार',
    badge_state: 'राज्य सरकार',
    badge_free: 'निःशुल्क आवेदन',
    badge_verified_partner: 'सत्यापित केंद्र',
    badge_closing_soon: 'जल्द समाप्त',
    badge_official: 'आधिकारिक मार्ग',

    // Sections
    sec_universal_search: 'सार्वभौमिक खोज',
    sec_upcoming_deadlines: 'आगामी महत्वपूर्ण तिथियां',
    sec_verified_assistance: 'निकटतम सत्यापित सहायता केंद्र',
    sec_career_roadmaps: 'चरणबद्ध करियर रोडमैप',
    sec_community_discussions: 'उम्मीदवार समुदाय चर्चा',
    sec_qa_title: 'कम्युनिटी प्रश्न और उत्तर',
    sec_qa_subtitle: 'पाठ्यक्रम, परीक्षा केंद्र, एडमिट कार्ड और कटऑफ पर सवाल पूछें।',

    // Official Source Disclaimer
    disclaimer_title: 'आधिकारिक स्रोत सूचना',
    disclaimer_text:
      'कानूनी सूचना: संबंधित आधिकारिक सरकारी अधिसूचना ही एकमात्र कानूनी और प्रामाणिक स्रोत है। उम्मीदवारों की समझ के लिए अप्लाईफील्ड्स हिंदी, तेलुगु और अंग्रेजी में सारांश प्रदान करता है।',
    translated_summary_tab: 'हिंदी सारांश',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
