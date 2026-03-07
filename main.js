(function initPageTransitions() {
    window.addEventListener("popstate", () => {
        document.body.classList.add("page-exit");
        setTimeout(() => { window.location.reload(); }, 50);
    });
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (
            !href ||
            href.startsWith('#') ||
            href.startsWith('http') ||
            href.startsWith('mailto') ||
            anchor.target === '_blank'
        ) return;

        e.preventDefault();
        document.body.classList.add('page-exit');
        setTimeout(() => { window.location.href = href; }, 300);
    });
})();

(function initFadeUp() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
})();

(function initHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
})();

(function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    if (!hamburger || !mobileNav) return;

    function openNav() {
        hamburger.classList.add('open');
        mobileNav.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeNav() {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
        mobileNav.classList.contains('open') ? closeNav() : openNav();
    });

    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

    window.closeMobileNav = closeNav;
})();

(function initOrbTilt() {
    const visual = document.querySelector('.hero-visual');
    const scene = document.querySelector('.orb-scene');
    if (!visual || !scene) return;

    visual.addEventListener('mousemove', (e) => {
        const rect = visual.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        scene.style.transform = `rotateY(${dx * 22}deg) rotateX(${-dy * 22}deg)`;
    });

    visual.addEventListener('mouseleave', () => {
        scene.style.transform = '';
    });
})();

(function initActiveNav() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach((a) => {
        const linkPage = a.getAttribute('href')?.split('/').pop()?.split('#')[0] || '';
        if (linkPage === page) a.classList.add('nav-active');
    });
})();

(function initCharCounter() {
    const textarea = document.getElementById('task-input');
    const counter = document.getElementById('char-counter');
    const submitBtn = document.getElementById('submit-btn');
    if (!textarea) return;

    textarea.addEventListener('input', () => {
        const raw = textarea.value;
        const trimmed = raw.trim().length;
        if (counter) counter.textContent = raw.length;
        if (submitBtn) submitBtn.disabled = trimmed < 10;
    });
})();

(function initChips() {
    const textarea = document.getElementById('task-input');
    const counter = document.getElementById('char-counter');
    const submitBtn = document.getElementById('submit-btn');
    if (!textarea) return;

    document.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            textarea.value = chip.dataset.text;
            if (counter) counter.textContent = chip.dataset.text.length;
            if (submitBtn) submitBtn.disabled = false;
            textarea.focus();
        });
    });
})();

(function initClear() {
    const clearBtn = document.getElementById('clear-btn');
    if (!clearBtn) return;

    clearBtn.addEventListener('click', () => {
        document.getElementById('results')?.classList.remove('active');
        document.getElementById('error-card')?.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

(function initSubmit() {
    const submitBtn = document.getElementById('submit-btn');
    if (!submitBtn) return;

    const textarea = document.getElementById('task-input');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const errorCard = document.getElementById('error-card');

    submitBtn.addEventListener('click', async () => {
        const text = textarea.value.trim();
        if (!text) return;

        results?.classList.remove('active');
        errorCard?.classList.remove('active');
        loading?.classList.add('active');
        submitBtn.disabled = true;

        try {
            const res = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            renderResults(await res.json());
        } catch (err) {
            errorCard?.classList.add('active');
            const errMsg = document.getElementById('error-msg');
            if (errMsg) errMsg.textContent =
                err.message || 'Connection failed. Make sure the backend is running on port 8000.';
        } finally {
            loading?.classList.remove('active');
            submitBtn.disabled = false;
        }
    });

    /* ── RENDER ── */
    function renderResults(data) {
        const decision = (data.decision || '').trim();
        const responsibility = (data.responsibility || '').trim();
        const explanation = (data.explanation || '').trim();
        const dec = decision.toLowerCase();

        /* Verdict banner */
        const banner = document.getElementById('verdict-banner');
        const icon = document.getElementById('verdict-icon');
        const verdictText = document.getElementById('verdict-text');

        banner.className = 'verdict-banner';
        icon.className = 'verdict-icon';
        verdictText.className = 'verdict-text';

        if (dec.includes('not')) {
            banner.classList.add('verdict-red');
            icon.classList.add('icon-red');
            icon.textContent = '✕';
            verdictText.classList.add('text-red');
        } else if (dec.includes('loop') || dec.includes('human')) {
            banner.classList.add('verdict-amber');
            icon.classList.add('icon-amber');
            icon.textContent = '⚠';
            verdictText.classList.add('text-amber');
        } else {
            banner.classList.add('verdict-green');
            icon.classList.add('icon-green');
            icon.textContent = '✓';
            verdictText.classList.add('text-green');
        }
        verdictText.textContent = decision;

        /* Responsibility */
        const respEl = document.getElementById('responsibility-val');
        if (respEl) respEl.textContent = cap(responsibility);

        /* Classification */
        const classEl = document.getElementById('classification-val');
        if (classEl) {
            classEl.textContent =
                dec.includes('not') ? 'Prohibited Automation' :
                    (dec.includes('loop') || dec.includes('human')) ? 'Supervised Automation' :
                        'Safe for Full Automation';
        }

        /* Explanation */
        const expEl = document.getElementById('explanation-val');
        if (expEl) expEl.textContent = explanation;

        results.classList.add('active');
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function cap(s) {
        if (!s) return '—';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
})();