(function () {
    const STORAGE_KEY = 'alpimimarlik-cookie-consent';

    const getStoredPreference = () => {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Cookie consent storage read failed:', error);
            return null;
        }
    };

    const storePreference = (value) => {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (error) {
            console.warn('Cookie consent storage write failed:', error);
        }
    };

    const hideBanner = (banner) => {
        banner.setAttribute('data-visible', 'false');
        banner.setAttribute('aria-hidden', 'true');
        banner.hidden = true;
    };

    const showBanner = (banner) => {
        banner.hidden = false;
        banner.setAttribute('aria-hidden', 'false');
        banner.setAttribute('data-visible', 'true');
    };

    const init = () => {
        const banner = document.getElementById('cookie-banner');
        if (!banner) {
            return;
        }

        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');

        const acceptButton = banner.querySelector('[data-action="accept"]');
        const declineButton = banner.querySelector('[data-action="decline"]');

        if (!acceptButton || !declineButton) {
            return;
        }

        const stored = getStoredPreference();
        if (!stored) {
            if (document.readyState === 'complete') {
                showBanner(banner);
            } else {
                window.addEventListener(
                    'load',
                    () => {
                        showBanner(banner);
                    },
                    { once: true }
                );
            }
        }

        acceptButton.addEventListener('click', () => {
            storePreference('accepted');
            hideBanner(banner);
        });

        declineButton.addEventListener('click', () => {
            storePreference('declined');
            hideBanner(banner);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
