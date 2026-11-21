import { defineConfig, presetWind3 } from 'unocss';

export default defineConfig({
  presets: [
    presetWind3({
      dark: {
        dark: '[data-theme="dark"]',
        light: '[data-theme="light"]',
      },
    }),
  ],
  theme: {
    colors: {
      background: 'var(--background)',
      foreground: 'var(--foreground)',
      card: 'var(--card)',
      'card-foreground': 'var(--card-foreground)',
      popover: 'var(--popover)',
      'popover-foreground': 'var(--popover-foreground)',
      primary: 'var(--primary)',
      'primary-foreground': 'var(--primary-foreground)',
      secondary: 'var(--secondary)',
      'secondary-foreground': 'var(--secondary-foreground)',
      muted: 'var(--muted-bg)',
      'muted-foreground': 'var(--muted)',
      accent: 'var(--accent-bg)',
      'accent-foreground': 'var(--accent)',
      border: 'var(--border)',
      input: 'var(--input)',
      ring: 'var(--ring)',
      stage: 'var(--stage)',
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
  },
  shortcuts: {
    'btn-base':
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 select-none',
    'btn-outline':
      'btn-base border border-border bg-card text-foreground shadow-sm hover:bg-accent hover:text-foreground',
    'btn-primary':
      'btn-base border border-transparent bg-primary text-primary-foreground shadow-sm hover:opacity-90',
    'btn-secondary':
      'btn-base border border-transparent bg-secondary text-secondary-foreground hover:bg-accent',
    'btn-ghost':
      'btn-base border border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
    'badge-outline':
      'inline-flex items-center gap-1.5 rounded-md border border-border bg-card/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground backdrop-blur-sm',
    'card-surface':
      'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
  },
});
