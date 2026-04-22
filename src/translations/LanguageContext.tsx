import React, { createContext, useContext, useState } from "react";
import { languages } from "./translations";
import type { LanguageKey } from "./translations";

type LanguageContextType = {
  lang: LanguageKey;
  setLang: (lang: LanguageKey) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLang] = useState<LanguageKey>("sk");

  const t = (key: string, params?: Record<string, string | number>) => {
    const translations = languages[lang].translations as Record<
      string,
      unknown
    >;
    let value: string;
    if (key.includes(".")) {
      let obj: unknown = translations;
      for (const part of key.split(".")) {
        if (obj && typeof obj === "object" && part in obj) {
          obj = (obj as Record<string, unknown>)[part];
        } else {
          obj = undefined;
          break;
        }
      }
      value = typeof obj === "string" ? obj : key;
    } else {
      value = typeof translations[key] === "string" ? translations[key] : key;
    }
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
};
