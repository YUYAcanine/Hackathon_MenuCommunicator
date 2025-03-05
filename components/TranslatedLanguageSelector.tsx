import { ChangeEvent } from "react";

interface TranslatedLanguageSelectorProps {
  translatedLanguage: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const TranslatedLanguageSelector: React.FC<TranslatedLanguageSelectorProps> = ({ translatedLanguage, onChange }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <label htmlFor="translated-language" className="text-sm font-medium mb-1">Your Language</label>
      <select id="translated-language" value={translatedLanguage} onChange={onChange} className="border p-2 rounded">
        <option value="Japan">Japanese</option>
        <option value="France">French</option>
        <option value="Spain">Spanish</option>
        <option value="Germany">German</option>
        <option value="Korea">Korean</option>
        <option value="Vietnam">Vietnamese</option>
        <option value="Thailand">Thai</option>
        <option value="English">English</option>
        <option value="China">Chinese</option>
      </select>
    </div>
  );
};

export default TranslatedLanguageSelector;
