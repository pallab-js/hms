"use client";

import { useState, createContext, useContext, type ReactNode } from "react";

type Theme = "dark";

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<Theme>("dark");

  return (
    <ThemeContext.Provider value={{ theme }}>
      <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}