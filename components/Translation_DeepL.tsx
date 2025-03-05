import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TranslationProps {
  japanese: string;
  selectedCountry: string;
}

const languageMap: { [key: string]: string } = {
  "Japan": "ja-JP",
  "Spain": "es-ES",
  "France": "fr-FR",
  "Germany": "de-DE",
  "Korea": "ko-KR"
};

const Translation: React.FC<TranslationProps> = ({ japanese, selectedCountry }) => {
  const [translation, setTranslation] = useState<{ translation: string; pronunciation: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const cachedTranslation = localStorage.getItem(`translation_${japanese}_${selectedCountry}`);
    if (cachedTranslation) {
      setTranslation(JSON.parse(cachedTranslation));
      setLoading(false);
      return;
    }

    const fetchTranslation = async () => {
      try {
        const response = await fetch("/api/DeepL", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrases: [japanese], selectedCountry })
        });
        const data = await response.json();
        const newTranslation = data.translatedPhrases[0];
        setTranslation(newTranslation);
        localStorage.setItem(`translation_${japanese}_${selectedCountry}`, JSON.stringify(newTranslation));
      } catch (error) {
        console.error("翻訳エラー", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslation();
  }, [japanese, selectedCountry]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      alert("このブラウザは音声合成をサポートしていません。");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageMap[selectedCountry] || "es-ES"; // デフォルトはスペイン語
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex items-center justify-between space-x-2 p-2 border-b border-gray-300">
      <div>
        <p className="text-gray-700">{japanese}</p>
        {loading ? (
          <p className="text-gray-500 text-sm">翻訳中...</p>
        ) : translation ? (
          <>
            <p className="text-blue-600 font-medium">{translation.translation}</p>
            <p className="text-gray-500 text-sm">{translation.pronunciation}</p>
          </>
        ) : (
          <p className="text-red-500 text-sm">翻訳できませんでした。</p>
        )}
      </div>
      {translation && <Button onClick={() => speakText(translation.translation)}>🔊</Button>}
    </div>
  );
};

export default Translation;
