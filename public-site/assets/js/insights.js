(function () {
    const API_ENDPOINT = '/api/content';
    const visualThemes = [
        'radial-gradient(circle at 22% 30%, rgba(255, 206, 165, 0.8) 0%, rgba(255, 206, 165, 0) 55%), radial-gradient(circle at 78% 65%, rgba(255, 126, 126, 0.45) 0%, rgba(255, 126, 126, 0) 50%), linear-gradient(150deg, #1e1f2d, #101019 58%, #2e2439)',
        'radial-gradient(circle at 70% 30%, rgba(160, 214, 255, 0.7) 0%, rgba(160, 214, 255, 0) 55%), radial-gradient(circle at 18% 70%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 60%), linear-gradient(160deg, #1a2334, #0f131d 60%, #2a3245)',
        'radial-gradient(circle at 25% 70%, rgba(255, 174, 226, 0.55) 0%, rgba(255, 174, 226, 0) 50%), radial-gradient(circle at 78% 25%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 60%), linear-gradient(165deg, #141522, #1c1f31 58%, #322544)',
        'radial-gradient(circle at 80% 20%, rgba(140, 255, 210, 0.55) 0%, rgba(140, 255, 210, 0) 55%), radial-gradient(circle at 18% 75%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 60%), linear-gradient(170deg, #101d1c, #142932 60%, #273b4a)',
    ];

    const listElement = document.getElementById('insights-list');
    const template = document.getElementById('insight-card-template');
    const loadingElement = document.getElementById('insights-loading');
    const emptyElement = document.getElementById('insights-empty');
    const errorElement = document.getElementById('insights-error');

    if (!listElement || !template) {
        return;
    }

    let cache = [];
    let hasLoadedOnce = false;
    let isFetching = false;
    let hasError = false;

    const setHidden = (element, hidden) => {
        if (!element) return;
        element.hidden = hidden;
        element.setAttribute('data-visible', hidden ? 'false' : 'true');
        if (hidden) {
            element.setAttribute('aria-hidden', 'true');
        } else {
            element.removeAttribute('aria-hidden');
        }
    };

    const setState = (state) => {
        const states = {
            loading: loadingElement,
            empty: emptyElement,
            error: errorElement,
        };

        Object.entries(states).forEach(([key, element]) => {
            setHidden(element, state !== key);
        });

        hasError = state === 'error';
    };

    const normalizeLanguage = (value) => {
        if (typeof value !== 'string') {
            return '';
        }
        return value.trim().toLowerCase();
    };

    const getActiveLanguage = () => {
        if (window.I18N && typeof window.I18N.getCurrentLanguage === 'function') {
            return window.I18N.getCurrentLanguage();
        }
        return document.documentElement.lang || 'tr';
    };

    const filterByLanguage = (items, lang) => {
        const activeLang = normalizeLanguage(lang) || 'tr';
        return items.filter((item) => {
            const itemLang = normalizeLanguage(item && item.language);
            if (!itemLang || itemLang === 'multi') {
                return true;
            }
            return itemLang === activeLang;
        });
    };

    const formatDate = (dateString, lang) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const normalizedLang = normalizeLanguage(lang) || 'tr';
        const localeMap = {
            tr: 'tr-TR',
            en: 'en-GB',
        };
        const locale = localeMap[normalizedLang] || 'tr-TR';

        try {
            return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch (error) {
            console.warn('Date formatting failed:', error);
            return date.toLocaleString();
        }
    };

    const stripHtml = (value) => {
        if (typeof value !== 'string') {
            return '';
        }
        return value.replace(/<[^>]*>/g, ' ');
    };

    const getExcerpt = (value, limit = 240) => {
        const text = stripHtml(value).replace(/\s+/g, ' ').trim();
        if (!text) {
            return '';
        }
        if (text.length <= limit) {
            return text;
        }
        const truncated = text.slice(0, limit).replace(/\s+\S*$/, '');
        return `${truncated.trim()}…`;
    };

    const getLanguageLabel = (code) => {
        const normalized = normalizeLanguage(code);
        if (!normalized) {
            return '';
        }
        if (normalized === 'multi') {
            if (window.I18N && typeof window.I18N.translate === 'function') {
                const multiLabel = window.I18N.translate('insights.feed.multiBadge');
                if (multiLabel) {
                    return multiLabel;
                }
            }
            return 'TR · EN';
        }
        if (window.I18N && typeof window.I18N.translate === 'function') {
            const translated = window.I18N.translate(`common.language.${normalized}`);
            if (translated) {
                return translated;
            }
        }
        return normalized.toUpperCase();
    };

    const applyVisual = (element, index) => {
        if (!element) return;
        const theme = visualThemes[index % visualThemes.length];
        element.style.backgroundImage = theme;
    };

    const render = (lang) => {
        const items = Array.isArray(cache) ? cache : [];
        const filtered = filterByLanguage(items, lang);
        listElement.innerHTML = '';

        if (filtered.length === 0) {
            return 0;
        }

        filtered.forEach((content, index) => {
            const fragment = template.content.cloneNode(true);
            const article = fragment.querySelector('article');
            const visual = fragment.querySelector('[data-role="visual"]');
            const dateElement = fragment.querySelector('[data-role="date"]');
            const languageElement = fragment.querySelector('[data-role="language"]');
            const titleElement = fragment.querySelector('[data-role="title"]');
            const excerptElement = fragment.querySelector('[data-role="excerpt"]');

            if (article && content && content._id) {
                article.setAttribute('data-content-id', content._id);
            }

            applyVisual(visual, index);

            if (dateElement) {
                const formattedDate = formatDate(content && (content.date || content.createdAt), lang);
                if (formattedDate) {
                    dateElement.textContent = formattedDate;
                    const isoSource = content && (content.date || content.createdAt);
                    if (isoSource) {
                        const isoDate = new Date(isoSource);
                        if (!Number.isNaN(isoDate.getTime())) {
                            dateElement.setAttribute('datetime', isoDate.toISOString());
                        }
                    }
                } else {
                    dateElement.textContent = '';
                }
            }

            if (languageElement) {
                const label = getLanguageLabel(content && content.language);
                if (label) {
                    languageElement.textContent = label;
                    languageElement.hidden = false;
                } else {
                    languageElement.textContent = '';
                    languageElement.hidden = true;
                }
            }

            if (titleElement) {
                titleElement.textContent = (content && content.title) || '';
            }

            if (excerptElement) {
                const excerpt = getExcerpt(content && content.body);
                excerptElement.textContent = excerpt;
            }

            listElement.appendChild(fragment);
        });

        return filtered.length;
    };

    const fetchContents = async () => {
        if (isFetching) {
            return;
        }
        isFetching = true;
        setState('loading');

        try {
            const response = await fetch(API_ENDPOINT, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to load content: ${response.status}`);
            }

            const data = await response.json();
            cache = Array.isArray(data) ? data : [];
            hasLoadedOnce = true;

            const count = render(getActiveLanguage());
            if (count === 0) {
                setState('empty');
            } else {
                setState(null);
            }
        } catch (error) {
            console.error('İçerikler alınamadı:', error);
            if (!hasLoadedOnce) {
                listElement.innerHTML = '';
            }
            setState('error');
        } finally {
            isFetching = false;
        }
    };

    const handleLanguageChange = (lang) => {
        if (!hasLoadedOnce) {
            return;
        }
        const count = render(lang || getActiveLanguage());
        if (!hasError) {
            if (count === 0) {
                setState('empty');
            } else {
                setState(null);
            }
        }
    };

    const init = () => {
        fetchContents();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    document.addEventListener('i18n:change', (event) => {
        handleLanguageChange(event && event.detail && event.detail.lang);
    });

    if (window.I18N && typeof window.I18N.onChange === 'function') {
        window.I18N.onChange((lang) => {
            handleLanguageChange(lang);
        });
    }
})();
