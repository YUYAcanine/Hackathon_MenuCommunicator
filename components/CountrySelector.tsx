import { ChangeEvent } from "react";

interface CountrySelectorProps {
  selectedCountry: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ selectedCountry, onChange }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <label htmlFor="country" className="text-sm font-medium mb-1">Menu Language</label>
      <select id="country" value={selectedCountry} onChange={onChange} className="border p-2 rounded">
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

export default CountrySelector;
