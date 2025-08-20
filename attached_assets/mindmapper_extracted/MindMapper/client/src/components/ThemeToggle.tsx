import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true); // Default to dark mode

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('mapa-theme');
    if (savedTheme) {
      const isDarkMode = savedTheme === 'dark';
      setIsDark(isDarkMode);
      updateTheme(isDarkMode);
    } else {
      // Default to dark mode and save it
      updateTheme(true);
      localStorage.setItem('mapa-theme', 'dark');
    }
  }, []);

  const updateTheme = (isDarkMode: boolean) => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    updateTheme(newIsDark);
    localStorage.setItem('mapa-theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-20 p-3 rounded-full bg-slate-200/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 backdrop-blur border border-slate-300/50 dark:border-slate-600/50 hover:bg-slate-300/90 dark:hover:bg-slate-700/90 transition-all duration-200 z-30 shadow-lg"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}