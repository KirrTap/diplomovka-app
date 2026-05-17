import React from "react";
import type { SearchStrategy } from "./InputForm";
import { useLanguage } from "../../translations/LanguageContext";

interface SearchStrategySwitcherProps {
  strategy: SearchStrategy;
  setStrategy: (strategy: SearchStrategy) => void;
  hasCut?: boolean;
  showAllBranches?: boolean;
  onToggleAllBranches?: () => void;
}

export const SearchStrategySwitcher: React.FC<SearchStrategySwitcherProps> = ({
  strategy,
  setStrategy,
  hasCut = false,
  showAllBranches = false,
  onToggleAllBranches,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-3">
      <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
        <button
          onClick={() => setStrategy("dfs")}
          className={`px-5 py-1.5 text-sm font-bold rounded-md transition-all ${
            strategy === "dfs"
              ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-600"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-200/50"
          }`}
        >
          DFS
        </button>
        <button
          onClick={() => !hasCut && setStrategy("bfs")}
          disabled={hasCut}
          title={hasCut ? "BFS nie je podporované pri použití rezu (!)" : undefined}
          className={`px-5 py-1.5 text-sm font-bold rounded-md transition-all ${
            hasCut
              ? "text-gray-400 cursor-not-allowed opacity-50"
              : strategy === "bfs"
              ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-600"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-200/50"
          }`}
        >
          BFS
        </button>
      </div>
      {hasCut && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm font-bold text-gray-600 whitespace-nowrap">
            {t("show_all_branches")}
          </span>
          <div
            onClick={onToggleAllBranches}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${showAllBranches ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${showAllBranches ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </label>
      )}
    </div>
  );
};
