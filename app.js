(() => {
    const content = document.getElementById("page-content");
    const links = document.querySelectorAll(".nav-link");

    const pageNames = {
        "/index.html": "home",
        "/": "home",
        "/pages/projects.html": "projects",
        "/pages/about.html": "about"
    };

    function pageKey(url) {
        const path = new URL(url, window.location.origin).pathname;
        return pageNames[path] || null;
    }

    function updateActiveLink(url = window.location.href) {
        const active = pageKey(url);
        links.forEach(link => {
            const isActive = link.dataset.page === active;
            link.classList.toggle("active", isActive);
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }

    function transitionTo(html) {
        content.classList.remove("page-enter");
        content.classList.add("page-exit");

        window.setTimeout(() => {
            content.innerHTML = html;
            content.scrollTop = 0;
            window.scrollTo({ top: 0, behavior: "instant" });
            content.classList.remove("page-exit");
            content.classList.add("page-enter");
        }, 180);
    }

    async function navigate(url, pushState = true) {
        if (url === window.location.href) return;

        try {
            const response = await fetch(url, { headers: { "X-Requested-With": "SPA" } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            const documentParser = new DOMParser();
            const nextDocument = documentParser.parseFromString(html, "text/html");
            const nextContent = nextDocument.querySelector(".content");

            if (!nextContent) throw new Error("The requested page has no .content element.");

            transitionTo(nextContent.innerHTML);

            if (pushState) history.pushState({}, "", url);
            document.title = nextDocument.title || "Rollerblade Official Website";
            updateActiveLink(url);
        } catch (error) {
            console.error("SPA navigation failed:", error);
            window.location.href = url;
        }
    }

    links.forEach(link => {
        link.addEventListener("click", event => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            navigate(link.href);
        });
    });

    window.addEventListener("popstate", () => {
        navigate(window.location.href, false);
    });

    updateActiveLink();
})();
