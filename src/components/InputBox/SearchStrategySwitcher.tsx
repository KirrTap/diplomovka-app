import React from "react";
import { useLanguage } from "../../translations/LanguageContext";
import type { SearchStrategy } from "./InputForm";

interface SearchStrategySwitcherProps {
  strategy: SearchStrategy;
  setStrategy: (strategy: SearchStrategy) => void;
}

export const SearchStrategySwitcher: React.FC<SearchStrategySwitcherProps> = ({
  strategy,
  setStrategy,
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest whitespace-nowrap">
        {t("search_strategy")}
      </span>
      <div className="flex bg-gray-100 rounded-full p-1 gap-1">
        <button
          onClick={() => setStrategy("dfs")}
          className={`px-6 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
            strategy === "dfs"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-blue-600"
          }`}
        >
          DFS
        </button>
        <button
          onClick={() => setStrategy("bfs")}
          className={`px-6 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
            strategy === "bfs"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-blue-600"
          }`}
        >
          BFS
        </button>
      </div>
    </div>
  );
};
