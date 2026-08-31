// Loads the shared navigation from nav.html.
// This is intentionally NOT SPA navigation: normal links still reload the page.
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('nav-container');
    if (!container) return;

    const navPath = container.dataset.navPath || 'nav.html';

    try {
        const response = await fetch(navPath, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        container.innerHTML = await response.text();

        const path = window.location.pathname.replace(/\\/g, '/');
        let current = 'home';
        if (/\/pages\/projects\.html$/i.test(path)) current = 'projects';
        if (/\/pages\/about\.html$/i.test(path)) current = 'about';

        const active = container.querySelector(`[data-page="${current}"]`);
        if (active) {
            active.classList.add('active');
            active.setAttribute('aria-current', 'page');
        }
    } catch (error) {
        console.error('Could not load nav.html:', error);
    }
});
