import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  init: () => void;
  toggle: () => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',

  init: () => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const theme: Theme = saved ?? 'dark';
    applyTheme(theme);
    set({ theme });
  },

  toggle: () => {
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
      return { theme: next };
    });
  },
}));
