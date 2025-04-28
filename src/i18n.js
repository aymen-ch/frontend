import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    lng: 'ar', // default language
    fallbackLng: 'ar',
    debug: true,
    interpolation: {
      escapeValue: false
    },
    resources: {
      ar: {
        translation: require('./ar.json')
      },
      fr: {
        translation: require('./fr.json')
      }
    }
  });

export default i18n;
