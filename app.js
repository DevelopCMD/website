const NAV_URL = '/nav.html';
const DEFAULT_PAGE = '/pages/home.html';
const HOME_PATHS = new Set(['/', '/index.html', '/pages/home.html']);

const pageContent = document.getElementById('page-content') || document.querySelector('.content');
const siteNav = document.getElementById('site-nav') || document.querySelector('.nav');

function normalizePath(path) {
    if (!path || path === '/') return DEFAULT_PAGE;
    return path.endsWith('/') ? `${path}index.html` : path;
}

function isInternalPage(url) {
    return url.origin === location.origin && (url.pathname.endsWith('.html') || url.pathname === '/');
}

async function loadNavigation() {
    if (!siteNav) return;
    const response = await fetch(NAV_URL);
    if (!response.ok) throw new Error(`Navigation failed: ${response.status}`);
    siteNav.innerHTML = await response.text();
    bindNavigation();
}

function bindNavigation() {
    siteNav?.querySelectorAll('a.nav-link').forEach(link => {
        if (link.dataset.navigationBound) return;
        link.dataset.navigationBound = 'true';
        link.addEventListener('click', event => {
            const url = new URL(link.href, location.href);
            if (!isInternalPage(url)) return;
            event.preventDefault();
            navigate(url.pathname, true);
        });
    });
}

function extractPage(text) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const content = doc.querySelector('main.content');
    if (!content) throw new Error('No main.content found in requested HTML page.');
    return { content: content.innerHTML, title: doc.title || 'Rollerblade Official Website' };
}

async function fetchPage(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Page failed: ${response.status}`);
    return extractPage(await response.text());
}

function setActiveLink(path) {
    const normalized = normalizePath(path);
    const onHome = HOME_PATHS.has(path) || HOME_PATHS.has(normalized);
    siteNav?.querySelectorAll('.nav-link').forEach(link => {
        const linkPath = new URL(link.href, location.href).pathname;
        const active = onHome ? HOME_PATHS.has(linkPath) : normalizePath(linkPath) === normalized;
        link.classList.toggle('active', active);
        active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
    });
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function navigate(path, pushHistory = false) {
    if (!pageContent) return;
    const requested = path || location.pathname;
    const normalized = normalizePath(requested);
    const current = normalizePath(location.pathname);
    const alreadyLoaded = current === normalized && pageContent.dataset.loaded === 'true';

    try {
        if (!alreadyLoaded) {
            pageContent.classList.add('page-exit');
            const page = await fetchPage(normalized);
            await sleep(130);
            pageContent.innerHTML = page.content;
            pageContent.dataset.loaded = 'true';
            document.title = page.title;
            pageContent.classList.remove('page-exit');
            pageContent.classList.add('page-enter');
            requestAnimationFrame(() => requestAnimationFrame(() => pageContent.classList.remove('page-enter')));
        }
        if (pushHistory && normalized !== current) history.pushState({ path: normalized }, '', normalized);
        setActiveLink(normalized);
    } catch (error) {
        console.error(error);
        pageContent.classList.remove('page-exit', 'page-enter');
        pageContent.innerHTML = '<section class="page-error"><h1>Something went wrong</h1><p>We could not load this page.</p></section>';
    }
}

window.addEventListener('popstate', () => navigate(location.pathname));

(async function initialize() {
    if (!pageContent) return;
    try {
        await loadNavigation();
        // The persistent index shell has an empty main, so load home.html.
        // Standalone pages already have content and should not fetch themselves.
        if (pageContent.children.length === 0) {
            await navigate(location.pathname, false);
        } else {
            pageContent.dataset.loaded = 'true';
            setActiveLink(location.pathname);
        }
    } catch (error) {
        console.error(error);
        pageContent.innerHTML = '<section class="page-error"><h1>Unable to load the website.</h1></section>';
    }
})();
