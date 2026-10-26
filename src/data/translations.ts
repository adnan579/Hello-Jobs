import { Language, JobListing } from '../types';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    brandTagline: 'Direct Hands for Indian Industry',
    subTagline: 'Zero Middlemen. 100% Fair Pay.',
    navJobs: 'Jobs Feed',
    navHunt: 'Hunt Talent',
    navCalculator: 'Salary Calculator',
    navNcvt: 'NCVT Check',
    navReport: 'Report Cut',
    switchWorker: 'Worker Portal',
    switchEmployer: 'Employer Portal',
    backToHome: 'Back to Overview',
    heroBadge: 'Open for All: Unskilled Helpers, Semi-Skilled Hands & Certified ITI Technicians',
    heroMainTitle: 'India\'s Direct Industrial Workforce Marketplace',
    heroMainDesc: 'Whether you are a fresher looking for Helper & Packing work with zero certificates, or an ITI technician—connect directly with verified factories. Zero thekedar cuts. 100% fair pay in your bank.',
    enterWorkerPortal: 'I am a Worker (Find Jobs)',
    enterWorkerSub: 'Helper, Packer & ITI Jobs · Audio Cards · No Documents Required',
    enterEmployerPortal: 'I am a Factory / HR (Hire)',
    enterEmployerSub: 'Post Requirements · Hire Helpers & ITI Staff · Digital Offers',
    statZeroCuts: '₹0 Contractor Deductions',
    statZeroCutsDesc: '100% of the wage goes to the worker\'s account',
    statWorkers: 'Workers on Hello Jobs',
    statWorkersDesc: 'Helpers, packers, fitters, welders, CNC operators and electricians',
    statFactories: 'Jobs from verified factories',
    statFactoriesDesc: 'Every factory is GSTIN-checked by our team',
    statJoiningTime: '48 Hours Average Joining',
    statJoiningTimeDesc: 'Direct HR interview scheduling with no brokers',
    filterTrade: 'Filter by Work Type / Trade',
    filterAllTrades: 'All Work Types',
    filterHub: 'Industrial Hub',
    filterAllHubs: 'All Manufacturing Hubs',
    takeHomePay: 'Take-Home Salary',
    overtimeRate: 'Overtime Pay',
    perHour: '/ hour',
    perMonth: '/ month',
    shift: 'Shift Pattern',
    facilities: 'Plant Facilities',
    hostel: 'Free / Subsidized Hostel',
    mess: 'Canteen Facility',
    bus: 'Plant Bus Pickup',
    esiPf: 'Full ESI & PF Covered',
    vacancies: 'Openings Available',
    directCall: 'Direct Call HR',
    applyWhatsapp: 'Apply via WhatsApp',
    listenAudio: 'Listen Job Audio',
    playingAudio: 'Playing Voice Card...',
    stopAudio: 'Stop Audio',
    viewNcvtCriteria: 'NCVT Criteria',
    reportCut: 'Report Illegal Cut',
    searchWorkerPlaceholder: 'Search Helper, Packing, Loader, CNC, Welder, or City...',
    searchCandidatePlaceholder: 'Search Helper, Packer, Fanuc, Welder, or City...',
    allHubs: 'All Hubs',
    createTradeProfile: '3-Tap Easy Profile (No Docs Needed)',
    postRequirement: 'Post Bulk Requirement',
    candidateDirectory: 'Active Talent Directory',
    postBulkTitle: 'Post Factory Requirement',
    issueDigitalOffer: 'Issue Direct Offer Letter',
    viewNcvtCertificate: 'View Official NCVT Card',
    viewPracticalDemo: 'Watch 30s Practical Demo',
    relocationWilling: 'Willing to Relocate',
    immediateJoiner: 'Immediate Joiner',
    experience: 'Experience',
    years: 'years',
    machinesHandled: 'Work Skills & Machines',
    verifiedNcvt: 'NCVT Certified',
    ncvtCheckTitle: 'NCVT MIS Certificate Verification',
    reportModalTitle: 'Report Contractor (Thekedar) Exploitation',
    reportModalDesc: 'Hello Jobs guarantees ₹0 recruiter fee. If any contractor demands salary cuts or commission, report them immediately.',
    calculatorTitle: 'Zero-Middleman Wage Calculator',
    calculatorDesc: 'See how much extra money you keep when hiring directly vs through manpower thekedars.',
    thekedarCutWarning: 'Traditional thekedars pocket 15% to 30% of your earned wage every single month.',
    voiceGuideBtn: 'Listen Voice Guide',
    tabAllJobs: 'All Factory Jobs',
    tabNoCertJobs: 'No Certificate Needed (Helper & Packing)',
    tabItiJobs: 'ITI & Skilled Machine Jobs',
    noCertBadge: 'No Certificate Needed · Direct Joining',
  },
  hi: {
    brandTagline: 'भारतीय उद्योग के लिए सीधे हाथ',
    subTagline: 'शून्य बिचौलिया (नो ठेकेदार) · 100% सही वेतन',
    navJobs: 'नौकरी देखें',
    navHunt: 'कारीगर खोजें',
    navCalculator: 'वेतन कैलकुलेटर',
    navNcvt: 'NCVT जाँच',
    navReport: 'शिकायत करें',
    switchWorker: 'कामगार पोर्टल',
    switchEmployer: 'फैक्ट्री HR पोर्टल',
    backToHome: 'मुख्य पृष्ठ',
    heroBadge: 'सभी के लिए खुला: बिना सर्टिफिकेट हेल्पर/पैकर, सेमी-स्किल्ड और ITI कारीगर',
    heroMainTitle: 'भारत का सीधा औद्योगिक वर्कफ़ोर्स बाज़ार',
    heroMainDesc: 'चाहे आपके पास कोई सर्टिफिकेट न हो (हेल्पर, लोडर, पैकिंग का काम) या आप ITI पास हों—सीधे फैक्ट्रियों से जुड़ें। ठेकेदार का कोई कमीशन नहीं। 100% पूरा वेतन सीधे बैंक खाते में।',
    enterWorkerPortal: 'मुझे नौकरी चाहिए (कामगार)',
    enterWorkerSub: 'हेल्पर, पैकर और ITI · ऑडियो कार्ड · बिना कागज़ात प्रोफाइल',
    enterEmployerPortal: 'मैं फैक्ट्री / HR हूँ (भर्ती करें)',
    enterEmployerSub: 'वैकेंसी डालें · हेल्पर और ITI खोजें · सीधा ऑफर',
    statZeroCuts: '₹0 ठेकेदार कमीशन',
    statZeroCutsDesc: 'वेतन का 100% सीधे कामगार के खाते में जमा',
    statWorkers: 'हेलो जॉब्स पर कामगार',
    statWorkersDesc: 'हेल्पर, पैकर, फिटर, वेल्डर, CNC और इलेक्ट्रीशियन',
    statFactories: 'सत्यापित कारखानों की नौकरियां',
    statFactoriesDesc: 'हर कारखाने का GSTIN हमारी टीम जांचती है',
    statJoiningTime: '48 घंटे में सीधी जॉइनिंग',
    statJoiningTimeDesc: 'बिना किसी दलाल के डायरेक्ट HR इंटरव्यू',
    filterTrade: 'काम का प्रकार चुनें',
    filterAllTrades: 'सभी काम और ट्रेड',
    filterHub: 'इंडस्ट्रियल एरिया',
    filterAllHubs: 'सभी शहर / हब',
    takeHomePay: 'हाथ में मिलने वाला वेतन',
    overtimeRate: 'ओवरटाइम दर',
    perHour: '/ घंटा',
    perMonth: '/ महीना',
    shift: 'शिफ्ट का समय',
    facilities: 'फैक्ट्री सुविधाएं',
    hostel: 'फ्री / रियायती हॉस्टल',
    mess: 'सस्ती कैंटीन सुविधा',
    bus: 'फैक्ट्री बस पिकअप',
    esiPf: 'पूरा ESI और PF जमा',
    vacancies: 'खाली पद (वैकेंसी)',
    directCall: 'सीधे HR को कॉल करें',
    applyWhatsapp: 'व्हाट्सएप पर अप्लाई करें',
    listenAudio: 'नौकरी की आवाज़ सुनें',
    playingAudio: 'ऑडियो चल रहा है...',
    stopAudio: 'आवाज़ बंद करें',
    viewNcvtCriteria: 'NCVT योग्यता',
    reportCut: 'कमीशन मांगने पर शिकायत',
    searchWorkerPlaceholder: 'हेल्पर, पैकिंग, लोडर, CNC, वेल्डर या शहर खोजें...',
    searchCandidatePlaceholder: 'हेल्पर, पैकर, मशीन, ट्रेड या शहर से खोजें...',
    allHubs: 'सभी हब',
    createTradeProfile: '3-टैप आसान प्रोफाइल (बिना सर्टिफिकेट)',
    postRequirement: 'फैक्ट्री भर्ती पोस्ट करें',
    candidateDirectory: 'कामगार डायरेक्टरी',
    postBulkTitle: 'फैक्ट्री की आवश्यकता दर्ज करें',
    issueDigitalOffer: 'सीधा डिजिटल ऑफर लेटर जारी करें',
    viewNcvtCertificate: 'NCVT सर्टिफिकेट देखें',
    viewPracticalDemo: '30-सेकंड मशीन वीडियो देखें',
    relocationWilling: 'दूसरी जगह काम को तैयार',
    immediateJoiner: 'तुरंत जॉइन कर सकते हैं',
    experience: 'अनुभव',
    years: 'साल',
    machinesHandled: 'काम का कौशल / मशीनें',
    verifiedNcvt: 'NCVT प्रमाणित',
    ncvtCheckTitle: 'NCVT MIS सर्टिफिकेट सत्यापन',
    reportModalTitle: 'ठेकेदार शोषण और कमीशन की शिकायत',
    reportModalDesc: 'हेलो जॉब्स पर नौकरी 100% मुफ्त है। अगर कोई ठेकेदार पैसे मांगता है या सैलरी काटता है, तो तुरंत शिकायत करें।',
    calculatorTitle: 'शून्य बिचौलिया वेतन कैलकुलेटर',
    calculatorDesc: 'देखें कि सीधे जुड़ने पर ठेकेदार के 25% कमीशन से आपको हर महीने कितने रुपये अधिक मिलते हैं।',
    thekedarCutWarning: 'पारंपरिक ठेकेदार हर महीने आपकी मेहनत की कमाई से ₹4,000 से ₹7,000 काट लेते हैं।',
    voiceGuideBtn: 'आवाज़ में गाइड सुनें',
    tabAllJobs: 'सभी फैक्ट्री नौकरियां',
    tabNoCertJobs: 'बिना सर्टिफिकेट (हेल्पर, पैकिंग और लोडर)',
    tabItiJobs: 'ITI और मशीन ऑपरेटर नौकरियां',
    noCertBadge: 'कोई सर्टिफिकेट नहीं चाहिए · सीधी भर्ती',
  },
  mr: {
    brandTagline: 'भारतीय उद्योगांसाठी थेट मनुष्यबळ',
    subTagline: 'शून्य मध्यस्थ (नो ठेकेदार) · 100% न्याय्य वेतन',
    navJobs: 'नोकऱ्या पहा',
    navHunt: 'कामगार शोधा',
    navCalculator: 'पगार कॅल्क्युलेटर',
    navNcvt: 'NCVT तपासणी',
    navReport: 'तक्रार करा',
    switchWorker: 'कामगार पोर्टल',
    switchEmployer: 'कंपनी HR पोर्टल',
    backToHome: 'मुख्य पृष्ठ',
    heroBadge: 'सर्वांसाठी खुले: विना-प्रमाणपत्र हेल्पर/पॅकर, सेमी-स्किल्ड आणि ITI तंत्रज्ञ',
    heroMainTitle: 'भारताचे थेट औद्योगिक वर्कफोर्स मार्केटप्लेस',
    heroMainDesc: 'तुमच्याकडे कोणतेही सर्टिफिकेट नसले तरीही (हेल्पर, पॅकिंग, लोडिंग) किंवा तुम्ही ITI पास असाल—थेट कंपन्यांशी जुळा. ठेकेदाराचे कमिशन नाही. 100% पगार बँक खात्यात.',
    enterWorkerPortal: 'मला नोकरी हवी आहे (कामगार)',
    enterWorkerSub: 'हेल्पर, पॅकर व ITI · ऑडिओ कार्ड · कागदपत्रांची गरज नाही',
    enterEmployerPortal: 'मी कंपनी / HR आहे (भरती करा)',
    enterEmployerSub: 'मागणी नोंदवा · हेल्पर व ITI शोधा · डिजिटल ऑफर',
    statZeroCuts: '₹0 ठेकेदार कपात',
    statZeroCutsDesc: '100% पगार थेट कामगाराच्या बँक खात्यात',
    statWorkers: 'हेलो जॉब्सवरील कामगार',
    statWorkersDesc: 'हेल्पर, पॅकर, फिटर, वेल्डर, CNC आणि इलेक्ट्रिशियन',
    statFactories: 'सत्यापित कारखान्यांच्या नोकऱ्या',
    statFactoriesDesc: 'प्रत्येक कारखान्याचा GSTIN आमची टीम तपासते',
    statJoiningTime: '48 तासांत थेट जॉइनिंग',
    statJoiningTimeDesc: 'कोणत्याही एजंटशिवाय थेट कंपनी HR मुलाखत',
    filterTrade: 'कामाचा प्रकार निवडा',
    filterAllTrades: 'सर्व कामे आणि ट्रेड्स',
    filterHub: 'औद्योगिक परिसर',
    filterAllHubs: 'सर्व एमआयडीसी हब',
    takeHomePay: 'हातात मिळणारा पगार',
    overtimeRate: 'ओव्हरटाईम दर',
    perHour: '/ तास',
    perMonth: '/ महिना',
    shift: 'शिफ्ट वेळ',
    facilities: 'कंपनी सुविधा',
    hostel: 'मोफत / सवलतीचे वसतिगृह',
    mess: 'कॅन्टीन सुविधा',
    bus: 'कंपनी बस सेवा',
    esiPf: 'पूर्ण ESI व PF सुविधा',
    vacancies: 'उपलब्ध जागा',
    directCall: 'थेट HR ला कॉल करा',
    applyWhatsapp: 'व्हॉट्सअॅपवर अर्ज करा',
    listenAudio: 'नोकरीची माहिती ऐका',
    playingAudio: 'ऑडिओ चालू आहे...',
    stopAudio: 'आवाज थांबवा',
    viewNcvtCriteria: 'NCVT पात्रता',
    reportCut: 'कमिशन मागितल्यास तक्रार करा',
    searchWorkerPlaceholder: 'हेल्पर, पॅकिंग, CNC, फिटर किंवा शहर शोधा...',
    searchCandidatePlaceholder: 'हेल्पर, मशीन, ट्रेड किंवा अनुभवाने शोधा...',
    allHubs: 'सर्व हब',
    createTradeProfile: '3-टॅप सोपी प्रोफाइल (कागदपत्रांशिवाय)',
    postRequirement: 'कंपनी भरती नोंदवा',
    candidateDirectory: 'कामगार सूची',
    postBulkTitle: 'कंपनीची भरती आवश्यकता नोंदवा',
    issueDigitalOffer: 'थेट डिजिटल ऑफर लेटर द्या',
    viewNcvtCertificate: 'NCVT प्रमाणपत्र पहा',
    viewPracticalDemo: '30-सेकंद मशीन प्रात्यक्षिक व्हिडिओ',
    relocationWilling: 'स्थान बदलास तयार',
    immediateJoiner: 'तातडीने रुजू होण्यास तयार',
    experience: 'अनुभव',
    years: 'वर्षे',
    machinesHandled: 'कौशल्ये आणि यंत्रे',
    verifiedNcvt: 'NCVT प्रमाणित',
    ncvtCheckTitle: 'NCVT MIS प्रमाणपत्र पडताळणी',
    reportModalTitle: 'ठेकेदार पिळवणूक व कमिशन तक्रार',
    reportModalDesc: 'हॅलो जॉब्सवर भरती पूर्णपणे विनामूल्य आहे. कोणत्याही ठेकेदाराने कमिशन मागितल्यास लगेच तक्रार नोंदवा.',
    calculatorTitle: 'शून्य मध्यस्थ पगार कॅल्क्युलेटर',
    calculatorDesc: 'थेट भरतीमुळे ठेकेदाराच्या कपातीशिवाय तुमचे दरमहा किती हजार रुपये वाचतात ते पहा.',
    thekedarCutWarning: 'पारंपरिक ठेकेदार दरमहा तुमच्या पगारातून 15% ते 30% रक्कम बेकायदेशीरपणे कापून घेतात.',
    voiceGuideBtn: 'आवाजात माहिती ऐका',
    tabAllJobs: 'सर्व कंपनी नोकऱ्या',
    tabNoCertJobs: 'सर्टिफिकेट नको (हेल्पर, पॅकिंग व लोडर)',
    tabItiJobs: 'ITI आणि मशीन ऑपरेटर नोकऱ्या',
    noCertBadge: 'सर्टिफिकेटची गरज नाही · थेट जॉइनिंग',
  },
  ta: {
    brandTagline: 'இந்திய தொழிற்துறைக்கான நேரடி தொழிலாளர்கள்',
    subTagline: 'இடைத்தரகர் இல்லாத வேலை · 100% நியாயமான ஊதியம்',
    navJobs: 'வேலைகள்',
    navHunt: 'தொழிலாளர்கள் தேடு',
    navCalculator: 'ஊதியக் கணிப்பான்',
    navNcvt: 'NCVT சரிபார்ப்பு',
    navReport: 'புகார் செய்',
    switchWorker: 'தொழிலாளர் பகுதி',
    switchEmployer: 'தொழிற்சாலை HR பகுதி',
    backToHome: 'முகப்பு',
    heroBadge: 'அனைவருக்கும் வாய்ப்பு: சான்றிதழ் இல்லா உதவியாளர்கள் & ITI டெக்னீஷியன்கள்',
    heroMainTitle: 'இந்தியாவின் நேரடி தொழிற்துறை வேலைவாய்ப்பு தளம்',
    heroMainDesc: 'உங்களிடம் எந்த சான்றிதழும் இல்லையென்றாலும் (ஹெல்பர், பேக்கிங், லோடிங் வேலை) அல்லது ITI முடித்திருந்தாலும்—நேரடியாக தொழிற்சாலைகளில் சேருங்கள். இடைத்தரகர் கமிஷன் இல்லை.',
    enterWorkerPortal: 'எனக்கு வேலை வேண்டும் (தொழிலாளி)',
    enterWorkerSub: 'ஹெல்பர், பேக்கர் & ITI · ஆடியோ அட்டை · ஆவணங்கள் தேவையில்லை',
    enterEmployerPortal: 'நான் தொழிற்சாலை / HR (ஆள் தேவை)',
    enterEmployerSub: 'தேவையை பதிவிடு · ஹெல்பர் & ITI தேடு · டிஜிட்டல் ஆஃபர்',
    statZeroCuts: '₹0 இடைத்தரகர் பிடித்தம்',
    statZeroCutsDesc: '100% முழு ஊதியமும் தொழிலாளரின் கணக்கில் சேரும்',
    statWorkers: 'Hello Jobs தொழிலாளர்கள்',
    statWorkersDesc: 'ஹெல்பர், பேக்கர், ஃபிட்டர், வெல்டர், CNC, எலக்ட்ரீஷியன்',
    statFactories: 'சரிபார்க்கப்பட்ட ஆலைகளின் வேலைகள்',
    statFactoriesDesc: 'ஒவ்வொரு ஆலையின் GSTIN-ஐயும் எங்கள் குழு சரிபார்க்கிறது',
    statJoiningTime: '48 மணி நேரத்தில் நேரடி வேலை',
    statJoiningTimeDesc: 'எந்த இடைத்தரகரும் இன்றி நேரடி HR நேர்காணல்',
    filterTrade: 'வேலை வகை (Work Type)',
    filterAllTrades: 'அனைத்து வேலை வகைகள்',
    filterHub: 'தொழிற்சாலை மண்டலம்',
    filterAllHubs: 'அனைத்து நகரங்கள் / மண்டலங்கள்',
    takeHomePay: 'கைக்கு வரும் மாத ஊதியம்',
    overtimeRate: 'ஓவர்டைம் ஊதியம்',
    perHour: '/ மணி நேரம்',
    perMonth: '/ மாதம்',
    shift: 'ஷிப்ட் முறை',
    facilities: 'தொழிற்சாலை வசதிகள்',
    hostel: 'இலவச / மானிய தங்குமிடம்',
    mess: 'உணவக வசதி',
    bus: 'தொழிற்சாலை பேருந்து வசதி',
    esiPf: 'முழு ESI மற்றும் PF வசதி',
    vacancies: 'காலியிடங்கள்',
    directCall: 'நேரடியாக HR-ஐ அழைக்கவும்',
    applyWhatsapp: 'வாட்ஸ்அப் மூலம் விண்ணப்பிக்கவும்',
    listenAudio: 'வேலை விவரங்களை கேட்கவும்',
    playingAudio: 'ஆடியோ ஒலிக்கிறது...',
    stopAudio: 'ஆடியோவை நிறுத்தவும்',
    viewNcvtCriteria: 'NCVT தகுதி',
    reportCut: 'கமிஷன் கேட்டால் புகார்',
    searchWorkerPlaceholder: 'ஹெல்பர், பேக்கிங், CNC, வெல்டர் அல்லது ஊர் தேடவும்...',
    searchCandidatePlaceholder: 'ஹெல்பர், இயந்திரம், தொழில் அல்லது அனுபவம்...',
    allHubs: 'அனைத்து மையங்கள்',
    createTradeProfile: '3-டேப் எளிய சுயவிவரம் (ஆவணங்கள் வேண்டாம்)',
    postRequirement: 'தொழிற்சாலை தேவையை பதிவிடு',
    candidateDirectory: 'தொழிலாளர்கள் பட்டியல்',
    postBulkTitle: 'தொழிற்சாலை ஆட்சேர்ப்பு தேவை',
    issueDigitalOffer: 'நேரடி டிஜிட்டல் பணி நியமன கடிதம்',
    viewNcvtCertificate: 'NCVT சான்றிதழ் காண்க',
    viewPracticalDemo: '30-வினாடி இயந்திர வீடியோ செய்முறை',
    relocationWilling: 'வேறூர் செல்ல தயார்',
    immediateJoiner: 'உடனடியாக சேர தயார்',
    experience: 'अनुபவம்',
    years: 'ஆண்டுகள்',
    machinesHandled: 'திறன்கள் & இயந்திரங்கள்',
    verifiedNcvt: 'NCVT சான்றளிக்கப்பட்டது',
    ncvtCheckTitle: 'NCVT MIS சான்றிதழ் சரிபார்ப்பு',
    reportModalTitle: 'இடைத்தரகர் சுரண்டல் மற்றும் கமிஷன் புகார்',
    reportModalDesc: 'ஹலோ ஜாப்ஸ் தளத்தில் வேலை வாய்ப்பு முற்றிலும் இலவசம். யாரேனும் கமிஷன் கேட்டால் உடனடியாக புகார் செய்யவும்.',
    calculatorTitle: 'இடைத்தரகர் இல்லா சம்பளக் கணிப்பான்',
    calculatorDesc: 'நேரடி பணியில் சேருவதால் இடைத்தரகர்களின் 25% கமிஷன் சேமிக்கப்பட்டு உங்கள் கைக்கு எவ்வளவு கூடுதல் பணம் கிடைக்கிறது என்று பாருங்கள்.',
    thekedarCutWarning: 'பாரம்பரிய இடைத்தரகர்கள் உங்கள் மாத உழைப்பில் 15% முதல் 30% தொகையை தங்களுக்குள் எடுத்துக்கொள்கிறார்கள்.',
    voiceGuideBtn: 'குரல் வழிகாட்டியைக் கேளுங்கள்',
    tabAllJobs: 'அனைத்து தொழிற்சாலை வேலைகள்',
    tabNoCertJobs: 'சான்றிதழ் தேவையில்லை (ஹெல்பர் & பேக்கிங்)',
    tabItiJobs: 'ITI மற்றும் மெஷின் ஆபரேட்டர் வேலைகள்',
    noCertBadge: 'சான்றிதழ் தேவையில்லை · நேரடி பணி',
  },
};

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
        return 'Digital Personal Data Protection Act 2023 Notice: Hello Jobs collects your name, mobile number, and work skills strictly to connect you directly with GSTIN-verified factories and issue direct payroll offer letters. Your data is never shared with third-party contractors or thekedars. Under the DPDP Act, you have the right to withdraw consent, erase your data, appoint a nominee, or file a grievance at any time.';
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
      return 'Welcome to the Hello Jobs Worker Feed. If you do not have an ITI certificate, tap the green No Certificate Helper and Packing button at the top. You can also tap Listen Job Audio on any card to hear the salary and facilities read aloud.';
  }
}
