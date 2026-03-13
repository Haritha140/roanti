import './style.css';
import { initParticles } from './modules/particles';
import { initHero3D } from './modules/hero3d';
import { initUpload } from './modules/upload';
import { initSlider } from './modules/slider';
import { initColors } from './modules/colors';
import { initFurniture } from './modules/furniture';
import { initBudget } from './modules/budget';
import { initAssistant } from './modules/assistant';
import { initRoom3D } from './modules/room3d';
import { initReport } from './modules/report';
import { initI18n } from './modules/i18n';
import { initNav } from './modules/nav';

// ====== GLOBAL APP STATE ======
export interface AppState {
  uploadedImage: HTMLImageElement | null;
  uploadedImageDataURL: string;
  roomType: string;
  designTheme: string;
  colors: {
    primaryWall: string;
    accentWall: string;
    ceiling: string;
    furniture: string;
  };
  budget: number;
  roomDimensions: { length: number; width: number; height: number };
  lighting: string;
  style: string;
  vastu: boolean;
  propertyType: string;
  selectedFurniture: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    color: string;
    dims: string;
  }>;
  language: string;
  theme: string;
  scores: {
    budget: number;
    sustainability: number;
    space: number;
    aesthetic: number;
  };
}

export const appState: AppState = {
  uploadedImage: null,
  uploadedImageDataURL: '',
  roomType: 'living',
  designTheme: 'scandinavian',
  colors: {
    primaryWall: '#E8DCD0',
    accentWall: '#4A6741',
    ceiling: '#FAFAFA',
    furniture: '#8B6F47',
  },
  budget: 500000,
  roomDimensions: { length: 15, width: 12, height: 10 },
  lighting: 'warm',
  style: 'modern',
  vastu: false,
  propertyType: 'apartment',
  selectedFurniture: [],
  language: 'en',
  theme: 'dark',
  scores: { budget: 87, sustainability: 92, space: 78, aesthetic: 95 },
};

// ====== EVENT BUS ======
type EventCallback = (...args: any[]) => void;
const eventListeners: Record<string, EventCallback[]> = {};

export function emitEvent(event: string, ...args: any[]) {
  (eventListeners[event] || []).forEach(cb => cb(...args));
}

export function onEvent(event: string, callback: EventCallback) {
  if (!eventListeners[event]) eventListeners[event] = [];
  eventListeners[event].push(callback);
}

// ====== TOAST NOTIFICATIONS ======
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNav();
  initHero3D();
  initUpload();
  initSlider();
  initColors();
  initFurniture();
  initBudget();
  initAssistant();
  initRoom3D();
  initReport();
  initI18n();

  // Scroll-based nav highlight
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const el = section as HTMLElement;
      if (window.scrollY >= el.offsetTop - 200) {
        current = el.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // Intersection observer for fade-in
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section-header, .glass-card, .furniture-card, .color-rec-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
});
