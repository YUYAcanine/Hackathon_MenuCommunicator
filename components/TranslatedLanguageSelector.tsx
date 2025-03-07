import { ChangeEvent } from "react";

interface TranslatedLanguageSelectorProps {
  translatedLanguage: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const TranslatedLanguageSelector: React.FC<TranslatedLanguageSelectorProps> = ({ translatedLanguage, onChange }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <label htmlFor="translated-language" className="text-sm font-medium mb-1">User Language</label>
      <select id="translated-language" value={translatedLanguage} onChange={onChange} className="border p-2 rounded">
        <option value="Japanes">Japanese</option>
        <option value="French">French</option>
        <option value="Spanish">Spanish</option>
        <option value="German">German</option>
        <option value="Korean">Korean</option>
        <option value="Vietnamese">Vietnamese</option>
        <option value="Thai">Thai</option>
        <option value="English">English</option>
        <option value="Chinese">Chinese</option>
      </select>
    </div>
  );
};

export default TranslatedLanguageSelector;
