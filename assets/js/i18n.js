(function () {
    const STORAGE_KEY = 'alpimimarlik-lang';
    const DEFAULT_LANG = 'tr';
    const SUPPORTED_LANGS = ['tr', 'en'];
    const SITE_COPY_ENDPOINT_BASE = '/api/site-copy';
    const translations = {};
    let currentLang = DEFAULT_LANG;
    const changeCallbacks = new Set();

    const resolveKey = (dictionary, key) => {
        if (!dictionary) return undefined;
        return key.split('.').reduce((acc, part) => {
            if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
                return acc[part];
            }
            return undefined;
        }, dictionary);
    };

    const applyValue = (element, value, target) => {
        if (value === undefined || value === null) return;
        if (target) {
            if (target === 'text') {
                if (element.textContent !== value) {
                    element.textContent = value;
                }
            } else if (target === 'html') {
                if (element.innerHTML !== value) {
                    element.innerHTML = value;
                }
            } else {
                if (element.getAttribute(target) !== value) {
                    element.setAttribute(target, value);
                }
            }
            return;
        }

        const nodeName = element.nodeName.toLowerCase();
        if (nodeName === 'input' || nodeName === 'textarea') {
            if (element.placeholder !== undefined) {
                if (element.placeholder !== value) {
                    element.placeholder = value;
                }
            } else {
                if (element.value !== value) {
                    element.value = value;
                }
            }
            return;
        }

        if (nodeName === 'title') {
            if (element.textContent !== value) {
                element.textContent = value;
            }
            return;
        }

        if (element.textContent !== value) {
            element.textContent = value;
        }
    };

    const applyTranslations = (lang) => {
        const dictionary = translations[lang];
        if (!dictionary) return;

        const html = document.documentElement;
        html.lang = lang;
        html.dir = resolveKey(dictionary, 'meta.dir') || 'ltr';

        document.querySelectorAll('*').forEach((element) => {
            if (element.hasAttribute('data-i18n')) {
                const key = element.getAttribute('data-i18n');
                const target = element.getAttribute('data-i18n-target');
                applyValue(element, resolveKey(dictionary, key), target);
            }

            Array.from(element.attributes)
                .filter((attr) => {
                    if (!attr.name.startsWith('data-i18n-')) return false;
                    return !['data-i18n', 'data-i18n-target'].includes(attr.name);
                })
                .forEach((attr) => {
                    const attributeName = attr.name.replace('data-i18n-', '');
                    applyValue(element, resolveKey(dictionary, attr.value), attributeName);
                });
        });

        const switcher = document.getElementById('langSwitcher');
        if (switcher && switcher.value !== lang) {
            switcher.value = lang;
        }

        const eventDetail = { lang, dictionary };
        document.dispatchEvent(new CustomEvent('i18n:change', { detail: eventDetail }));
        changeCallbacks.forEach((callback) => {
            try {
                callback(lang, dictionary);
            } catch (error) {
                console.error('i18n callback error:', error);
            }
        });
    };

    const loadDictionaryFromFile = async (lang) => {
        const response = await fetch(`i18n/${lang}.json`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${lang}`);
        }
        return response.json();
    };

    const loadDictionaryFromApi = async (lang) => {
        try {
            const response = await fetch(`${SITE_COPY_ENDPOINT_BASE}/${lang}`, {
                cache: 'no-store',
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            if (data && typeof data.entries === 'object') {
                return data.entries;
            }
            if (data && typeof data === 'object') {
                return data;
            }
            return null;
        } catch (error) {
            console.warn('Site copy API yüklenemedi:', error);
            return null;
        }
    };

    const loadDictionary = async (lang) => {
        if (translations[lang]) {
            return translations[lang];
        }

        const apiDictionary = await loadDictionaryFromApi(lang);
        if (apiDictionary) {
            translations[lang] = apiDictionary;
            return apiDictionary;
        }

        const fileDictionary = await loadDictionaryFromFile(lang);
        translations[lang] = fileDictionary;
        return fileDictionary;
    };

    const persistLanguage = (lang) => {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (error) {
            console.warn('i18n storage error:', error);
        }
    };

    const getStoredLanguage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && SUPPORTED_LANGS.includes(stored)) {
                return stored;
            }
        } catch (error) {
            console.warn('i18n storage error:', error);
        }
        return null;
    };

    const setLanguage = async (lang) => {
        const targetLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
        if (currentLang === targetLang && translations[targetLang]) {
            applyTranslations(targetLang);
            return;
        }
        try {
            await loadDictionary(targetLang);
            currentLang = targetLang;
            persistLanguage(targetLang);
            applyTranslations(targetLang);
        } catch (error) {
            console.error(error);
            if (targetLang !== DEFAULT_LANG) {
                await setLanguage(DEFAULT_LANG);
            }
        }
    };

    const init = async () => {
        const storedLang = getStoredLanguage();
        const initialLang = storedLang || DEFAULT_LANG;
        await setLanguage(initialLang);
        const switcher = document.getElementById('langSwitcher');
        if (switcher) {
            switcher.addEventListener('change', (event) => {
                setLanguage(event.target.value);
            });
        }
    };

    const onChange = (callback) => {
        if (typeof callback === 'function') {
            changeCallbacks.add(callback);
        }
        if (translations[currentLang]) {
            callback(currentLang, translations[currentLang]);
        }
    };

    window.I18N = {
        setLanguage,
        getCurrentLanguage: () => currentLang,
        onChange,
        translate: (key) => resolveKey(translations[currentLang], key),
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
