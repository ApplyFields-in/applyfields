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

    // Hero & Home
    hero_tag: 'Explore. Apply. Grow.',
    hero_title: 'ApplyFields',
    hero_subtitle_1: 'Your next chapter',
    hero_subtitle_2: 'starts here.',
    hero_desc: 'Jobs, exams, scholarships and career paths. A world of possibilities. One place to begin.',
    hero_search_placeholder: 'What are you looking for?',
    hero_search_btn: 'Search',
    hero_trending: 'Trending',
    hero_horizon_title: 'On the horizon',
    hero_days_left: 'days left',
    hero_no_deadlines: 'No upcoming deadlines are published right now.',
    hero_all_deadlines: 'All upcoming deadlines',

    // Ambition / Stats
    ambition_title: 'A possibility for every ambition.',
    ambition_find_dir: 'Find your direction →',
    stat_jobs: 'Government Jobs',
    stat_jobs_hint: 'Explore opportunities',
    stat_exams: 'Exams',
    stat_exams_hint: 'Explore exams',
    stat_scholarships: 'Scholarships',
    stat_scholarships_hint: 'Explore scholarships',
    stat_admissions: 'Admissions',
    stat_admissions_hint: 'Courses and colleges',
    stat_services: 'Public Services',
    stat_services_hint: 'Forms and certificates',
    stat_careers: 'Careers',
    stat_careers_hint: 'Explore career paths',

    // Closing Soon & Updates
    closing_soon_badge: 'Closing soon',
    closing_soon_title: 'Worth your attention',
    closing_soon_all: 'All opportunities',
    closing_soon_none: 'No closing dates are available right now.',
    closing_soon_view: 'View details',
    closing_rolling: 'Rolling deadline',

    updates_source: 'From official sources',
    updates_title: 'Latest updates',
    updates_all: 'All updates',
    updates_none: 'No updates are available right now.',

    // Career Promo
    career_promo_tag: 'Look beyond the next step',
    career_promo_title: 'A career that feels like you.',
    career_promo_desc: 'Explore the roles, skills and education that shape your future.',
    career_promo_btn: 'Find your path',
    career_link_explore: 'Explore careers',
    career_link_courses: 'Courses',
    career_link_colleges: 'Colleges & universities',
    career_link_roadmaps: 'Roadmaps',
    career_link_skills: 'Skills',
    career_link_guidance: 'Career guidance',

    // Trust Note
    trust_official_links: 'Official links only',
    trust_no_invented: 'Never invents fees or eligibility',
    trust_verified_date: 'Shows when info was last verified',
    trust_private_docs: 'Your documents stay private',

    // Assistance Promo
    assistance_need_help: 'Need help applying?',
    assistance_desc: 'Verified MeeSeva, CSC and browsing centres near you — see the charges before you pay.',
    assistance_find_btn: 'Find a centre',

    // Footer
    footer_tagline: 'Discover, understand and prepare for public opportunities — in one place.',
    footer_apply: 'Apply',
    footer_gov_jobs: 'Government Jobs',
    footer_exams: 'Exams',
    footer_scholarships: 'Scholarships',
    footer_admissions: 'Admissions',
    footer_services: 'Services',
    footer_career: 'Career',
    footer_explore_careers: 'Explore careers',
    footer_courses: 'Courses',
    footer_colleges: 'Colleges & universities',
    footer_skills: 'Skills',
    footer_applyfields: 'ApplyFields',
    footer_about: 'About',
    footer_how_verify: 'How we verify',
    footer_contact: 'Contact',
    footer_privacy: 'Privacy',
    footer_copyright: '© 2026 ApplyFields. An independent information platform — not affiliated with any government department.',
    footer_prototype_screens: 'Prototype Screens',
    footer_demo_public: 'Citizen - public',
    footer_demo_signed_in: 'Citizen - signed in',
    footer_internal_login: 'Internal - login',
    footer_internal_workspace: 'Internal - workspace',
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

    // Hero & Home
    hero_tag: 'అన్వేషించండి. దరఖాస్తు చేయండి. ఎదగండి.',
    hero_title: 'ApplyFields',
    hero_subtitle_1: 'మీ భవిష్యత్ ప్రయాణం',
    hero_subtitle_2: 'ఇక్కడే ప్రారంభం.',
    hero_desc: 'ఉద్యోగాలు, పరీక్షలు, స్కాలర్‌షిప్‌లు మరియు కెరీర్ మార్గాలు. అవకాశాల ప్రపంచం, ఒకే చోట.',
    hero_search_placeholder: 'మీరు దేని కోసం వెతుకుతున్నారు?',
    hero_search_btn: 'శోధించండి',
    hero_trending: 'ట్రెండింగ్',
    hero_horizon_title: 'త్వరలో ముగిసేవి',
    hero_days_left: 'రోజులు మిగిలివున్నాయి',
    hero_no_deadlines: 'ప్రస్తుతం గడువు ముగిసే నోటిఫికేషన్లు లేవు.',
    hero_all_deadlines: 'అన్ని రాబోయే గడువులు',

    // Ambition / Stats
    ambition_title: 'ప్రతి లక్ష్యానికి తగిన అవకాశం.',
    ambition_find_dir: 'మీ మార్గాన్ని ఎంచుకోండి →',
    stat_jobs: 'ప్రభుత్వ ఉద్యోగాలు',
    stat_jobs_hint: 'అవకాశాలను చూడండి',
    stat_exams: 'పరీక్షలు',
    stat_exams_hint: 'పరీక్షలను చూడండి',
    stat_scholarships: 'స్కాలర్‌షిప్‌లు',
    stat_scholarships_hint: 'స్కాలర్‌షిప్‌లను చూడండి',
    stat_admissions: 'అడ్మిషన్లు',
    stat_admissions_hint: 'కోర్సులు మరియు కళాశాలలు',
    stat_services: 'ప్రజా సేవలు',
    stat_services_hint: 'దరఖాస్తులు మరియు ధృవపత్రాలు',
    stat_careers: 'కెరీర్‌లు',
    stat_careers_hint: 'కెరీర్ మార్గాలను చూడండి',

    // Closing Soon & Updates
    closing_soon_badge: 'త్వరలో ముగియనుంది',
    closing_soon_title: 'శ్రద్ధ పెట్టాల్సిన అవకాశాలు',
    closing_soon_all: 'అన్ని అవకాశాలు',
    closing_soon_none: 'ప్రస్తుతం చివరి తేదీ వివరాలు లేవు.',
    closing_soon_view: 'వివరాలు చూడండి',
    closing_rolling: 'నిరంతర దరఖాస్తు',

    updates_source: 'అధికారిక వనరుల నుండి',
    updates_title: 'తాజా అప్‌డేట్‌లు',
    updates_all: 'అన్ని అప్‌డేట్‌లు',
    updates_none: 'ప్రస్తుతం ఎటువంటి అప్‌డేట్‌లు అందుబాటులో లేవు.',

    // Career Promo
    career_promo_tag: 'ముందస్తు ఆలోచనతో అడుగు వేయండి',
    career_promo_title: 'మీ అభిరుచికి తగిన కెరీర్.',
    career_promo_desc: 'మీ భవిష్యత్తును తీర్చిదిద్దే ఉద్యోగాలు, నైపుణ్యాలు మరియు విద్యను అన్వేషించండి.',
    career_promo_btn: 'మీ మార్గాన్ని కనుగొనండి',
    career_link_explore: 'కెరీర్‌లను అన్వేషించండి',
    career_link_courses: 'కోర్సులు',
    career_link_colleges: 'కళాశాలలు & విశ్వవిద్యాలయాలు',
    career_link_roadmaps: 'రోడ్‌మ్యాప్‌లు',
    career_link_skills: 'నైపుణ్యాలు',
    career_link_guidance: 'కెరీర్ మార్గదర్శకత్వం',

    // Trust Note
    trust_official_links: 'అధికారిక లింకులు మాత్రమే',
    trust_no_invented: 'రుసుములు లేదా అర్హతలను తప్పుగా ఊహించదు',
    trust_verified_date: 'చివరిగా ఎప్పుడు ధృవీకరించబడిందో చూపుతుంది',
    trust_private_docs: 'మీ పత్రాలు సురక్షితంగా ఉంటాయి',

    // Assistance Promo
    assistance_need_help: 'దరఖాస్తు చేయడానికి సహాయం కావాలా?',
    assistance_desc: 'మీ సమీపంలోని ధృవీకృత మీసేవ, CSC కేంద్రాలు — చెల్లించే ముందే ఛార్జీలను చూడండి.',
    assistance_find_btn: 'కేంద్రాన్ని కనుగొనండి',

    // Footer
    footer_tagline: 'ప్రజా అవకాశాలను ఒకే వేదికపై తెలుసుకోండి, అర్థం చేసుకోండి మరియు సిద్ధం కండి.',
    footer_apply: 'దరఖాస్తు',
    footer_gov_jobs: 'ప్రభుత్వ ఉద్యోగాలు',
    footer_exams: 'పరీక్షలు',
    footer_scholarships: 'స్కాలర్‌షిప్‌లు',
    footer_admissions: 'అడ్మిషన్లు',
    footer_services: 'ప్రజా సేవలు',
    footer_career: 'కెరీర్',
    footer_explore_careers: 'కెరీర్‌లను అన్వేషించండి',
    footer_courses: 'కోర్సులు',
    footer_colleges: 'కళాశాలలు & విశ్వవిద్యాలయాలు',
    footer_skills: 'నైపుణ్యాలు',
    footer_applyfields: 'అప్లైఫీల్డ్స్',
    footer_about: 'మా గురించి',
    footer_how_verify: 'మేము ఎలా ధృవీకరిస్తాము',
    footer_contact: 'సంప్రదించండి',
    footer_privacy: 'గోప్యతా విధానం',
    footer_copyright: '© 2026 ApplyFields. స్వతంత్ర సమాచార వేదిక — ఏ ప్రభుత్వ శాఖతో అనుబంధం లేదు.',
    footer_prototype_screens: 'ప్రోటోటైప్ స్క్రీన్‌లు',
    footer_demo_public: 'పౌరుడు - పబ్లిక్',
    footer_demo_signed_in: 'పౌరుడు - లాగిన్',
    footer_internal_login: 'అంతర్గత - లాగిన్',
    footer_internal_workspace: 'అంతర్గత - కార్యాలయం',
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

    // Hero & Home
    hero_tag: 'खोजें. आवेदन करें. आगे बढ़ें.',
    hero_title: 'ApplyFields',
    hero_subtitle_1: 'आपका अगला अध्याय',
    hero_subtitle_2: 'यहाँ से शुरू होता है।',
    hero_desc: 'नौकरियां, परीक्षाएं, छात्रवृत्तियां और करियर मार्ग। संभावनाओं की दुनिया, एक ही जगह।',
    hero_search_placeholder: 'आप क्या खोज रहे हैं?',
    hero_search_btn: 'खोजें',
    hero_trending: 'ट्रेंडिंग',
    hero_horizon_title: 'आसन्न समयसीमा',
    hero_days_left: 'दिन शेष',
    hero_no_deadlines: 'वर्तमान में कोई अंतिम तिथि प्रकाशित नहीं है।',
    hero_all_deadlines: 'सभी आगामी समयसीमाएं',

    // Ambition / Stats
    ambition_title: 'हर महत्वाकांक्षा के लिए एक अवसर।',
    ambition_find_dir: 'अपनी दिशा चुनें →',
    stat_jobs: 'सरकारी नौकरियां',
    stat_jobs_hint: 'अवसर देखें',
    stat_exams: 'परीक्षाएं',
    stat_exams_hint: 'परीक्षाएं देखें',
    stat_scholarships: 'छात्रवृत्तियां',
    stat_scholarships_hint: 'छात्रवृत्तियां देखें',
    stat_admissions: 'एडमिशन',
    stat_admissions_hint: 'कोर्स और कॉलेज',
    stat_services: 'नागरिक सेवाएं',
    stat_services_hint: 'फॉर्म और प्रमाण पत्र',
    stat_careers: 'करियर',
    stat_careers_hint: 'करियर विकल्प देखें',

    // Closing Soon & Updates
    closing_soon_badge: 'शीघ्र समाप्त',
    closing_soon_title: 'ध्यान देने योग्य अवसर',
    closing_soon_all: 'सभी अवसर',
    closing_soon_none: 'वर्तमान में कोई अंतिम तिथि उपलब्ध नहीं है।',
    closing_soon_view: 'विवरण देखें',
    closing_rolling: 'सक्रिय आवेदन',

    updates_source: 'आधिकारिक स्रोतों से',
    updates_title: 'नवीनतम अपडेट',
    updates_all: 'सभी अपडेट',
    updates_none: 'वर्तमान में कोई अपडेट उपलब्ध नहीं है।',

    // Career Promo
    career_promo_tag: 'अगले कदम से आगे सोचें',
    career_promo_title: 'एक करियर जो आपके अनुकूल हो।',
    career_promo_desc: 'अपनी भविष्य को आकार देने वाली भूमिकाओं, कौशलों और शिक्षा का अन्वेषण करें।',
    career_promo_btn: 'अपना मार्ग खोजें',
    career_link_explore: 'करियर खोजें',
    career_link_courses: 'कोर्सेस',
    career_link_colleges: 'कॉलेज और विश्वविद्यालय',
    career_link_roadmaps: 'रोडमैप',
    career_link_skills: 'कौशल (Skills)',
    career_link_guidance: 'करियर मार्गदर्शन',

    // Trust Note
    trust_official_links: 'केवल आधिकारिक लिंक',
    trust_no_invented: 'शुल्क या पात्रता का कभी गलत अनुमान नहीं',
    trust_verified_date: 'दिखाता है कि जानकारी कब सत्यापित हुई',
    trust_private_docs: 'आपके दस्तावेज़ निजी रहते हैं',

    // Assistance Promo
    assistance_need_help: 'आवेदन करने में सहायता चाहिए?',
    assistance_desc: 'आपके निकट सत्यापित MeeSeva, CSC और ब्राउजिंग केंद्र — भुगतान से पहले शुल्क देखें।' ,
    assistance_find_btn: 'केंद्र खोजें',

    // Footer
    footer_tagline: 'सार्वजनिक अवसरों को खोजें, समझें और तैयार करें — एक ही स्थान पर।',
    footer_apply: 'आवेदन करें',
    footer_gov_jobs: 'सरकारी नौकरियां',
    footer_exams: 'परीक्षाएं',
    footer_scholarships: 'छात्रवृत्तियां',
    footer_admissions: 'प्रवेश (एडमिशन)',
    footer_services: 'नागरिक सेवाएं',
    footer_career: 'करियर',
    footer_explore_careers: 'करियर खोजें',
    footer_courses: 'कोर्सेस',
    footer_colleges: 'कॉलेज और विश्वविद्यालय',
    footer_skills: 'कौशल (Skills)',
    footer_applyfields: 'अप्लाईफील्ड्स',
    footer_about: 'हमारे बारे में',
    footer_how_verify: 'हम सत्यापन कैसे करते हैं',
    footer_contact: 'संपर्क करें',
    footer_privacy: 'गोपनीयता नीति',
    footer_copyright: '© 2026 ApplyFields. एक स्वतंत्र सूचना मंच — किसी भी सरकारी विभाग से संबद्ध नहीं है।',
    footer_prototype_screens: 'प्रोटोटाइप स्क्रीन',
    footer_demo_public: 'नागरिक - सार्वजनिक',
    footer_demo_signed_in: 'नागरिक - साइन इन',
    footer_internal_login: 'आंतरिक - लॉगिन',
    footer_internal_workspace: 'आंतरिक - कार्यस्थान',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
