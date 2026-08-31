/*
 * Rollerblade website navigation
 *
 * CSP-safe: this file uses no dynamic code execution or inline handlers.
 * or dynamically generated JavaScript.
 *
 * Page content stays in separate .html files. This script only fetches
 * those documents and swaps their <main class="content"> contents.
 */

(() => {
    'use strict';

    const DEFAULT_PAGE = '/pages/home.html';
    const NAV_URL = '/nav.html';

    const pageContent = document.getElementById('page-content');
    const siteNav = document.getElementById('site-nav');

    if (!pageContent || !siteNav) {
        console.error('[site] Required navigation elements are missing.');
        return;
    }

    function normalizePath(pathname) {
        const path = pathname || '/';

        if (path === '/' || path === '/index.html') {
            return DEFAULT_PAGE;
        }

        return path;
    }

    function isInternalPage(url) {
        return (
            url.origin === window.location.origin &&
            (url.pathname === '/' || url.pathname.endsWith('.html'))
        );
    }

    function getPagePath() {
        return normalizePath(window.location.pathname);
    }

    async function getText(url) {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-cache',
            headers: {
                'Accept': 'text/html'
            }
        });

        if (!response.ok) {
            throw new Error(`Request failed (${response.status}): ${url}`);
        }

        return response.text();
    }

    function extractPage(documentText) {
        const parser = new DOMParser();
        const document = parser.parseFromString(documentText, 'text/html');
        const main = document.querySelector('main.content');

        if (!main) {
            throw new Error('The requested HTML file does not contain <main class="content">.');
        }

        return {
            html: main.innerHTML,
            title: document.title || 'Rollerblade Official Website'
        };
    }

    async function loadNavigation() {
        const html = await getText(NAV_URL);
        siteNav.innerHTML = html;

        siteNav.querySelectorAll('a.nav-link').forEach((link) => {
            link.addEventListener('click', handleNavigationClick);
        });
    }

    function handleNavigationClick(event) {
        // Only intercept normal left-click navigation. Ctrl/Cmd-click,
        // middle-click, Shift-click, etc. continue to behave normally.
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        const link = event.currentTarget;
        const url = new URL(link.href, window.location.href);

        if (!isInternalPage(url)) {
            return;
        }

        event.preventDefault();
        navigate(url.pathname, true);
    }

    function updateActiveLink(pathname) {
        const current = normalizePath(pathname);

        siteNav.querySelectorAll('a.nav-link').forEach((link) => {
            const linkPath = normalizePath(
                new URL(link.href, window.location.href).pathname
            );

            const active = linkPath === current;

            link.classList.toggle('active', active);

            if (active) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    function wait(milliseconds) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, milliseconds);
        });
    }

    async function navigate(pathname, addHistory) {
        const requestedPath = normalizePath(pathname);
        const currentPath = getPagePath();

        if (requestedPath === currentPath && pageContent.dataset.loaded === 'true') {
            updateActiveLink(requestedPath);
            return;
        }

        pageContent.classList.remove('page-enter');
        pageContent.classList.add('page-exit');

        try {
            const documentText = await getText(requestedPath);
            const page = extractPage(documentText);

            await wait(130);

            pageContent.innerHTML = page.html;
            pageContent.dataset.loaded = 'true';
            document.title = page.title;

            pageContent.classList.remove('page-exit');
            pageContent.classList.add('page-enter');

            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    pageContent.classList.remove('page-enter');
                });
            });

            if (addHistory && requestedPath !== currentPath) {
                window.history.pushState({ path: requestedPath }, '', requestedPath);
            }

            updateActiveLink(requestedPath);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('[site] Could not load page:', error);

            pageContent.classList.remove('page-exit', 'page-enter');
            pageContent.innerHTML = `
                <section class="page-error">
                    <h1>Something went wrong</h1>
                    <p>We could not load this page. Please try again.</p>
                </section>
            `;
        }
    }

    window.addEventListener('popstate', () => {
        navigate(window.location.pathname, false);
    });

    async function initialize() {
        try {
            await loadNavigation();

            // index.html deliberately contains an empty main. The actual
            // homepage is pages/home.html, just like every other page.
            await navigate(getPagePath(), false);
        } catch (error) {
            console.error('[site] Initialization failed:', error);

            pageContent.classList.remove('page-exit', 'page-enter');
            pageContent.innerHTML = `
                <section class="page-error">
                    <h1>Unable to load the website</h1>
                    <p>Please refresh the page and try again.</p>
                </section>
            `;
        }
    }

    initialize();
})();
