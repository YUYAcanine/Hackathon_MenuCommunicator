import { useState } from "react";
import { Button } from "@/components/ui/button";
import Translation from "@/components/Translation";

interface SuggestionProps {
  speakText: (text: string) => void; // speakTextの型を定義
}

const phrases = [
  { japanese: "おすすめは何ですか？" },
  { japanese: "おいしいです！" },
  { japanese: "ありがとう！" }
];

const Suggestion: React.FC<SuggestionProps> = ({ speakText }) => {
  const [isPhrasePanelOpen, setIsPhrasePanelOpen] = useState<boolean>(false);
  
  return (
    <div
      className={`fixed bottom-10 left-0 w-full bg-white p-6 shadow-lg border-t border-gray-300 transition-transform duration-300 ${
        isPhrasePanelOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-24 h-8 bg-gray-300 rounded-t-lg cursor-pointer text-center"
        onClick={() => setIsPhrasePanelOpen(!isPhrasePanelOpen)}
      >
        Suggestion
      </div>
      <h2 className="text-lg font-bold text-center mb-6">Suggestion</h2>
      <div className="mt-2 space-y-2">
        {phrases.map((phrase, index) => (
          <Translation key={index} japanese={phrase.japanese} />
        ))}
      </div>
    </div>
  );
};

export default Suggestion;
