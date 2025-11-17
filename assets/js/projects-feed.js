(function () {
    const feedElement = document.getElementById('project-feed');
    const template = document.getElementById('project-card-template');
    const loadingElement = document.getElementById('project-feed-loading');
    const emptyElement = document.getElementById('project-feed-empty');
    const errorElement = document.getElementById('project-feed-error');

    if (!feedElement || !template) {
        return;
    }

    const parseFeedLimit = () => {
        const attr = feedElement.getAttribute('data-feed-limit');
        if (typeof attr !== 'string') {
            return 3;
        }
        const normalized = attr.trim().toLowerCase();
        if (!normalized) {
            return 3;
        }
        if (normalized === 'all' || normalized === 'full' || normalized === 'infinity') {
            return Infinity;
        }
        const numeric = Number.parseInt(normalized, 10);
        if (Number.isNaN(numeric) || numeric <= 0) {
            return 3;
        }
        return numeric;
    };

    const feedLimit = parseFeedLimit();

    const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
    const DEFAULT_API_BASE = 'https://alpermorkoc-production.up.railway.app/api';
    const DEFAULT_CONTENT_ENDPOINT = `${DEFAULT_API_BASE}/content`;
    const fallbackProjectTypeLabels = {
        workplace: 'Ofis Projesi',
        residential: 'Konut Projesi',
        hospitality: 'Misafirperverlik',
        concept: 'Konsept Çalışması',
    };
    const visualThemes = [
        'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.18), rgba(0, 0, 0, 0)), linear-gradient(135deg, #1f2937, #0f172a)',
        'radial-gradient(circle at 70% 60%, rgba(45, 212, 191, 0.35), rgba(0, 0, 0, 0)), linear-gradient(160deg, #0f172a, #1e293b)',
        'radial-gradient(circle at 20% 80%, rgba(248, 113, 113, 0.4), rgba(0, 0, 0, 0)), linear-gradient(145deg, #1c1917, #0f172a)'
    ];

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

    const collectContentEndpointCandidates = () => {
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

        return [
            configEndpoint,
            buildEndpointFromBase(configBase),
            metaEndpoint,
            buildEndpointFromBase(metaBase),
            DEFAULT_CONTENT_ENDPOINT,
        ].filter(Boolean);
    };

    const endpointCandidates = Array.from(new Set(collectContentEndpointCandidates()));

    let activeEndpointIndex = 0;
    let API_ENDPOINT = endpointCandidates[activeEndpointIndex] || DEFAULT_CONTENT_ENDPOINT;

    const computeApiOrigin = (endpoint) => {
        try {
            const endpointUrl = new URL(endpoint, window.location.origin);
            return endpointUrl.origin;
        } catch (error) {
            return window.location.origin;
        }
    };

    let apiOrigin = computeApiOrigin(API_ENDPOINT);

    const setActiveEndpoint = (endpoint) => {
        API_ENDPOINT = endpoint;
        apiOrigin = computeApiOrigin(endpoint);
    };

    const getEndpointFetchOrder = () => {
        if (endpointCandidates.length === 0) {
            endpointCandidates.push(DEFAULT_CONTENT_ENDPOINT);
        }

        if (activeEndpointIndex <= 0) {
            return endpointCandidates.slice();
        }

        return [
            ...endpointCandidates.slice(activeEndpointIndex),
            ...endpointCandidates.slice(0, activeEndpointIndex),
        ];
    };

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

    const getActiveLanguage = () => {
        if (window.I18N && typeof window.I18N.getCurrentLanguage === 'function') {
            return window.I18N.getCurrentLanguage();
        }
        return document.documentElement.lang || 'tr';
    };

    const normalizeLanguage = (value) => {
        if (typeof value !== 'string') {
            return '';
        }
        return value.trim().toLowerCase();
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

    const stripHtml = (value) => {
        if (typeof value !== 'string') {
            return '';
        }
        return value.replace(/<[^>]*>/g, ' ');
    };

    const getExcerpt = (value, limit = 180) => {
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
            }).format(date);
        } catch (error) {
            return date.toLocaleDateString();
        }
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
            element.style.backgroundImage = `linear-gradient(145deg, rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url('${photoUrl}')`;
            element.setAttribute('data-has-photo', 'true');
            return;
        }
        const theme = visualThemes[index % visualThemes.length];
        element.style.backgroundImage = theme;
        element.removeAttribute('data-has-photo');
    };

    const getProjectTypeLabel = (code) => {
        const normalized = normalizeLanguage(code);
        if (!normalized) {
            return fallbackProjectTypeLabels.workplace;
        }
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

    const render = (lang) => {
        const filteredItems = filterByLanguage(Array.isArray(cache) ? cache : [], lang);
        const limited = Number.isFinite(feedLimit) ? filteredItems.slice(0, feedLimit) : filteredItems;
        feedElement.innerHTML = '';

        if (limited.length === 0) {
            return 0;
        }

        limited.forEach((content, index) => {
            const fragment = template.content.cloneNode(true);
            const article = fragment.querySelector('article');
            const visual = fragment.querySelector('[data-role="visual"]');
            const typeElement = fragment.querySelector('[data-role="project-type"]');
            const languageElement = fragment.querySelector('[data-role="language"]');
            const dateElement = fragment.querySelector('[data-role="date"]');
            const titleElement = fragment.querySelector('[data-role="title"]');
            const excerptElement = fragment.querySelector('[data-role="excerpt"]');

            if (article && content && content._id) {
                article.setAttribute('data-content-id', content._id);
            }

            const photoUrl = resolvePhotoUrl(content);
            applyVisual(visual, index, photoUrl);

            if (typeElement) {
                typeElement.textContent = getProjectTypeLabel(content && content.projectType);
            }

            if (languageElement) {
                const label = getLanguageLabel(content && content.language);
                languageElement.textContent = label;
                languageElement.hidden = !label;
            }

            if (dateElement) {
                const formattedDate = formatDate(content && (content.date || content.createdAt), lang);
                dateElement.textContent = formattedDate;
            }

            if (titleElement) {
                titleElement.textContent = (content && content.title) || '';
            }

            if (excerptElement) {
                excerptElement.textContent = getExcerpt(content && content.body);
            }

            feedElement.appendChild(fragment);
        });

        return limited.length;
    };

    const fetchContents = async () => {
        if (isFetching) {
            return;
        }
        isFetching = true;
        setState('loading');

        try {
            const fetchOrder = getEndpointFetchOrder();
            let lastError = null;
            let data = null;

            for (const endpoint of fetchOrder) {
                try {
                    const response = await fetch(endpoint, {
                        headers: { Accept: 'application/json' },
                        cache: 'no-cache',
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to load content: ${response.status}`);
                    }

                    data = await response.json();
                    const newIndex = endpointCandidates.indexOf(endpoint);
                    if (newIndex !== -1) {
                        activeEndpointIndex = newIndex;
                    } else {
                        endpointCandidates.push(endpoint);
                        activeEndpointIndex = endpointCandidates.length - 1;
                    }
                    setActiveEndpoint(endpoint);
                    break;
                } catch (error) {
                    lastError = error;
                    console.warn(`Projeler akışı ${endpoint} adresinden alınamadı:`, error);
                }
            }

            if (!data) {
                throw lastError || new Error('Projeler alınamadı.');
            }

            cache = Array.isArray(data) ? data : [];
            hasLoadedOnce = true;

            const count = render(getActiveLanguage());
            if (count === 0) {
                setState('empty');
            } else {
                setState(null);
            }
        } catch (error) {
            console.error('Projeler alınamadı:', error);
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
