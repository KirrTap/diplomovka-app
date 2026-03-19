import React from "react";
import type { SearchStrategy } from "./InputForm";

interface SearchStrategySwitcherProps {
  strategy: SearchStrategy;
  setStrategy: (strategy: SearchStrategy) => void;
}

export const SearchStrategySwitcher: React.FC<SearchStrategySwitcherProps> = ({
  strategy,
  setStrategy,
}) => {
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
          onClick={() => setStrategy("bfs")}
          className={`px-5 py-1.5 text-sm font-bold rounded-md transition-all ${
            strategy === "bfs"
              ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-600"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-200/50"
          }`}
        >
          BFS
        </button>
      </div>
    </div>
  );
};
