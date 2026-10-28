'use client';

import { useEffect } from 'react';

export function ReadingThemeInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedScale = localStorage.getItem('applyfields_text_scale');
      if (savedScale === 'medium') {
        document.documentElement.style.fontSize = '18px';
      } else if (savedScale === 'large') {
        document.documentElement.style.fontSize = '20px';
      } else {
        document.documentElement.style.fontSize = '16px';
      }

      const savedTheme = localStorage.getItem('applyfields_reading_theme');
      if (savedTheme && (savedTheme === 'sepia' || savedTheme === 'high-contrast')) {
        document.documentElement.setAttribute('data-reading-theme', savedTheme);
      } else {
        document.documentElement.removeAttribute('data-reading-theme');
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  return null;
}

