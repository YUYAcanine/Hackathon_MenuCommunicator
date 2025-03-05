"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuItemData } from "../types/MenuItemData";
import Translation from "@/components/Translation";

export default function OrderConfirmation() {
  const [orderItems, setOrderItems] = useState<MenuItemData[]>([]);
  const [selectedCountry, setselectedCountry] = useState<string>("France"); // 初期値
  const router = useRouter();

  useEffect(() => {
    const storedOrder = localStorage.getItem("orderItems");
    if (storedOrder) {
      setOrderItems(JSON.parse(storedOrder));
    }

    // localStorage から国情報を取得
    const storedCountry = localStorage.getItem("selectedCountry");
    if (storedCountry) {
      setselectedCountry(storedCountry);
    }
  }, []);

  // 注文フレーズをまとめる
  const orderPhrase = orderItems
    .map((item) => `${item.translatedMenuName}を${item.quantity}個`)
    .join("と");

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">現地語での注文方法！</h1>
      <p>現地の言葉で注文してみよう</p>

      <div className="mt-6 text-left max-w-md mx-auto">
        <h2 className="text-lg font-bold mb-2">注文フレーズ</h2>
        {orderItems.length === 0 ? (
          <p className="text-gray-500">注文データがありません。</p>
        ) : (
          <div className="border-b pb-4">
            <Translation
              japanese={`${orderPhrase}ください。`}
              selectedCountry={selectedCountry}
            />
          </div>
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


