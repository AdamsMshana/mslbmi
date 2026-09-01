// ==========================================
// BodyLytics – Main JavaScript
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // ---------- Theme Toggle ----------
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const storedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', storedTheme);
    updateThemeToggle(storedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeToggle(newTheme);
    });

    function updateThemeToggle(theme) {
        const isLight = theme === 'light';
        themeToggle.setAttribute('aria-pressed', isLight);
        themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    }

    // ---------- Mobile Navigation ----------
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const primaryNav = document.getElementById('primary-nav');

    if (hamburgerBtn && primaryNav) {
        hamburgerBtn.addEventListener('click', () => {
            const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
            hamburgerBtn.setAttribute('aria-expanded', !isExpanded);
            primaryNav.classList.toggle('active');
            document.body.style.overflow = isExpanded ? '' : 'hidden';
        });

        // Close menu on link click
        primaryNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        // Close menu on outside click
        document.addEventListener('click', (event) => {
            const isNavClick = primaryNav.contains(event.target);
            const isHamburgerClick = hamburgerBtn.contains(event.target);
            if (!isNavClick && !isHamburgerClick && primaryNav.classList.contains('active')) {
                closeMobileMenu();
            }
        });

        // Close menu on Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && primaryNav.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    }

    function closeMobileMenu() {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        primaryNav.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ---------- Active Navigation Link Highlight ----------
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.header__nav-link');
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('header__nav-link--active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    // ---------- Card Click Effects (Active State) ----------
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('mousedown', () => card.classList.add('card-pressed'));
        card.addEventListener('mouseup', () => card.classList.remove('card-pressed'));
        card.addEventListener('mouseleave', () => card.classList.remove('card-pressed'));
    });

    // ---------- Intersection Observer for Scroll Animations ----------
    const animatedElements = document.querySelectorAll('[data-animate]');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
        animatedElements.forEach(el => observer.observe(el));
    }

    // ---------- Smooth Scroll for Anchor Links (except tool cards) ----------
    document.querySelectorAll('a[href^="#"]:not(.tool-card)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---------- Footer year auto-update ----------
    const yearSpan = document.querySelector('.footer__copyright');
    if (yearSpan) {
        const currentYear = new Date().getFullYear();
        yearSpan.textContent = yearSpan.textContent.replace('2025', currentYear);
    }
});