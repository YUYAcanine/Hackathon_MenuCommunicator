"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuItemData } from "../types/MenuItemData";
import Translation from "@/components/Translation";

export default function OrderConfirmation() {
  const [orderItems, setOrderItems] = useState<MenuItemData[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("Japanese"); // 初期値を "Japanese" に設定
  const router = useRouter();

  useEffect(() => {
    const storedOrder = localStorage.getItem("orderItems");
    if (storedOrder) {
      setOrderItems(JSON.parse(storedOrder));
    }

    // localStorage から言語情報を取得
    const storedLanguage = localStorage.getItem("detectedLanguage");
    if (storedLanguage) {
      setDetectedLanguage(storedLanguage);
    }
  }, []);

  // 注文フレーズをまとめる
  const orderPhrase = orderItems
    .map((item) => `${item.translatedMenuName}を${item.quantity}個`)
    .join("と");

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">Try ordering in the local language!</h1>

      <div className="mt-6 text-left max-w-md mx-auto">
        <h2 className="text-lg font-bold mb-2">Order Phrases</h2>
        {orderItems.length === 0 ? (
          <p className="text-gray-500">注文データがありません。</p>
        ) : (
          <div className="border-b pb-4">
            <Translation
              japanese={`${orderPhrase}ください。`}
              detectedLanguage={detectedLanguage} // detectedLanguage を渡す
            />
          </div>
        )}
      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-6 px-4 py-2 bg-gray-400 text-white rounded-md shadow-md hover:bg-gray-500 transition"
      >
        Finish
      </button>
    </div>
  );
}
