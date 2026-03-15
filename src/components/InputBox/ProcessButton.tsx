import { useLanguage } from "../../translations/LanguageContext";

interface ProcessButtonProps {
  onClick?: () => void;
}

export const ProcessButton = ({ onClick }: ProcessButtonProps) => {
  const { t } = useLanguage();

  return (
    <button
      className="w-55 bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-4 rounded-md transition-colors duration-200 shadow-md hover:shadow-lg"
      onClick={onClick}
    >
      {t("process_formula")}
    </button>
  );
};
