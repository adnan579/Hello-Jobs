import { Language, JobListing } from '../types';

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Worker Feed
    searchWorkerPlaceholder:
      'Search by job title, company name, trade, or industrial hub…',
    stopAudio: 'Stop Audio',
    voiceGuideBtn: 'Voice Guide',
    listenAudio: 'Listen to Job Audio',
    noCertBadge: 'No Certificate Required — Helper/Packing',
    hostel: 'Free Hostel',
    mess: 'Subsidized Mess',
    bus: 'Factory Bus',
    directCall: 'Call HR',
    applyWhatsapp: 'Apply via WhatsApp',
    reportCut: 'Report Cut',
    tabAllJobs: 'All Jobs',

    // Employer Feed
    postRequirement: 'Post a Job',
    candidateDirectory: 'Verified Candidate Pool',
    searchCandidatePlaceholder:
      'Search by name, trade, city, or previous company…',
    filterTrade: 'Filter by Trade',
    filterAllTrades: 'All Trades',
    machinesHandled: 'Machines Handled',

    // Shared Filters
    filterHub: 'Industrial Hub',
    filterAllHubs: 'All Hubs',
    filterCity: 'City',
    filterAllCities: 'All Cities',
    filterExperience: 'Experience',
    filterAllExperience: 'Any Experience',

    // Navigation
    navLanding: 'Home',
    navWorkerFeed: 'Jobs Feed',
    navEmployerFeed: 'Candidates',
    navWorkerProfile: 'My Profile',
    navEmployerProfile: 'Dashboard',
    navSubtitle: 'Direct Factory Jobs Portal',

    // Empty States
    emptyStateNoJobs: 'No jobs found',
    emptyStateNoJobsDesc:
      'Try adjusting your filters, search terms, or browse all jobs.',
    emptyStateNoCandidates: 'No candidates found',
    emptyStateNoCandidatesDesc:
      'Try adjusting your filters or search terms to find matching candidates.',
    emptyStateNoDrives: 'No upcoming drives',
    emptyStateNoDrivesDesc:
      'Check back later for new ITI campus drives and walk-in recruitment events.',
    emptyStateNoNotifications: 'No notifications yet',
    emptyStateNoNotificationsDesc:
      'Apply to jobs or register for drives to get updates here.',

    // Actions
    resetFilters: 'Reset Filters',
    backToAllJobs: 'Back to All Jobs',
    callNow: 'Call Now',
    close: 'Close',
    clearAll: 'Clear All',
    quietHours: 'Quiet Hours Active: Non-urgent alerts between 9:00 PM – 8:00 AM IST are delivered at 8:00 AM.',
    quietHoursDesc:
      'Non-urgent alerts between 9:00 PM – 8:00 AM IST are delivered at 8:00 AM.',
    notificationsTitle: 'Application Updates & Hiring Notifications',
    notificationsSubtitle: 'Activity & Alerts',
  },
  hi: {
    searchWorkerPlaceholder:
      'नौकरी का शीर्षक, कंपनी का नाम, ट्रेड या औद्योगिक केंद्र से खोजें…',
    stopAudio: 'ऑडियो बंद करें',
    voiceGuideBtn: 'आवाज़ गाइड',
    listenAudio: 'नौकरी ऑडियो सुनें',
    noCertBadge: 'प्रमाण पत्र की आवश्यकता नहीं — हेल्पर/पैकिंग',
    hostel: 'मुफ्त हॉस्टल',
    mess: 'सब्सिडाइज्ड मेस',
    bus: 'फैक्ट्री बस',
    directCall: 'एचआर को कॉल करें',
    applyWhatsapp: 'व्हाट्सएप से आवेदन करें',
    reportCut: 'कट की रिपोर्ट करें',
    tabAllJobs: 'सभी नौकरियाँ',
    postRequirement: 'नौकरी पोस्ट करें',
    candidateDirectory: 'सत्यापित उम्मीदवार पूल',
    searchCandidatePlaceholder:
      'नाम, ट्रेड, शहर या पिछली कंपनी से खोजें…',
    filterTrade: 'ट्रेड के अनुसार फ़िल्टर करें',
    filterAllTrades: 'सभी ट्रेड',
    machinesHandled: 'संचालित मशीनें',
    filterHub: 'औद्योगिक केंद्र',
    filterAllHubs: 'सभी केंद्र',
    filterCity: 'शहर',
    filterAllCities: 'सभी शहर',
    filterExperience: 'अनुभव',
    filterAllExperience: 'कोई भी अनुभव',
    navLanding: 'होम',
    navWorkerFeed: 'नौकरी फ़ीड',
    navEmployerFeed: 'उम्मीदवार',
    navWorkerProfile: 'मेरी प्रोफ़ाइल',
    navEmployerProfile: 'डैशबोर्ड',
    navSubtitle: 'डायरेक्ट फैक्ट्री जॉब्स पोर्टल',
    emptyStateNoJobs: 'कोई नौकरी नहीं मिली',
    emptyStateNoJobsDesc:
      'अपने फ़िल्टर, खोज शब्द समायोजित करें या सभी नौकरियाँ ब्राउज़ करें।',
    emptyStateNoCandidates: 'कोई उम्मीदवार नहीं मिला',
    emptyStateNoCandidatesDesc:
      'मिलान उम्मीदवार खोजने के लिए अपने फ़िल्टर या खोज शब्द समायोजित करें।',
    emptyStateNoDrives: 'कोई आगामी ड्राइव नहीं',
    emptyStateNoDrivesDesc:
      'नए ITI कैंपस ड्राइव और वॉक-इन भर्ती कार्यक्रमों के लिए बाद में जाँचें।',
    emptyStateNoNotifications: 'अभी तक कोई सूचना नहीं',
    emptyStateNoNotificationsDesc:
      'अपडेट प्राप्त करने के लिए नौकरियों के लिए आवेदन करें या ड्राइव के लिए पंजीकरण करें।',
    resetFilters: 'फ़िल्टर रीसेट करें',
    backToAllJobs: 'सभी नौकरियों पर वापस जाएँ',
    callNow: 'अभी कॉल करें',
    close: 'बंद करें',
    clearAll: 'सभी साफ़ करें',
    quietHours:
      'शांत घंटे सक्रिय: रात 9:00 बजे – सुबह 8:00 बजे IST के बीच गैर-जरूरी अलर्ट सुबह 8:00 बजे दिए जाते हैं।',
    quietHoursDesc:
      'रात 9:00 बजे – सुबह 8:00 बजे IST के बीच गैर-जरूरी अलर्ट सुबह 8:00 बजे दिए जाते हैं।',
    notificationsTitle: 'आवेदन अपडेट और भर्ती सूचनाएँ',
    notificationsSubtitle: 'गतिविधि और अलर्ट',
  },
  mr: {
    searchWorkerPlaceholder:
      'नोकरीचे शीर्षक, कंपनीचे नाव, ट्रेड किंवा औद्योगिक केंद्राने शोधा…',
    stopAudio: 'ऑडिओ बंद करा',
    voiceGuideBtn: 'आवाज मार्गदर्शक',
    listenAudio: 'नोकरी ऑडिओ ऐका',
    noCertBadge: 'प्रमाणपत्राची आवश्यकता नाही — हेल्पर/पॅकिंग',
    hostel: 'मोफत वसतिगृह',
    mess: 'अनुदानित मेस',
    bus: 'फॅक्टरी बस',
    directCall: 'एचआरला कॉल करा',
    applyWhatsapp: 'व्हॉट्सअ‍ॅपद्वारे अर्ज करा',
    reportCut: 'कटची तक्रार करा',
    tabAllJobs: 'सर्व नोकऱ्या',
    postRequirement: 'नोकरी पोस्ट करा',
    candidateDirectory: 'सत्यापित उमेदवार पूल',
    searchCandidatePlaceholder:
      'नाव, ट्रेड, शहर किंवा मागील कंपनीने शोधा…',
    filterTrade: 'ट्रेडनुसार फिल्टर करा',
    filterAllTrades: 'सर्व ट्रेड',
    machinesHandled: 'हाताळलेली यंत्रे',
    filterHub: 'औद्योगिक केंद्र',
    filterAllHubs: 'सर्व केंद्रे',
    filterCity: 'शहर',
    filterAllCities: 'सर्व शहरे',
    filterExperience: 'अनुभव',
    filterAllExperience: 'कोणताही अनुभव',
    navLanding: 'मुख्यपृष्ठ',
    navWorkerFeed: 'नोकरी फीड',
    navEmployerFeed: 'उमेदवार',
    navWorkerProfile: 'माझे प्रोफाइल',
    navEmployerProfile: 'डॅशबोर्ड',
    navSubtitle: 'थेट फॅक्टरी नोकऱ्या पोर्टल',
    emptyStateNoJobs: 'कोणतीही नोकरी सापडली नाही',
    emptyStateNoJobsDesc:
      'तुमचे फिल्टर, शोध शब्द समायोजित करा किंवा सर्व नोकऱ्या ब्राउझ करा.',
    emptyStateNoCandidates: 'कोणतेही उमेदवार सापडले नाहीत',
    emptyStateNoCandidatesDesc:
      'जुळणारे उमेदवार शोधण्यासाठी तुमचे फिल्टर किंवा शोध शब्द समायोजित करा.',
    emptyStateNoDrives: 'कोणतेही आगामी ड्राइव्ह नाहीत',
    emptyStateNoDrivesDesc:
      'नवीन ITI कॅम्पस ड्राइव्ह आणि वॉक-इन भरती कार्यक्रमांसाठी नंतर तपासा.',
    emptyStateNoNotifications: 'अद्याप कोणतीही सूचना नाही',
    emptyStateNoNotificationsDesc:
      'अद्यतने मिळवण्यासाठी नोकऱ्यांसाठी अर्ज करा किंवा ड्राइव्हसाठी नोंदणी करा.',
    resetFilters: 'फिल्टर रीसेट करा',
    backToAllJobs: 'सर्व नोकऱ्यांवर परत जा',
    callNow: 'आता कॉल करा',
    close: 'बंद करा',
    clearAll: 'सर्व साफ करा',
    quietHours:
      'शांत तास सक्रिय: रात्री 9:00 – सकाळी 8:00 IST दरम्यान गैर-तातडीचे अलर्ट सकाळी 8:00 वाजता पाठवले जातात.',
    quietHoursDesc:
      'रात्री 9:00 – सकाळी 8:00 IST दरम्यान गैर-तातडीचे अलर्ट सकाळी 8:00 वाजता पाठवले जातात.',
    notificationsTitle: 'अर्ज अद्यतने आणि भरती सूचना',
    notificationsSubtitle: 'क्रियाकलाप आणि अलर्ट',
  },
  ta: {
    searchWorkerPlaceholder:
      'வேலை தலைப்பு, நிறுவனப் பெயர், வணிகம் அல்லது தொழிற்துறை மையம் மூலம் தேடு…',
    stopAudio: 'ஒலியை நிறுத்து',
    voiceGuideBtn: 'குரல் வழிகாட்டி',
    listenAudio: 'வேலை ஒலியைக் கேள்',
    noCertBadge: 'சான்றிதழ் தேவையில்லை — உதவியாளர்/பேக்கிங்',
    hostel: 'இலவச விடுதி',
    mess: 'சலுகை மெஸ்',
    bus: 'தொழிற்சாலை பேருந்து',
    directCall: 'மனிதவளத்தை அழை',
    applyWhatsapp: 'வாட்ஸ்அப் மூலம் விண்ணப்பி',
    reportCut: 'கட்டைப் புகாரளி',
    tabAllJobs: 'அனைத்து வேலைகள்',
    postRequirement: 'வேலையை பதிவிடு',
    candidateDirectory: 'சரிபார்க்கப்பட்ட வேட்பாளர் குளம்',
    searchCandidatePlaceholder:
      'பெயர், வணிகம், நகரம் அல்லது முந்தைய நிறுவனம் மூலம் தேடு…',
    filterTrade: 'வணிகம் மூலம் வடிகட்டு',
    filterAllTrades: 'அனைத்து வணிகங்கள்',
    machinesHandled: 'கையாளப்பட்ட இயந்திரங்கள்',
    filterHub: 'தொழிற்துறை மையம்',
    filterAllHubs: 'அனைத்து மையங்கள்',
    filterCity: 'நகரம்',
    filterAllCities: 'அனைத்து நகரங்கள்',
    filterExperience: 'அனுபவம்',
    filterAllExperience: 'எந்த அனுபவமும்',
    navLanding: 'முகப்பு',
    navWorkerFeed: 'வேலை ஃபீட்',
    navEmployerFeed: 'வேட்பாளர்கள்',
    navWorkerProfile: 'என் சுயவிவரம்',
    navEmployerProfile: 'டாஷ்போர்டு',
    navSubtitle: 'நேரடி தொழிற்சாலை வேலைகள் போர்டல்',
    emptyStateNoJobs: 'வேலைகள் எதுவும் கிடைக்கவில்லை',
    emptyStateNoJobsDesc:
      'உங்கள் வடிப்பான்களை, தேடல் சொற்களை சரிசெய்க அல்லது அனைத்து வேலைகளையும் உலாவுக.',
    emptyStateNoCandidates: 'வேட்பாளர்கள் எவரும் கிடைக்கவில்லை',
    emptyStateNoCandidatesDesc:
      'பொருத்தமான வேட்பாளர்களைக் கண்டறிய உங்கள் வடிப்பான்கள் அல்லது தேடல் சொற்களை சரிசெய்க.',
    emptyStateNoDrives: 'வரவிருக்கும் டிரைவ்கள் இல்லை',
    emptyStateNoDrivesDesc:
      'புதிய ITI வளாக டிரைவ்கள் மற்றும் நேரடி பணியமர்த்தல் நிகழ்வுகளுக்கு பிறகு சரிபார்க்கவும்.',
    emptyStateNoNotifications: 'இதுவரை அறிவிப்புகள் இல்லை',
    emptyStateNoNotificationsDesc:
      'புதுப்பிப்புகளைப் பெற வேலைகளுக்கு விண்ணப்பிக்கவும் அல்லது டிரைவ்களுக்கு பதிவுசெய்க.',
    resetFilters: 'வடிப்பான்களை மீட்டமை',
    backToAllJobs: 'அனைத்து வேலைகளுக்கும் திரும்பு',
    callNow: 'இப்போது அழை',
    close: 'மூடு',
    clearAll: 'அனைத்தையும் அழி',
    quietHours:
      'அமைதி நேரம் செயலில்: இரவு 9:00 – காலை 8:00 IST இடையே அவசரமற்ற எச்சரிக்கைகள் காலை 8:00 மணிக்கு வழங்கப்படுகின்றன.',
    quietHoursDesc:
      'இரவு 9:00 – காலை 8:00 IST இடையே அவசரமற்ற எச்சரிக்கைகள் காலை 8:00 மணிக்கு வழங்கப்படுகின்றன.',
    notificationsTitle: 'விண்ணப்ப புதுப்பிப்புகள் மற்றும் பணியமர்த்தல் அறிவிப்புகள்',
    notificationsSubtitle: 'செயல்பாடுகள் மற்றும் எச்சரிக்கைகள்',
  },
};

