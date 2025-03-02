"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuItemData } from "../types/MenuItemData";

export default function OrderConfirmation() {
  const [orderItems, setOrderItems] = useState<MenuItemData[]>([]);
  const [translatedPhrase, setTranslatedPhrase] = useState<{ translation: string; pronunciation: string } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("France"); // 初期値
  const router = useRouter();

  useEffect(() => {
    const storedOrder = localStorage.getItem("orderItems");
    if (storedOrder) {
      setOrderItems(JSON.parse(storedOrder));
    }

    // localStorage から国情報を取得
    const storedCountry = localStorage.getItem("selectedCountry");
    if (storedCountry) {
      setSelectedCountry(storedCountry);
    }
  }, []);

  useEffect(() => {
    if (orderItems.length > 0) {
      const phraseToTranslate = `${orderItems[0].translatedMenuName} を ${orderItems[0].quantity} 個ください。`;

      fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrases: [phraseToTranslate], selectedCountry }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.translatedPhrases && data.translatedPhrases.length > 0) {
            setTranslatedPhrase(data.translatedPhrases[0]); // 1つだけ取得
          }
        })
        .catch(error => console.error("翻訳エラー:", error));
    }
  }, [orderItems, selectedCountry]); // selectedCountry を依存配列に追加

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">現地語での注文方法！</h1>
      <p>現地の言葉で注文してみよう</p>

      <div className="mt-6 text-left max-w-md mx-auto">
        <h2 className="text-lg font-bold mb-2">注文フレーズ</h2>
        {orderItems.length === 0 ? (
          <p className="text-gray-500">注文データがありません。</p>
        ) : translatedPhrase ? (
          <div className="border-b pb-4">
            <p className="text-gray-700 font-semibold">{`${orderItems[0].translatedMenuName} を ${orderItems[0].quantity} 個ください。`}</p>
            <p className="font-semibold text-lg">{translatedPhrase.translation}</p>
            <p className="text-sm text-gray-500">{translatedPhrase.pronunciation}</p>
          </div>
        ) : (
          <p className="text-gray-500">翻訳データを取得中...</p>
        )}
      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition"
      >
        メニューに戻る
      </button>
    </div>
  );
}
