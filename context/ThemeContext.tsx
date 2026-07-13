"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem("env_vault_theme");
  if (saved === "light") return false;
  if (saved === "dark") return true;
  return true;
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add("dark");
      localStorage.setItem("env_vault_theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("env_vault_theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