export type TranslationKeys = keyof (typeof TRANSLATIONS)['en'];

export function getAudioNarrationScript(job: JobListing, lang: Language): string {
  const takeHomeFormatted = job.takeHomeSalary.toLocaleString('en-IN');
  const otFormatted = job.overtimeHourlyRate.toLocaleString('en-IN');
  const noCertNoteHi = job.noCertificateRequired
    ? 'इस काम के लिए किसी आईटीआई या सर्टिफिकेट की ज़रूरत नहीं है, सीधी भर्ती है।'
    : '';
  const noCertNoteEn = job.noCertificateRequired
    ? 'No ITI certificate or formal document is required for this job. Direct joining.'
    : '';

  switch (lang) {
    case 'hi':
      return `नमस्ते! ${job.companyName} में ${job.industrialHub} के लिए ${job.trade} की भर्ती है। ${noCertNoteHi} हाथ में मिलने वाली सैलरी ₹${takeHomeFormatted} महीना है। ओवरटाइम ₹${otFormatted} प्रति घंटा। ${job.facilities.hasHostel ? 'फैक्ट्री में रहने के लिए हॉस्टल सुविधा उपलब्ध है।' : ''} ${job.facilities.hasSubsidizedMess ? 'सस्ती कैंटीन सुविधा उपलब्ध है।' : ''} अप्लाई करने के लिए पीले बटन को दबाएं या सीधे HR को कॉल करें। कोई ठेकेदार नहीं, पूरा वेतन आपका।`;
    case 'mr':
      return `नमस्कार! ${job.companyName} येथे ${job.industrialHub} मधील कारखान्यासाठी ${job.trade} पदाची भरती सुरू आहे. हातात मिळणारा पगार महिना ₹${takeHomeFormatted} आहे. ओव्हरटाईम दर ₹${otFormatted} प्रति तास आहे. ${job.noCertificateRequired ? 'या कामासाठी कोणत्याही सर्टिफिकेटची गरज नाही.' : ''} ${job.facilities.hasHostel ? 'कामगारांसाठी हॉस्टेल सुविधा उपलब्ध आहे.' : ''} थेट कंपनी HR सोबत संपर्क साधण्यासाठी खालील बटण दाबा.`;
    case 'ta':
      return `வணக்கம்! ${job.companyName} நிறுவனத்தில் ${job.industrialHub} தொழிற்சாலைக்கு ${job.trade} பணிக்கான ஆட்கள் தேவை. கைக்கு வரும் மாத சம்பளம் ₹${takeHomeFormatted}. ஓவர்டைம் ஊதியம் மணிக்கு ₹${otFormatted}. ${job.noCertificateRequired ? 'இந்த வேலைக்கு எந்த சான்றிதழும் தேவையில்லை.' : ''} இடைத்தரகர் இன்றி நேரடியாக HR-ஐ அழைக்கவும்.`;
    case 'en':
    default:
      return `Hello! Urgent opening at ${job.companyName} in ${job.industrialHub} for ${job.trade}. ${noCertNoteEn} Guaranteed take-home salary is ₹${takeHomeFormatted} per month, with overtime pay of ₹${otFormatted} per hour. Shift pattern: ${job.shiftPattern}. Full ESI and PF included. Tap 1-Tap Direct Apply or call HR directly with zero agency cuts.`;
  }
}

