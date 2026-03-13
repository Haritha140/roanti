import { appState, showToast } from '../main';

type LangKey = string;
interface Translations {
    [key: string]: { [lang: string]: string };
}

const translations: Translations = {
    'nav.home': { en: 'Home', hi: 'होम', te: 'హోమ్' },
    'nav.upload': { en: 'Upload', hi: 'अपलोड', te: 'అప్‌లోడ్' },
    'nav.colors': { en: 'Colors', hi: 'रंग', te: 'రంగులు' },
    'nav.furniture': { en: 'Furniture', hi: 'फर्नीचर', te: 'ఫర్నీచర్' },
    'nav.budget': { en: 'Budget', hi: 'बजट', te: 'బడ్జెట్' },
    'nav.aidesign': { en: 'AI Design', hi: 'AI डिज़ाइन', te: 'AI డిజైన్' },
    'nav.3dview': { en: '3D View', hi: '3D व्यू', te: '3D వ్యూ' },
    'hero.badge': { en: 'AI-Powered Interior Design', hi: 'AI-संचालित इंटीरियर डिज़ाइन', te: 'AI-ఆధారిత ఇంటీరియర్ డిజైన్' },
    'hero.title.1': { en: 'Design Your Dream Home ', hi: 'AI के साथ अपना सपनों का घर ', te: 'AI తో మీ కలల ఇంటిని ' },
    'hero.title.2': { en: 'with AI', hi: 'बनाएं', te: 'డిజైన్ చేయండి' },
    'hero.subtitle': { en: 'Upload your room. Get intelligent 3D transformations instantly. Powered by advanced AI for color, furniture, budget optimization.', hi: 'अपना कमरा अपलोड करें। तुरंत बुद्धिमान 3D परिवर्तन प्राप्त करें।', te: 'మీ గదిని అప్‌లోడ్ చేయండి. తక్షణ AI 3D పరివర్తనలను పొందండి.' },
    'hero.upload': { en: 'Upload Room', hi: 'कमरा अपलोड', te: 'గది అప్‌లోడ్' },
    'hero.demo': { en: 'Try Demo', hi: 'डेमो आज़माएं', te: 'డెమో ప్రయత్నించు' },
    'hero.explore': { en: 'Explore Designs', hi: 'डिज़ाइन देखें', te: 'డిజైన్లు చూడండి' },
    'hero.stat1.num': { en: '12,847', hi: '12,847', te: '12,847' },
    'hero.stat1.label': { en: 'Designs Created', hi: 'डिज़ाइन बनाए', te: 'డిజైన్లు' },
    'hero.stat2.num': { en: '98%', hi: '98%', te: '98%' },
    'hero.stat2.label': { en: 'Satisfaction', hi: 'संतुष्टि', te: 'సంతృప్తి' },
    'hero.stat3.num': { en: '50+', hi: '50+', te: '50+' },
    'hero.stat3.label': { en: 'Design Styles', hi: 'डिज़ाइन शैलियां', te: 'డిజైన్ శైలులు' },
    'upload.badge': { en: 'Step 1', hi: 'चरण 1', te: 'దశ 1' },
    'upload.title': { en: 'Upload Your Room', hi: 'अपना कमरा अपलोड करें', te: 'మీ గదిని అప్‌లోడ్ చేయండి' },
    'upload.subtitle': { en: 'Upload a photo of your room to begin the AI transformation', hi: 'AI परिवर्तन शुरू करने के लिए अपने कमरे की फोटो अपलोड करें', te: 'AI పరివర్తన ప్రారంభించడానికి మీ గది ఫోటోను అప్‌లోడ్ చేయండి' },
    'upload.drag': { en: 'Drag & Drop your room photo', hi: 'अपने कमरे की फोटो खींचें और छोड़ें', te: 'మీ గది ఫోటోను డ్రాగ్ & డ్రాప్ చేయండి' },
    'upload.or': { en: 'or click to browse • JPG, PNG, HEIC supported', hi: 'या ब्राउज़ करें • JPG, PNG, HEIC', te: 'లేదా బ్రౌజ్ చేయండి • JPG, PNG, HEIC' },
    'upload.browse': { en: 'Browse Files', hi: 'फाइल ब्राउज़ करें', te: 'ఫైల్స్ బ్రౌజ్ చేయండి' },
    'upload.roomtype': { en: 'Select Room Type', hi: 'कमरे का प्रकार चुनें', te: 'గది రకాన్ని ఎంచుకోండి' },
    'color.badge': { en: 'Step 2', hi: 'चरण 2', te: 'దశ 2' },
    'color.title': { en: 'Smart Color Engine', hi: 'स्मार्ट कलर इंजन', te: 'స్మార్ట్ కలర్ ఇంజన్' },
    'color.subtitle': { en: 'AI-powered color recommendations for walls, accent, ceiling & furniture', hi: 'दीवारों, छत और फर्नीचर के लिए AI रंग सिफारिशें', te: 'గోడలు, సీలింగ్ & ఫర్నీచర్ కోసం AI రంగు సిఫార్సులు' },
    'furniture.badge': { en: 'Step 3', hi: 'चरण 3', te: 'దశ 3' },
    'furniture.title': { en: 'AI Furniture Suggestions', hi: 'AI फर्नीचर सुझाव', te: 'AI ఫర్నీచర్ సూచనలు' },
    'furniture.subtitle': { en: 'Smart furniture picks based on your room type, theme, and budget', hi: 'आपके कमरे, थीम और बजट के अनुसार', te: 'మీ గది, థీమ్ మరియు బడ్జెట్ ఆధారంగా' },
    'budget.badge': { en: 'Step 4', hi: 'चरण 4', te: 'దశ 4' },
    'budget.title': { en: 'Smart Budget System', hi: 'स्मार्ट बजट सिस्टम', te: 'స్మార్ట్ బడ్జెట్ సిస్టమ్' },
    'budget.subtitle': { en: 'AI optimizes your design to match your budget perfectly', hi: 'AI आपके बजट के अनुसार डिज़ाइन अनुकूलित करता है', te: 'AI మీ బడ్జెట్‌కు తగ్గట్లుగా డిజైన్‌ను ఆప్టిమైజ్ చేస్తుంది' },
    'slider.badge': { en: 'Step 5', hi: 'चरण 5', te: 'దశ 5' },
    'slider.title': { en: 'AI Room Transformation', hi: 'AI कमरा परिवर्तन', te: 'AI గది పరివర్తన' },
    'slider.subtitle': { en: 'Your preferences are applied — see the AI-generated redesign of your room', hi: 'आपकी पसंद लागू — AI-जनित रीडिज़ाइन देखें', te: 'మీ ఎంపికలు వర్తింపజేయబడ్డాయి — AI-జనరేట్ చేసిన రీడిజైన్ చూడండి' },
    'room3d.badge': { en: 'Step 6', hi: 'चरण 6', te: 'దశ 6' },
    'room3d.title': { en: 'Interactive 3D Room', hi: 'इंटरैक्टिव 3D रूम', te: 'ఇంటరాక్టివ్ 3D రూమ్' },
    'room3d.subtitle': { en: 'Explore your redesigned room in full 3D with all your selected furniture', hi: 'अपने पुन: डिज़ाइन किए गए कमरे को 3D में देखें', te: 'మీ రీడిజైన్ చేసిన గదిని 3D లో అన్వేషించండి' },
    'report.badge': { en: 'Final', hi: 'अंतिम', te: 'చివరి' },
    'report.title': { en: 'Design Report', hi: 'डिज़ाइन रिपोर्ट', te: 'డిజైన్ రిపోర్ట్' },
    'report.subtitle': { en: 'Download your complete AI-generated design report', hi: 'अपनी पूर्ण AI डिज़ाइन रिपोर्ट डाउनलोड करें', te: 'మీ పూర్తి AI డిజైన్ రిపోర్ట్ డౌన్‌లోడ్ చేయండి' },
};

