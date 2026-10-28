"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { t } from "./i18n";

const ThemeLangContext = createContext(null);

export function ThemeLangProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("dukaan_theme");
      if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      } else {
        setTheme("light");
        document.documentElement.classList.remove("dark");
      }

      const savedLang = localStorage.getItem("dukaan_lang");
      if (savedLang === "hi" || savedLang === "en") {
        setLang(savedLang);
      }
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("dukaan_theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {}
  };

  const toggleLang = () => {
    const nextLang = lang === "en" ? "hi" : "en";
    setLang(nextLang);
    try {
      localStorage.setItem("dukaan_lang", nextLang);
    } catch (e) {}
  };

  const setSpecificLang = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem("dukaan_lang", newLang);
    } catch (e) {}
  };

  const translate = (key) => t(key, lang);

  return (
    <ThemeLangContext.Provider
      value={{
        theme,
        toggleTheme,
        lang,
        toggleLang,
        setSpecificLang,
        t: translate,
      }}
    >
      {children}
    </ThemeLangContext.Provider>
  );
}

export function useThemeLang() {
  const ctx = useContext(ThemeLangContext);
  if (!ctx) {
    return {
      theme: "light",
      toggleTheme: () => {},
      lang: "en",
      toggleLang: () => {},
      setSpecificLang: () => {},
      t: (k) => t(k, "en"),
    };
  }
  return ctx;
}

