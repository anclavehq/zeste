import { detectLanguage, loadMessages } from '@zeste/services/i18n';

// `?lang=fr` stands for a page that declares its language (<html lang="fr">).
const lang = new URLSearchParams(location.search).get('lang');
if (lang) document.documentElement.lang = lang;

const language = detectLanguage();
const messages = await loadMessages(language);
const out = document.querySelector<HTMLElement>('#out')!;
out.dataset.language = language;
out.textContent = messages.acceptAll;