const languages = ['en', 'hi', 'te'];
const langLabels: Record<string, string> = { en: 'EN', hi: 'हि', te: 'తె' };
const langNames: Record<string, string> = { en: 'English', hi: 'हिंदी', te: 'తెలుగు' };

export function initI18n() {
    const toggleBtn = document.getElementById('lang-toggle')!;
    if (!toggleBtn) return;

    // First, inject data-i18n attributes into existing HTML elements
    injectI18nAttributes();

    toggleBtn.addEventListener('click', () => {
        const currentIdx = languages.indexOf(appState.language);
        const nextIdx = (currentIdx + 1) % languages.length;
        appState.language = languages[nextIdx];
        applyTranslations(appState.language);
        toggleBtn.textContent = `🌐 ${langLabels[appState.language]}`;
        showToast(`Language: ${langNames[appState.language]}`, 'info');
    });

    // Apply default language
    applyTranslations(appState.language);
}

function injectI18nAttributes() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    const navKeys = ['nav.home', 'nav.upload', 'nav.colors', 'nav.furniture', 'nav.budget', 'nav.aidesign', 'nav.3dview'];
    navLinks.forEach((link, i) => {
        if (navKeys[i]) link.setAttribute('data-i18n', navKeys[i]);
    });

    // Section badges and titles: use querySelectorAll for each section
    const sectionMappings = [
        { section: '#upload-section', badge: 'upload.badge', title: 'upload.title', subtitle: 'upload.subtitle' },
        { section: '#color-section', badge: 'color.badge', title: 'color.title', subtitle: 'color.subtitle' },
        { section: '#furniture-section', badge: 'furniture.badge', title: 'furniture.title', subtitle: 'furniture.subtitle' },
        { section: '#budget-section', badge: 'budget.badge', title: 'budget.title', subtitle: 'budget.subtitle' },
        { section: '#slider-section', badge: 'slider.badge', title: 'slider.title', subtitle: 'slider.subtitle' },
        { section: '#room3d-section', badge: 'room3d.badge', title: 'room3d.title', subtitle: 'room3d.subtitle' },
        { section: '#report-section', badge: 'report.badge', title: 'report.title', subtitle: 'report.subtitle' },
    ];

    sectionMappings.forEach(m => {
        const section = document.querySelector(m.section);
        if (!section) return;

        const badge = section.querySelector('.section-badge');
        const title = section.querySelector('.section-title');
        const subtitle = section.querySelector('.section-subtitle');

        if (badge) badge.setAttribute('data-i18n', m.badge);
        if (title) title.setAttribute('data-i18n', m.title);
        if (subtitle) subtitle.setAttribute('data-i18n', m.subtitle);
    });

    // Hero section
    const heroBadge = document.querySelector('.hero-badge span:last-child');
    if (heroBadge) heroBadge.setAttribute('data-i18n', 'hero.badge');

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) heroSubtitle.setAttribute('data-i18n', 'hero.subtitle');

    // Hero stat labels
    const statLabels = document.querySelectorAll('.stat-label');
    const statKeys = ['hero.stat1.label', 'hero.stat2.label', 'hero.stat3.label'];
    statLabels.forEach((label, i) => {
        if (statKeys[i]) label.setAttribute('data-i18n', statKeys[i]);
    });

    // Upload section elements
    const dragTitle = document.querySelector('#upload-dropzone h3');
    if (dragTitle) dragTitle.setAttribute('data-i18n', 'upload.drag');
    const dragText = document.querySelector('#upload-dropzone p');
    if (dragText) dragText.setAttribute('data-i18n', 'upload.or');
    const browseBtn = document.getElementById('browse-btn');
    if (browseBtn) browseBtn.setAttribute('data-i18n', 'upload.browse');
    const roomTypeTitle = document.querySelector('#room-type-selector h3');
    if (roomTypeTitle) roomTypeTitle.setAttribute('data-i18n', 'upload.roomtype');
}

function applyTranslations(lang: string) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n')!;
        if (translations[key] && translations[key][lang]) {
            // Only update text content for leaf nodes (no child elements)
            if (el.children.length === 0) {
                el.textContent = translations[key][lang];
            }
        }
    });
}
