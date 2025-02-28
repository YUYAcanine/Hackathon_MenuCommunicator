"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuItemData } from "../types/MenuItemData";

export default function OrderConfirmation() {
  const [orderItems, setOrderItems] = useState<MenuItemData[]>([]);
  const [translatedPhrases, setTranslatedPhrases] = useState<{ translation: string; pronunciation: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const storedOrder = localStorage.getItem("orderItems");
    if (storedOrder) {
      setOrderItems(JSON.parse(storedOrder));
    }
  }, []);

  // スペイン語に翻訳する関数
  const translateToSpanish = async () => {
    setLoading(true);
    try {
      const phrases = orderItems.map(item => `${item.translatedMenuName} を ${item.quantity} 個ください。`);

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrases }),
      });

      const data = await response.json();
      if (response.ok) {
        setTranslatedPhrases(data.translatedPhrases);
      } else {
        console.error("Translation error:", data.error);
      }
    } catch (error) {
      console.error("Error fetching translation:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderItems.length > 0) {
      translateToSpanish();
    }
  }, [orderItems]);

  // スペイン語を読み上げる関数
  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      alert("このブラウザは音声合成をサポートしていません。");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES"; // スペイン語（スペイン）の音声
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">現地語での注文方法！</h1>
      <p>現地の言葉で注文してみよう</p>

      <div className="mt-6 text-left max-w-md mx-auto">
        <h2 className="text-lg font-bold mb-2">注文フレーズ</h2>
        <ul className="space-y-3">
          {orderItems.length === 0 ? (
            <p className="text-gray-500">注文データがありません。</p>
          ) : (
            orderItems.map((item, index) => (
              <li key={item.id} className="flex flex-col border-b pb-2">
                {/* 日本語の注文フレーズ */}
                <p className="font-medium">{item.translatedMenuName} を {item.quantity} 個ください。</p>
                
                {/* スペイン語の翻訳結果 */}
                {loading ? (
                  <p className="text-gray-500 text-sm">翻訳中...</p>
                ) : translatedPhrases[index] ? (
                  <>
                    <p className="text-blue-600 text-sm font-medium">{translatedPhrases[index].translation}</p>
                    <p className="text-gray-500 text-sm">({translatedPhrases[index].pronunciation})</p>
                    {/* 読み上げボタン */}
                    <button
                      onClick={() => speakText(translatedPhrases[index].translation)}
                      className="mt-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition flex items-center justify-center"
                    >
                      🔊 読み上げ
                    </button>
                  </>
                ) : (
                  <p className="text-red-500 text-sm">翻訳できませんでした。</p>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* メニューに戻るボタン */}
      <button
        onClick={() => router.push("/")}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition"
      >
        メニューに戻る
      </button>
    </div>
  );
}




