"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeEvent, useState, useEffect } from "react";
import MenuList from "@/components/MenuList";
import OrderList from "@/components/OrderList";
import Loading from "@/components/Loading";
import Suggestion from "@/components/Suggestion";
import { ShoppingCart, Camera, Image as ImageIcon } from 'lucide-react';
import TranslatedLanguageSelector from "@/components/TranslatedLanguageSelector";
import { AllergySelector } from "@/components/AllergySelector"
import { MenuItemData } from "./types/MenuItemData";
import { useRouter } from "next/navigation";
import { searchImageForMenuItem } from "@/utils/imageSearch";
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';


export default function Home() {
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [apiStatus, setApiStatus] = useState<boolean>(false);
  const [isOrderListOpen, setIsOrderListOpen] = useState<boolean>(false);
  const [orderListTotal, setOrderListTotal] = useState<number>(0);
  const [orderListItemCount, setOrderListItemCount] = useState<number>(0);
  const [imageSearchProgress, setImageSearchProgress] = useState<number>(0);
  const [totalItemsToSearch, setTotalItemsToSearch] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("メニューを解析中...");
  const [processingPhase, setProcessingPhase] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("Japan");
  const [userAllegeries, setUserAllergies] = useState<string[]>([]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(selectedFiles);
    }
  };

  useEffect(() => {
    const itemCount = menuItems.reduce((total, item) => total + item.quantity, 0);
    setOrderListItemCount(itemCount);

    const total = menuItems.reduce((sum, item) => {
      const priceValue = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      return sum + (priceValue * item.quantity);
    }, 0);

    setOrderListTotal(total);
  }, [menuItems]);

  const updateQuantity = (id: string, newQuantity: number) => {
    setMenuItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? {...item, quantity: newQuantity} : item
      )
    );
  };

  const resetOrder = () => {
    setMenuItems(prevItems => 
      prevItems.map(item => ({...item, quantity: 0}))
    );
    setIsOrderListOpen(false);
  };

  const router = useRouter();

  const placeOrder = () => {
    const orderedItems = menuItems.filter(item => item.quantity > 0);
    if (orderedItems.length === 0) {
      return;
    }
    localStorage.setItem("orderItems", JSON.stringify(orderedItems));
    router.push("/order");
  };

  const addImagesToMenuItems = async (menuItems: MenuItemData[]) => {
    setImageSearchProgress(0);
    setTotalItemsToSearch(menuItems.length);
    setProcessingPhase("imageSearch");

    const updatedMenuItems = [...menuItems];

    for (let i = 0; i < updatedMenuItems.length; i++) {
      const imageUrl = await searchImageForMenuItem(updatedMenuItems[i]);
      if (imageUrl) {
        updatedMenuItems[i] = { ...updatedMenuItems[i], imageURL: imageUrl };
      }
      setImageSearchProgress(i + 1);
    }

    return updatedMenuItems;
  };

  useEffect(() => {
    if (processingPhase === "imageSearch") {
      setLoadingMessage(`画像を検索中 (${imageSearchProgress}/${totalItemsToSearch})`);
    }
  }, [imageSearchProgress, totalItemsToSearch, processingPhase]);

  const handleSubmit = async () => {
    setLoading(true);
    setMenuItems([]);
    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append("images", image);
      });
      formData.append("translatedLanguage", translatedLanguage);

      const response = await fetch("/api/gemini", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setApiStatus(true);
        if (data.detectedLanguage) {
          setDetectedLanguage(data.detectedLanguage);
          localStorage.setItem("detectedLanguage", data.detectedLanguage);
        }

        const menuJsonString = data.menuData.replace(/```json\n([\s\S]*?)\n```/, "$1");

        try {
          const parsedMenu: MenuItemData[] = JSON.parse(menuJsonString).map((item: MenuItemData, index: number) => ({
            ...item,
            id: `menu-${index + 1}`,
            quantity: 0
          }));

          setMenuItems(parsedMenu);
          const menuWithImages = await addImagesToMenuItems(parsedMenu);
          setMenuItems(menuWithImages);
          setProcessingPhase("");

        } catch (jsonError) {
          console.error("JSONのパースに失敗しました:", jsonError);
        }

      } else {
        setApiStatus(false);
      }
    } catch (error) {
      setApiStatus(false);
      console.error("APIエラー", error);
    } finally {
      setLoading(false);
    }
  };

  const [translatedLanguage, setTranslatedLanguage] = useState<string>("Japan");

  useEffect(() => {
    const storedTranslatedLanguage = localStorage.getItem("translatedLanguage");
    if (storedTranslatedLanguage) {
      setTranslatedLanguage(storedTranslatedLanguage);
    }
  }, []);

  useEffect(() => {
    const storedDetectedLanguage = localStorage.getItem("detectedLanguage");
    if (storedDetectedLanguage) {
      setDetectedLanguage(storedDetectedLanguage);
    }
  }, []);

  

  const handleTranslatedLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setTranslatedLanguage(newLanguage);
    localStorage.setItem("translatedLanguage", newLanguage);
  };

  const handleSaveAllergies = (selectedAllergies: string[]) => {
    setUserAllergies(selectedAllergies);
    console.log("ユーザーのアレルギー:", userAllegeries);
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen pt-4">
      {/* 言語セレクター：右上固定（翻訳前のみ） */}
      {!apiStatus && (
        <div className="fixed top-4 right-4 z-50">
          <TranslatedLanguageSelector translatedLanguage={translatedLanguage} onChange={handleTranslatedLanguageChange} />
        </div>
      )}

      {/* アレルギーセレクター：翻訳前のみ表示 */}
      {!apiStatus && (
        <div className="mt-20">
          <AllergySelector onSave={handleSaveAllergies} />
        </div>
      )}

      {/* 撮影・選択ボタン（画像未選択時のみ） */}
      {images.length === 0 && !apiStatus && (
        <div className="flex space-x-4 mt-10 justify-center">
          {/* カメラ撮影ボタン */}
          <label htmlFor="camera-upload" className="w-24 h-24 bg-gray-300 text-black flex items-center justify-center rounded cursor-pointer shadow-md hover:bg-gray-400 transition">
            <Camera className="w-8 h-8" />
            <input id="camera-upload" type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" disabled={apiStatus} />
          </label>

          {/* 画像ファイル選択ボタン */}
          <label htmlFor="file-upload" className="w-24 h-24 bg-gray-300 text-black flex items-center justify-center rounded cursor-pointer shadow-md hover:bg-gray-400 transition">
            <ImageIcon className="w-8 h-8" />
            <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={apiStatus} />
          </label>
        </div>
      )}

      {/* プレビュー画像エリア（中央下寄り・翻訳前のみ） */}
      {images.length > 0 && !apiStatus && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] mt-10">
          <div className="flex flex-wrap justify-center gap-6">
            {images.map((image, index) => (
              <img key={index} src={URL.createObjectURL(image)} alt={`プレビュー${index + 1}`} className="w-48 h-48 object-cover rounded shadow" />
            ))}
          </div>
        </div>
      )}

      {/* 翻訳ボタン（右下固定・円形：画像あり & 翻訳前のみ） */}
      {images.length > 0 && !apiStatus && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button type="button" onClick={handleSubmit} disabled={apiStatus} className="w-24 h-24 bg-gray-300 hover:bg-gray-400 text-black rounded-full shadow-md flex items-center justify-center text-sm">
            {loading ? "…" : "翻訳"}
          </Button>
        </div>
      )}

      {/* 読み込み中の表示 */}
      {loading && <Loading message={loadingMessage} />}

      {/* メニューリスト表示 */}
      <MenuList items={menuItems} onQuantityChange={updateQuantity} userAllegeries={userAllegeries} />

      {/* カートボタン */}
      {orderListItemCount > 0 && (
        <button onClick={() => setIsOrderListOpen(true)} className="fixed bottom-16 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-10 flex items-center justify-center">
          <ShoppingCart /> {orderListItemCount}
        </button>
      )}

      {/* 注文リスト */}
      <OrderList isOpen={isOrderListOpen} onClose={() => setIsOrderListOpen(false)} cartItems={menuItems.filter(item => item.quantity > 0)} total={orderListTotal} onQuantityChange={updateQuantity} onPlaceOrder={placeOrder} onResetOrder={resetOrder} />

      {/* 翻訳後のサジェスチョン表示 */}
      {apiStatus && <Suggestion detectedLanguage={detectedLanguage} />}
    </div>
  );
}



