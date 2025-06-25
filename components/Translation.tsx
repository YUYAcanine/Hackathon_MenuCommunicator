import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface TranslationProps {
  japanese: string;
  detectedLanguage: string;
}

/* ---- 言語名 → BCP47 タグ ---- */
const languageMap: Record<string, string> = {
  ja: "ja-JP",
  japanese: "ja-JP",
  日本語: "ja-JP",

  en: "en-US",
  english: "en-US",
  英語: "en-US",

  es: "es-ES",
  spanish: "es-ES",
  スペイン語: "es-ES",

  fr: "fr-FR",
  french: "fr-FR",
  フランス語: "fr-FR",

  de: "de-DE",
  german: "de-DE",
  ドイツ語: "de-DE",

  ko: "ko-KR",
  korean: "ko-KR",
  韓国語: "ko-KR",

  vi: "vi-VN",
  vietnamese: "vi-VN",
  ベトナム語: "vi-VN",

  th: "th-TH",
  thai: "th-TH",
  タイ語: "th-TH",

  zh: "zh-CN",
  chinese: "zh-CN",
  中国語: "zh-CN",
};

export default function Translation({ japanese, detectedLanguage }: TranslationProps) {
  const [translation, setTranslation] = useState<{ translation: string; pronunciation: string } | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---- 翻訳取得 ---- */
  useEffect(() => {
    const fetchTranslation = async () => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrases: [japanese], detectedLanguage }),
        });
        const data = await res.json();
        setTranslation(data.translatedPhrases?.[0] ?? null);
      } catch (err) {
        console.error("翻訳エラー", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTranslation();
  }, [japanese, detectedLanguage]);

  /* ---- 音声再生 ---- */
  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      alert("このブラウザは音声合成をサポートしていません。");
      return;
    }

    /* ▲ 言語名の正規化（大文字小文字・空白を無視） */
    const norm = detectedLanguage.trim().toLowerCase();
    const langTag = languageMap[norm] ?? languageMap[norm.replace(/語$/, "")] ?? "ja-JP";

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langTag;

    /* 該当 lang の voice があれば優先使用 */
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith(langTag.slice(0, 2)));
    if (voice) utter.voice = voice;

    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="flex items-center justify-between p-2 border-b border-gray-300 space-x-2">
      <div>
        <p className="text-gray-700">{japanese}</p>
        {loading ? (
          <p className="text-gray-500 text-sm">翻訳中...</p>
        ) : translation ? (
          <>
            <p className="text-blue-600 font-medium break-words">{translation.translation}</p>
            <p className="text-gray-500 text-sm">{translation.pronunciation}</p>
          </>
        ) : (
          <p className="text-red-500 text-sm">翻訳できませんでした。</p>
        )}
      </div>

      {translation && (
        <Button size="icon" variant="ghost" onClick={() => speakText(translation.translation)}>
          <Volume2 className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
