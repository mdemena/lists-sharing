import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';
import ca from './locales/ca.json';
import eu from './locales/eu.json';
import gl from './locales/gl.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: { translation: es },
            en: { translation: en },
            ca: { translation: ca },
            eu: { translation: eu },
            gl: { translation: gl },
        },
        lng: undefined, // Let language detector handle it
        fallbackLng: 'en', // Default to English if detection fails
        supportedLngs: ['es', 'ca', 'eu', 'gl', 'en'],
        load: 'languageOnly', // Transform 'es-ES' -> 'es'
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        }
    });

export default i18n;
