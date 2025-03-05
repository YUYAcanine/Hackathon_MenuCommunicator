import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import Translation from "@/components/Translation";

interface SuggestionProps {
  selectedCountry: string;
}

const defaultPhrases = [
  "おなかいたい",
  "トイレはどこ？",
  "男性用トイレはどっち？"
];

const Suggestion: React.FC<SuggestionProps> = ({ selectedCountry }) => {
  const [isPhrasePanelOpen, setIsPhrasePanelOpen] = useState<boolean>(false);
  const [customPhrase, setCustomPhrase] = useState<string>("");
  const [phrases, setPhrases] = useState<string[]>([]);

  useEffect(() => {
    setPhrases([...defaultPhrases]);
  }, [selectedCountry]);

  const handleTranslate = () => {
    setPhrases([...defaultPhrases]);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 w-full bg-white p-6 shadow-lg border-t border-gray-300 transition-transform duration-300 ${
        isPhrasePanelOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* 上にスライドするためのボタン */}
      <div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-32 h-10 bg-gray-300 rounded-t-lg cursor-pointer flex items-center justify-center text-lg font-medium"
        onClick={() => setIsPhrasePanelOpen(!isPhrasePanelOpen)}
      >
        Suggestion
      </div>

      <h2 className="text-xl font-bold text-center mb-6">Suggestion</h2>

      <div className="mt-2 space-y-2">
        {phrases.map((phrase, index) => (
          <Translation key={index} japanese={phrase} selectedCountry={selectedCountry} />
        ))}

        {customPhrase.trim() && (
          <Translation japanese={customPhrase} selectedCountry={selectedCountry} />
        )}
      </div>

      {/* テキスト入力とボタン */}
      <div className="mt-4 flex space-x-2">
        <Input
          type="text"
          value={customPhrase}
          onChange={(e) => setCustomPhrase(e.target.value)}
          className="border p-3 w-full rounded text-lg"
          placeholder="翻訳したいフレーズを入力"
        />
        <Button onClick={handleTranslate} className="text-white">
          Translate
        </Button>
      </div>
    </div>
  );
};

export default Suggestion;

