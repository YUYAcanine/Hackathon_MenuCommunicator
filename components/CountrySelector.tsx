import { ChangeEvent } from "react";

interface CountrySelectorProps {
  selectedCountry: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ selectedCountry, onChange }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <label htmlFor="country" className="text-sm font-medium mb-1">国を選択してください</label>
      <select id="country" value={selectedCountry} onChange={onChange} className="border p-2 rounded">
        <option value="Japan">日本 (Japanese)</option>
        <option value="France">フランス (French)</option>
        <option value="Spain">スペイン (Spanish)</option>
        <option value="Germany">ドイツ (German)</option>
        <option value="Korea">韓国 (Korean)</option>
      </select>
    </div>
  );
};

export default CountrySelector;
