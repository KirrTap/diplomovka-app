import React from 'react';
import { MdError } from "react-icons/md";

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div
    className="w-full flex items-center border border-[#DE2222] bg-[#FFEAE6] text-black rounded-md px-4 py-4 mt-2 mb-4"
    style={{ borderColor: 'rgb(222,34,34)', background: 'rgb(255,234,230)' }}
  >
    <MdError className="text-2xl mr-2 self-center" />
    <span className="text-md font-medium">{message}</span>
  </div>
);
