import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2 } from 'lucide-react';

interface TranslationProps {
  japanese: string;
}

const Translation: React.FC<TranslationProps> = ({ japanese }) => {
  const [translation, setTranslation] = useState<{ spanish: string; pronunciation: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const cachedTranslation = localStorage.getItem(`translation_${japanese}`);
    if (cachedTranslation) {
      setTranslation(JSON.parse(cachedTranslation));
      setLoading(false);
      return;
    }

    const fetchTranslation = async () => {
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrases: [japanese] })
        });
        const data = await response.json();
        const newTranslation = {
          spanish: data.translatedPhrases[0].translation,
          pronunciation: data.translatedPhrases[0].pronunciation
        };
        setTranslation(newTranslation);
        localStorage.setItem(`translation_${japanese}`, JSON.stringify(newTranslation));
      } catch (error) {
        console.error("翻訳エラー", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslation();
  }, [japanese]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      alert("このブラウザは音声合成をサポートしていません。");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
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
            <p className="text-blue-600 font-medium">{translation.spanish}</p>
            <p className="text-gray-500 text-sm">{translation.pronunciation}</p>
          </>
        ) : (
          <p className="text-red-500 text-sm">翻訳できませんでした。</p>
        )}
      </div>
      {translation && <Button onClick={() => speakText(translation.spanish)}><Volume2 /></Button>}
    </div>
  );
};

export default Translation;


