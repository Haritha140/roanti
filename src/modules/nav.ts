import { appState } from '../main';

export function initNav() {
    const themeToggle = document.getElementById('theme-toggle')!;
    const mobileMenuBtn = document.getElementById('mobile-menu-btn')!;
    const nav = document.getElementById('main-nav')!;

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        appState.theme = newTheme;
        themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    });

    // Mobile menu
    let mobileMenu: HTMLElement | null = null;
    mobileMenuBtn.addEventListener('click', () => {
        if (!mobileMenu) {
            mobileMenu = document.createElement('div');
            mobileMenu.className = 'mobile-menu';
            mobileMenu.innerHTML = `
        <a href="#hero">Home</a>
        <a href="#upload-section">Upload</a>
        <a href="#slider-section">Designs</a>
        <a href="#color-section">Colors</a>
        <a href="#furniture-section">Furniture</a>
        <a href="#budget-section">Budget</a>
        <a href="#room3d-section">3D View</a>
        <a href="#report-section">Report</a>
      `;
            nav.after(mobileMenu);

            mobileMenu.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', () => {
                    mobileMenu!.classList.remove('active');
                });
            });
        }

        mobileMenu.classList.toggle('active');
        mobileMenuBtn.textContent = mobileMenu.classList.contains('active') ? '✕' : '☰';
    });

    // Nav shrink on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.padding = '0';
        } else {
            nav.style.padding = '';
        }
    });

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                const target = document.querySelector(href);
                target?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}
