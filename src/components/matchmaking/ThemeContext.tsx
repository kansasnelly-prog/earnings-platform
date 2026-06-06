// MODULE 4: Triple-Theme UI Design Provider Wrapper
// Universal styling wrapper component for enterprise visual looks

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeVariant = 'direct-chats' | 'public-feeds' | 'match-vip';

export interface ThemeConfig {
  variant: ThemeVariant;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    border: string;
    glass: string;
  };
  effects: {
    blur: string;
    shadow: string;
    glow: string;
  };
  typography: {
    heading: string;
    body: string;
    muted: string;
  };
}

// Option A: Deep Ruby Crimson Glassmorphism Overlay (Direct Chats Area)
const directChatsTheme: ThemeConfig = {
  variant: 'direct-chats',
  colors: {
    primary: '#dc2626', // Ruby crimson
    secondary: '#991b1b',
    accent: '#fca5a5',
    background: 'rgba(20, 5, 5, 0.95)',
    foreground: '#fef2f2',
    border: 'rgba(220, 38, 38, 0.3)',
    glass: 'rgba(220, 38, 38, 0.1)',
  },
  effects: {
    blur: 'blur(16px)',
    shadow: '0 8px 32px rgba(220, 38, 38, 0.3)',
    glow: '0 0 20px rgba(220, 38, 38, 0.5)',
  },
  typography: {
    heading: '#fef2f2',
    body: '#fee2e2',
    muted: '#fca5a5',
  },
};

// Option B: Midnight Dark Neon Violet Glow Aesthetic (Public Feeds & Groups)
const publicFeedsTheme: ThemeConfig = {
  variant: 'public-feeds',
  colors: {
    primary: '#8b5cf6', // Neon violet
    secondary: '#7c3aed',
    accent: '#c4b5fd',
    background: 'rgba(10, 5, 20, 0.95)',
    foreground: '#f5f3ff',
    border: 'rgba(139, 92, 246, 0.3)',
    glass: 'rgba(139, 92, 246, 0.1)',
  },
  effects: {
    blur: 'blur(20px)',
    shadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
    glow: '0 0 30px rgba(139, 92, 246, 0.6)',
  },
  typography: {
    heading: '#f5f3ff',
    body: '#ede9fe',
    muted: '#c4b5fd',
  },
};

// Option C: Gleaming Frosted Gold Acrylic Layout Frames (Match VIP Panels)
const matchVipTheme: ThemeConfig = {
  variant: 'match-vip',
  colors: {
    primary: '#f59e0b', // Gold
    secondary: '#d97706',
    accent: '#fcd34d',
    background: 'rgba(25, 20, 5, 0.95)',
    foreground: '#fffbeb',
    border: 'rgba(245, 158, 11, 0.3)',
    glass: 'rgba(245, 158, 11, 0.1)',
  },
  effects: {
    blur: 'blur(24px)',
    shadow: '0 8px 32px rgba(245, 158, 11, 0.4)',
    glow: '0 0 25px rgba(245, 158, 11, 0.5)',
  },
  typography: {
    heading: '#fffbeb',
    body: '#fef3c7',
    muted: '#fcd34d',
  },
};

const themeMap: Record<ThemeVariant, ThemeConfig> = {
  'direct-chats': directChatsTheme,
  'public-feeds': publicFeedsTheme,
  'match-vip': matchVipTheme,
};

interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (variant: ThemeVariant) => void;
  currentVariant: ThemeVariant;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultVariant?: ThemeVariant;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultVariant = 'direct-chats',
}) => {
  const [currentVariant, setCurrentVariant] = useState<ThemeVariant>(defaultVariant);
  const [theme, setThemeState] = useState<ThemeConfig>(themeMap[defaultVariant]);

  const setTheme = (variant: ThemeVariant) => {
    setCurrentVariant(variant);
    setThemeState(themeMap[variant]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentVariant }}>
      <div
        className="theme-wrapper"
        style={{
          '--theme-primary': theme.colors.primary,
          '--theme-secondary': theme.colors.secondary,
          '--theme-accent': theme.colors.accent,
          '--theme-background': theme.colors.background,
          '--theme-foreground': theme.colors.foreground,
          '--theme-border': theme.colors.border,
          '--theme-glass': theme.colors.glass,
          '--theme-blur': theme.effects.blur,
          '--theme-shadow': theme.effects.shadow,
          '--theme-glow': theme.effects.glow,
          '--theme-heading': theme.typography.heading,
          '--theme-body': theme.typography.body,
          '--theme-muted': theme.typography.muted,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper component for themed containers
export const ThemedContainer: React.FC<{
  variant?: ThemeVariant;
  children: ReactNode;
  className?: string;
}> = ({ variant = 'direct-chats', children, className = '' }) => {
  const { setTheme } = useTheme();
  
  React.useEffect(() => {
    setTheme(variant);
  }, [variant, setTheme]);

  return (
    <div className={`themed-container ${className}`}>
      {children}
    </div>
  );
};

// CSS utility classes for theme application
export const themeStyles = `
  .theme-wrapper {
    background: var(--theme-background);
    color: var(--theme-foreground);
    transition: all 0.3s ease;
  }

  .themed-container {
    background: var(--theme-background);
    border: 1px solid var(--theme-border);
    backdrop-filter: var(--theme-blur);
    box-shadow: var(--theme-shadow);
    border-radius: 16px;
    transition: all 0.3s ease;
  }

  .themed-container:hover {
    box-shadow: var(--theme-glow);
  }

  .theme-heading {
    color: var(--theme-heading);
  }

  .theme-body {
    color: var(--theme-body);
  }

  .theme-muted {
    color: var(--theme-muted);
  }

  .theme-primary {
    color: var(--theme-primary);
  }

  .theme-secondary {
    color: var(--theme-secondary);
  }

  .theme-accent {
    color: var(--theme-accent);
  }

  .theme-glass {
    background: var(--theme-glass);
  }

  .theme-border {
    border-color: var(--theme-border);
  }
`;
