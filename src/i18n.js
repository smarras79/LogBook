import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

const supportedLngs = ['en', 'es', 'ca', 'pt'];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs,
    ns: ['common'],
    defaultNS: 'common',
    load: 'languageOnly',
    debug: false,
    detection: {
      // default order & caches; persists under localStorage key "i18nextLng"
    },
    backend: {
      loadPath: (process.env.PUBLIC_URL || '') + '/locales/{{lng}}/{{ns}}.json'
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

export default i18n;
