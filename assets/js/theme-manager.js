/* ===========================
   THEME MANAGER - Light/Dark Mode
   =========================== */

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'theme-preference';
    this.DARK_THEME = 'dark';
    this.LIGHT_THEME = 'light';
    this.init();
  }

  init() {
    this.loadTheme();
    this.setupToggle();
    this.observeSystemPreference();
  }

  loadTheme() {
    // Try to get saved preference
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? this.DARK_THEME : this.LIGHT_THEME);
    }
  }

  setTheme(theme) {
    const element = document.documentElement;
    const body = document.body;
    const isDark = theme === this.DARK_THEME;

    element.classList.toggle('dark', isDark);
    element.setAttribute('data-theme', theme);
    element.style.colorScheme = isDark ? 'dark' : 'light';

    if (body) {
      body.classList.toggle('dark', isDark);
      body.setAttribute('data-theme', theme);
      body.style.colorScheme = isDark ? 'dark' : 'light';
    }
    
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateToggleButton(theme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('dark') 
      ? this.DARK_THEME 
      : this.LIGHT_THEME;
    
    const newTheme = currentTheme === this.DARK_THEME 
      ? this.LIGHT_THEME 
      : this.DARK_THEME;
    
    this.setTheme(newTheme);
  }

  setupToggle() {
    // Remove any existing toggle buttons to avoid duplicates
    const existingToggle = document.querySelector('.theme-toggle');
    if (existingToggle) {
      existingToggle.remove();
    }

    // Create toggle button
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Alternar tema claro/escuro');
    button.setAttribute('title', 'Alternar tema claro/escuro');
    
    document.body.appendChild(button);
    
    // Update icon
    this.updateToggleButton(
      document.documentElement.classList.contains('dark') 
        ? this.DARK_THEME 
        : this.LIGHT_THEME
    );
    
    // Add click listener
    button.addEventListener('click', () => this.toggleTheme());
    
    // Add keyboard shortcut (Ctrl/Cmd + Shift + T)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  updateToggleButton(theme) {
    const button = document.querySelector('.theme-toggle');
    if (button) {
      if (theme === this.DARK_THEME) {
        button.innerHTML = '☀️'; // Sun icon for light mode
        button.setAttribute('title', 'Mudar para tema claro');
      } else {
        button.innerHTML = '🌙'; // Moon icon for dark mode
        button.setAttribute('title', 'Mudar para tema escuro');
      }
    }
  }

  observeSystemPreference() {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      if (!savedTheme) {
        this.setTheme(e.matches ? this.DARK_THEME : this.LIGHT_THEME);
      }
    });
  }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
  });
} else {
  new ThemeManager();
}
