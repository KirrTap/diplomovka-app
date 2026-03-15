import { useState } from "react";
import { useLanguage } from "../../translations/LanguageContext";
import { languages } from "../../translations/translations";
import type { LanguageKey } from "../../translations/translations";
import ReactCountryFlag from "react-country-flag";

export const LanguageDropdown = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-100 w-24"
      >
        <ReactCountryFlag svg countryCode={languages[lang].countryCode} />
        <span className="font-medium">{languages[lang].label}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={open ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 min-w-full rounded-lg border border-gray-200 bg-white shadow">
          {Object.keys(languages).map((key) => {
            const k = key as LanguageKey;
            return (
              <button
                key={k}
                onClick={() => {
                  setLang(k);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100"
              >
                <ReactCountryFlag svg countryCode={languages[k].countryCode} />
                <span>{languages[k].label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
