import React from 'react';

interface SymbolButtonProps {
  symbol: string;
  onClick?: (symbol: string) => void;
}

export const SymbolButton: React.FC<SymbolButtonProps> = ({ symbol, onClick }) => {
  return (
    <button
      className="bg-gray-600 hover:bg-gray-900 text-white font-medium py-4 rounded-md shadow-sm transition-colors duration-150 w-[84px]"
      onClick={() => onClick && onClick(symbol)}
    >
      {symbol}
    </button>
  );
};