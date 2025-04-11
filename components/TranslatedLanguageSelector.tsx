import { ChangeEvent } from "react";

export interface TranslatedLanguageSelectorProps {
  translatedLanguage: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const TranslatedLanguageSelector: React.FC<TranslatedLanguageSelectorProps> = ({ translatedLanguage, onChange }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <label htmlFor="translated-language" className="text-sm font-medium mb-1">User Language</label>
      <select id="translated-language" value={translatedLanguage} onChange={onChange} className="border p-2 rounded">
        <option value="日本語">Japanese</option>
        <option value="フランス語">French</option>
        <option value="スペイン語">Spanish</option>
        <option value="ドイツ語">German</option>
        <option value="韓国語">Korean</option>
        <option value="ベトナム語">Vietnamese</option>
        <option value="タイ語">Thai</option>
        <option value="英語">English</option>
        <option value="中国語">Chinese</option>
      </select>
    </div>
  );
};

export default TranslatedLanguageSelector;