export function getVoiceGuideScript(
  context: 'worker-feed' | 'onboarding' | 'worker-profile' | 'dpdp-notice',
  lang: Language
): string {
  if (context === 'dpdp-notice') {
    switch (lang) {
      case 'hi':
        return 'डिजिटल पर्सनल डेटा प्रोटेक्शन एक्ट 2023 (DPDP कानून) के तहत सूचना: हेलो जॉब्स आपका नाम, मोबाइल नंबर और काम का विवरण केवल सत्यापित फैक्ट्रियों में सीधी नौकरी और ऑफर लेटर दिलाने के लिए लेता है। आपका डेटा किसी भी ठेकेदार या एजेंट को नहीं बेचा जाता। आप कभी भी अपनी सहमति वापस ले सकते हैं, अपना डेटा मिटा सकते हैं, या डेटा सुरक्षा अधिकारी से शिकायत कर सकते हैं।';
      case 'mr':
        return 'डिजिटल पर्सनल डेटा प्रोटेक्शन कायदा 2023 अंतर्गत सूचना: हॅलो जॉब्स तुमचे नाव, मोबाईल नंबर आणि कामाची माहिती फक्त नोंदणीकृत कंपन्यांमध्ये थेट नोकरी मिळवून देण्यासाठी वापरते. तुमचा डेटा कोणत्याही ठेकेदाराला दिला जात नाही. तुम्ही तुमची संमती कधीही मागे घेऊ शकता किंवा डेटा हटवू शकता.';
      case 'ta':
        return 'டிஜிட்டல் தனிநபர் தரவு பாதுகாப்பு சட்டம் 2023 (DPDP சட்டம்) அறிவிப்பு: ஹலோ ஜாப்ஸ் உங்கள் பெயர் மற்றும் மொபைல் எண்ணை நேரடி தொழிற்சாலை வேலைக்காக மட்டுமே பயன்படுத்துகிறது. எந்த இடைத்தரகருக்கும் உங்கள் தகவல் விற்கப்படாது. நீங்கள் எப்போது வேண்டுமானாலும் உங்கள் ஒப்புதலை திரும்பப் பெறலாம் அல்லது தரவை அழிக்கலாம்.';
      default:
        return 'Digital Personal Data Protection Act 2023 Notice: Shramkart collects your name, mobile number, and work skills strictly to connect you directly with GSTIN-verified factories and issue direct payroll offer letters. Your data is never shared with third-party contractors or thekedars. Under the DPDP Act, you have the right to withdraw consent, erase your data, appoint a nominee, or file a grievance at any time.';
    }
  }

  if (context === 'onboarding') {
    switch (lang) {
      case 'hi':
        return 'नमस्ते! यहाँ प्रोफाइल बनाना बहुत आसान है। किसी सर्टिफिकेट या कागज़ की ज़रूरत नहीं है। पहले अपने काम का प्रकार चुनें जैसे हेल्पर, पैकिंग या मशीन ऑपरेटर। फिर अपनी ताकत चुनें और बस अपना नाम और मोबाइल नंबर लिखें।';
      case 'mr':
        return 'नमस्कार! येथे प्रोफाइल बनवणे खूप सोपे आहे. कोणत्याही सर्टिफिकेटची गरज नाही. फक्त तुमचे काम निवडा, जसे हेल्पर किंवा पॅकिंग, आणि तुमचे नाव व मोबाईल नंबर टाका.';
      case 'ta':
        return 'வணக்கம்! இங்கே சுயவிவரம் உருவாக்குவது மிகவும் எளிது. எந்த சான்றிதழும் தேவையில்லை. உங்கள் வேலை வகையைத் தேர்ந்தெடுத்து, உங்கள் பெயர் மற்றும் மொபைல் எண்ணை மட்டும் உள்ளிடவும்.';
      default:
        return 'Welcome! Creating your profile takes just 3 simple taps. No certificates or documents are required. Step 1: Tap your work type like Helper, Packing, or ITI Operator. Step 2: Tap your work-readiness badges. Step 3: Enter your name and mobile number.';
    }
  }

  if (context === 'worker-profile') {
    switch (lang) {
      case 'hi':
        return 'यह आपकी कामगार प्रोफाइल है। यहाँ आप बिना किसी सर्टिफिकेट के अपने काम के बैज देख सकते हैं, कंपनियों से आए ऑफर लेटर स्वीकार कर सकते हैं, और अपना क्यूआर गेट-पास आईडी कार्ड डाउनलोड कर सकते हैं।';
      case 'mr':
        return 'ही तुमची कामगार प्रोफाइल आहे. येथे तुम्ही तुमचे कामाचे बॅज पाहू शकता, कंपनीचे ऑफर लेटर स्वीकारू शकता आणि तुमचे गेट-पास आयडी कार्ड काढू शकता.';
      case 'ta':
        return 'இது உங்கள் தொழிலாளர் சுயவிவரம். இங்கே உங்கள் பணி பேட்ஜ்கள், ஆஃபர் கடிதங்கள் மற்றும் அடையாள அட்டையைப் பார்க்கலாம்.';
      default:
        return 'This is your Worker Profile and Gate Pass locker. Here you can update your work-readiness badges without needing certificates, accept factory offer letters, and print your QR Digital Worker Gate Pass.';
    }
  }

  // worker-feed
  switch (lang) {
    case 'hi':
      return 'हेलो जॉब्स में आपका स्वागत है। अगर आपके पास कोई सर्टिफिकेट नहीं है, तो हरे रंग का बिना सर्टिफिकेट हेल्पर और पैकिंग बटन दबाएं। हर नौकरी कार्ड पर पीला स्पीकर बटन दबाकर नौकरी की पूरी जानकारी अपनी भाषा में सुनें।';
    case 'mr':
      return 'हॅलो जॉब्स मध्ये आपले स्वागत आहे. तुमच्याकडे सर्टिफिकेट नसल्यास हिरवे हेल्पर आणि पॅकिंग बटण दाबा. प्रत्येक नोकरीची माहिती ऐकण्यासाठी स्पीकर बटण दाबा.';
    case 'ta':
      return 'ஹலோ ஜாப்ஸுக்கு வரவேற்கிறோம். உங்களிடம் சான்றிதழ் இல்லையென்றால், பச்சை நிற ஹெல்பர் மற்றும் பேக்கிங் பட்டனை அழுத்தவும். வேலை விவரங்களைக் கேட்க ஸ்பீக்கர் பட்டனை அழுத்தவும்.';
    default:
      return 'Welcome to the Shramkart Worker Feed. If you do not have an ITI certificate, tap the green No Certificate Helper and Packing button at the top. You can also tap Listen Job Audio on any card to hear the salary and facilities read aloud.';
  }
}
