"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeEvent, useState } from "react";
import MenuList from "@/components/MenuList";
import { MenuItemData } from "./types/MenuItemData";

// メニューリストのUI確認用のダミーデータ
const dummyMenuData = [
  {
    originalMenuName: "Cheeseburger",
    translatedMenuName: "チーズバーガー",
    description:
      "ジューシーなビーフパティ、チーズ、レタス、トマトを挟んだクラシックなチーズバーガー。",
    price: "$8.99",
  },
  {
    originalMenuName: "Margherita Pizza",
    translatedMenuName: "マルゲリータピザ",
    description:
      "トマトソース、モッツァレラチーズ、バジルを使ったシンプルで美味しいピザ。",
    price: "$12.50",
  },
  {
    originalMenuName: "Spaghetti Bolognese",
    translatedMenuName: "スパゲッティボロネーゼ",
    description:
      "牛肉とトマトソースで作った本格的なボロネーゼソースのスパゲッティ。",
    price: "$14.00",
  },
  {
    originalMenuName: "Fish and Chips",
    translatedMenuName: "フィッシュ・アンド・チップス",
    description: "カリカリのフライドフィッシュとクリスピーなフライドポテト。",
    price: "$10.99",
  },
  {
    originalMenuName: "Pad Thai",
    translatedMenuName: "パッタイ",
    description:
      "タイ風炒めヌードル、エビ、卵、ピーナッツを使った人気のタイ料理。",
    price: "$11.50",
  },
  {
    originalMenuName: "Ramen",
    translatedMenuName: "ラーメン",
    description:
      "醤油ベースのスープに、チャーシュー、メンマ、ゆで卵をトッピングしたラーメン。",
    price: "$9.00",
  },
  {
    originalMenuName: "Paella",
    translatedMenuName: "パエリア",
    description:
      "シーフード、チキン、サフランライスを使ったスペインの伝統的な料理。",
    price: "$18.00",
  },
  {
    originalMenuName: "Tacos al Pastor",
    translatedMenuName: "タコス・アル・パストール",
    description:
      "ポークとパイナップルをトルティーヤで包んだメキシコの名物タコス。",
    price: "$7.50",
  },
  {
    originalMenuName: "Sushi Rolls",
    translatedMenuName: "寿司ロール",
    description:
      "新鮮なサーモンやツナを使ったカリフォルニアロールやドラゴンロール。",
    price: "$15.00",
  },
  {
    originalMenuName: "Tom Yum Soup",
    translatedMenuName: "トムヤムスープ",
    description: "辛いエビとハーブが効いた、酸味のあるタイのスープ。",
    price: "$6.00",
  },
];

const Spinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 backdrop-blur-sm z-50">
    <div className="h-12 w-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
  </div>
);

export default function Home() {
  // const [prompt, setPrompt] = useState("")
  const [images, setImages] = useState<File[]>([]);
  // const [result, setresult] = useState("")
  const [loading, setLoading] = useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [apiStatus, setApiStatus] = useState<boolean>(false);

  // 注文数更新関数
  const updateQuantity = (id: string, newQuantity: number) => {
    setMenuItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? {...item, quantity: newQuantity} : item
      )
    );
  };

  // 画像選択時の処理
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(selectedFiles);
    }
  };

  // テスト用のハンドルサミット関数
  // const handleSubmitTest = async () => {
  //   setMenuItems(dummyMenuData);
  //   setApiStatus(true);
  // }

  // 翻訳ボタンを押した時の処理
  const handleSubmit = async () => {
    setLoading(true);

    setMenuItems([]);
    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch("/api/gemini", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Response:", data);

      if (response.ok) {
        setApiStatus(true);
        const jsonString = data.response.match(/```json\n([\s\S]*?)\n```/)?.[1];
        if (jsonString) {
          const parsedMenu = JSON.parse(jsonString);
          
          // 各メニュー項目にIDと初期注文数を追加
          const menuData: MenuItemData[] = parsedMenu.map((item: MenuItemData, index: number) => ({
            ...item,
            id: `menu-${index + 1}`,  // 一意のID生成
            quantity: 0               // 初期注文数は0
          }));
          
          setMenuItems(menuData);
          console.log("Menu Items:", menuData);
        } else {
          console.error("Failed to extract JSON");
        }
      } else {
        console.error("Error:", data.error);
        setApiStatus(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setApiStatus(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-center items-center min-h-screen space-y-4">
      {/* 画像アップロード & 送信ボタン */}
      {!apiStatus && (
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="file"
            onChange={handleImageChange}
            disabled={apiStatus}
            accept="image/*"
          />
          <Button type="button" onClick={handleSubmit} disabled={apiStatus}>
            {loading ? "処理中..." : "翻訳メニューを作成"}
          </Button>
        </div>
      )}

      {/* 認識結果のリスト表示 */}
      {loading && <Spinner />}
      <MenuList items={menuItems} />
    </div>
  );
}
