(function () {
    const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
    const DEFAULT_API_BASE = '/api';
    const DEFAULT_CONTENT_ENDPOINT = `${DEFAULT_API_BASE}/content`;

    const readMetaContent = (name) => {
        const element = document.querySelector(`meta[name="${name}"]`);
        if (!element) return '';
        return element.getAttribute('content') || '';
    };

    const sanitizeEndpoint = (value) => {
        if (typeof value !== 'string') {
            return '';
        }
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }
        if (ABSOLUTE_URL_REGEX.test(trimmed)) {
            return trimmed.replace(/\/+$/, '');
        }
        return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
    };

    const normalizeBase = (value) => {
        if (typeof value !== 'string') {
            return '';
        }
        const trimmed = value.trim();
        if (!trimmed || trimmed === '/') {
            return '';
        }
        if (ABSOLUTE_URL_REGEX.test(trimmed)) {
            return trimmed.replace(/\/+$/, '');
        }
        return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
    };

    const buildEndpointFromBase = (base) => {
        const normalized = normalizeBase(base);
        if (!normalized) {
            return '';
        }
        return `${normalized}/content`;
    };

    const getSiteConfig = () => {
        const config = window.__SITE_CONFIG__;
        if (!config || typeof config !== 'object') {
            return null;
        }
        return config;
    };

    const resolveContentEndpoint = () => {
        const config = getSiteConfig();
        const configEndpoint = sanitizeEndpoint(config && config.contentEndpoint);
        const configBase = config && config.contentApiBase;
        const metaEndpoint = sanitizeEndpoint(
            readMetaContent('portfolio:content-endpoint') ||
                readMetaContent('projects:content-endpoint') ||
                readMetaContent('content:endpoint') ||
                readMetaContent('insights:content-endpoint')
        );
        const metaBase =
            readMetaContent('portfolio:content-api-base') ||
            readMetaContent('projects:content-api-base') ||
            readMetaContent('content:api-base') ||
            readMetaContent('insights:content-api-base');

        return (
            configEndpoint ||
            buildEndpointFromBase(configBase) ||
            metaEndpoint ||
            buildEndpointFromBase(metaBase) ||
            DEFAULT_CONTENT_ENDPOINT
        );
    };

    const API_ENDPOINT = resolveContentEndpoint();
    let apiOrigin = '';
    try {
        const endpointUrl = new URL(API_ENDPOINT, window.location.origin);
        apiOrigin = endpointUrl.origin;
    } catch (error) {
        apiOrigin = window.location.origin;
    }
    const fallbackProjectTypeLabels = {
        workplace: 'Ofis Projesi',
        residential: 'Konut Projesi',
        hospitality: 'Misafirperverlik',
        concept: 'Konsept Çalışması',
    };

    const visualThemes = [
        'radial-gradient(circle at 22% 30%, rgba(255, 206, 165, 0.8) 0%, rgba(255, 206, 165, 0) 55%), radial-gradient(circle at 78% 65%, rgba(255, 126, 126, 0.45) 0%, rgba(255, 126, 126, 0) 50%), linear-gradient(150deg, #1e1f2d, #101019 58%, #2e2439)',
        'radial-gradient(circle at 70% 30%, rgba(160, 214, 255, 0.7) 0%, rgba(160, 214, 255, 0) 55%), radial-gradient(circle at 18% 70%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 60%), linear-gradient(160deg, #1a2334, #0f131d 60%, #2a3245)',
        'radial-gradient(circle at 25% 70%, rgba(255, 174, 226, 0.55) 0%, rgba(255, 174, 226, 0) 50%), radial-gradient(circle at 78% 25%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 60%), linear-gradient(165deg, #141522, #1c1f31 58%, #322544)',
        'radial-gradient(circle at 80% 20%, rgba(140, 255, 210, 0.55) 0%, rgba(140, 255, 210, 0) 55%), radial-gradient(circle at 18% 75%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 60%), linear-gradient(170deg, #101d1c, #142932 60%, #273b4a)',
    ];

    const listElement = document.getElementById('portfolio-list');
    const template = document.getElementById('portfolio-card-template');
    const loadingElement = document.getElementById('portfolio-loading');
    const emptyElement = document.getElementById('portfolio-empty');
    const errorElement = document.getElementById('portfolio-error');
    const filtersContainer = document.getElementById('portfolio-type-filters');

    if (!listElement || !template) {
        return;
    }

    let cache = [];
    let hasLoadedOnce = false;
    let isFetching = false;
    let hasError = false;
    let activeTypeFilter = 'all';

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

    const updateFilterButtons = () => {
        if (!filtersContainer) {
            return;
        }
        const buttons = filtersContainer.querySelectorAll('[data-filter]');
        buttons.forEach((button) => {
            const value = normalizeFilterValue(button.getAttribute('data-filter'));
            const isActive = value === activeTypeFilter;
            button.setAttribute('data-active', isActive ? 'true' : 'false');
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            button.classList.toggle('border-white/70', isActive);
            button.classList.toggle('text-white', isActive);
            button.classList.toggle('border-white/25', !isActive);
            button.classList.toggle('text-white/80', !isActive);
        });
    };

    const setTypeFilter = (value) => {
        const normalized = normalizeFilterValue(value);
        if (normalized === activeTypeFilter) {
            return;
        }
        activeTypeFilter = normalized;
        updateFilterButtons();
        if (!hasLoadedOnce) {
            return;
        }
        const count = render(getActiveLanguage());
        if (!hasError) {
            if (count === 0) {
                setState('empty');
            } else {
                setState(null);
            }
        }
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

    const normalizeProjectType = (value) => {
        if (typeof value !== 'string') {
            return 'workplace';
        }
        const normalized = value.trim().toLowerCase();
        if (!normalized) {
            return 'workplace';
        }
        return normalized;
    };

    const normalizeFilterValue = (value) => {
        if (typeof value !== 'string') {
            return 'all';
        }
        const normalized = value.trim().toLowerCase();
        if (!normalized) {
            return 'all';
        }
        return normalized;
    };

    const filterByType = (items, type) => {
        const normalizedType = normalizeFilterValue(type);
        if (normalizedType === 'all') {
            return items;
        }
        return items.filter((item) => normalizeProjectType(item && item.projectType) === normalizedType);
    };

    const getProjectTypeLabel = (code) => {
        const normalized = normalizeProjectType(code);
        if (window.I18N && typeof window.I18N.translate === 'function') {
            const translated = window.I18N.translate(`content.projectTypes.${normalized}`);
            if (translated) {
                return translated;
            }
        }
        return fallbackProjectTypeLabels[normalized] || fallbackProjectTypeLabels.workplace;
    };

    const getLanguageLabel = (code) => {
        const normalized = normalizeLanguage(code);
        if (!normalized) {
            return '';
        }
        if (normalized === 'multi') {
            if (window.I18N && typeof window.I18N.translate === 'function') {
                const multiLabel = window.I18N.translate('content.language.multi');
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

    const resolvePhotoUrl = (content) => {
        if (!content || !content.image || typeof content.image.url !== 'string') {
            return '';
        }
        const trimmed = content.image.url.trim();
        if (!trimmed) {
            return '';
        }
        if (ABSOLUTE_URL_REGEX.test(trimmed)) {
            return trimmed;
        }
        if (trimmed.startsWith('/')) {
            return `${apiOrigin}${trimmed}`;
        }
        return `${apiOrigin}/${trimmed}`.replace(/([^:]\/)\/+/g, '$1');
    };

    const applyVisual = (element, index, photoUrl) => {
        if (!element) return;

        if (photoUrl) {
            element.style.backgroundImage = `linear-gradient(145deg, rgba(2, 6, 23, 0.45), rgba(0, 0, 0, 0.65)), url('${photoUrl}')`;
            element.setAttribute('data-has-photo', 'true');
            return;
        }

        const theme = visualThemes[index % visualThemes.length];
        element.style.backgroundImage = theme;
        element.removeAttribute('data-has-photo');
    };

    const render = (lang) => {
        const items = Array.isArray(cache) ? cache : [];
        const filtered = filterByType(filterByLanguage(items, lang), activeTypeFilter);
        listElement.innerHTML = '';

        if (filtered.length === 0) {
            return 0;
        }

        filtered.forEach((content, index) => {
            const fragment = template.content.cloneNode(true);
            const article = fragment.querySelector('article');
            const visual = fragment.querySelector('[data-role="visual"]');
            const typeElement = fragment.querySelector('[data-role="project-type"]');
            const dateElement = fragment.querySelector('[data-role="date"]');
            const languageElement = fragment.querySelector('[data-role="language"]');
            const titleElement = fragment.querySelector('[data-role="title"]');
            const excerptElement = fragment.querySelector('[data-role="excerpt"]');

            if (article && content && content._id) {
                article.setAttribute('data-content-id', content._id);
            }

            const photoUrl = resolvePhotoUrl(content);
            applyVisual(visual, index, photoUrl);

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

            if (typeElement) {
                const label = getProjectTypeLabel(content && content.projectType);
                if (label) {
                    typeElement.textContent = label;
                    typeElement.hidden = false;
                } else {
                    typeElement.textContent = '';
                    typeElement.hidden = true;
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

    if (filtersContainer) {
        filtersContainer.addEventListener('click', (event) => {
            const target = event.target.closest('[data-filter]');
            if (!target) {
                return;
            }
            event.preventDefault();
            setTypeFilter(target.getAttribute('data-filter'));
        });
    }

    const init = () => {
        updateFilterButtons();
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
