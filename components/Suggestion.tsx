import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Translation from "@/components/Translation";

interface SuggestionProps {
  detectedLanguage: string;
}

const defaultPhrases = [
  "おすすめはなんですか？",
  "トイレはどこ？",
  "注文お願いします"
];

const Suggestion: React.FC<SuggestionProps> = ({ detectedLanguage }) => {
  const [isPhrasePanelOpen, setIsPhrasePanelOpen] = useState<boolean>(false);
  const [customPhrase, setCustomPhrase] = useState<string>("");
  const [translatedPhrase, setTranslatedPhrase] = useState<string>("");
  const [phrases, setPhrases] = useState<string[]>([]);

  useEffect(() => {
    setPhrases([...defaultPhrases]);
  }, [detectedLanguage]);

  const handleTranslate = () => {
    setTranslatedPhrase(customPhrase);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 w-full bg-white p-6 shadow-lg border-t border-gray-300 transition-transform duration-300 ${
        isPhrasePanelOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* 上にスライドするためのボタン */}
      <div
        className="absolute top-[-3.5rem] left-1/2 transform -translate-x-1/2 w-40 h-20 bg-gray-300 rounded-t-lg cursor-pointer flex flex-col items-center justify-start pt-2 text-lg font-medium"
        onClick={() => setIsPhrasePanelOpen(!isPhrasePanelOpen)}
      >
        <span>会話のヒント</span>
        <span className="text-2xl leading-none">^</span>
      </div>


      <div className="mt-2 space-y-2">
        {phrases.map((phrase, index) => (
          <Translation key={index} japanese={phrase} detectedLanguage={detectedLanguage} />
        ))}

        {translatedPhrase.trim() && (
          <Translation japanese={translatedPhrase} detectedLanguage={detectedLanguage} />
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
