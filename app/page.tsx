"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeEvent, useState, useEffect } from "react";
import MenuList from "@/components/MenuList";
import OrderList from "@/components/OrderList";
import Loading from "@/components/Loading";
import Suggestion from "@/components/Suggestion";
import { ShoppingCart } from 'lucide-react';
import TranslatedLanguageSelector from "@/components/TranslatedLanguageSelector";
import { AllergySelector } from "@/components/AllergySelector"
import { MenuItemData } from "./types/MenuItemData";
import { useRouter } from "next/navigation";
import { searchImageForMenuItem } from "@/utils/imageSearch";

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
  const [processingPhase, setProcessingPhase] = useState<"analysis" | "imageSearch">("analysis");
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

  // メニュー一覧に画像を追加する処理
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

  // 画像検索進捗の更新時にローディングメッセージを更新
  useEffect(() => {
    if (processingPhase === "imageSearch" && totalItemsToSearch > 0) {
      setLoadingMessage(`画像を検索中 (${imageSearchProgress}/${totalItemsToSearch})`);
    }
  }, [imageSearchProgress, totalItemsToSearch, processingPhase]);

  // 翻訳ボタンを押した時の処理
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
      console.log("API Response:", data); // デバッグ用ログ
  
      if (response.ok) {
        setApiStatus(true);
  
        // 🔹 detectedLanguage を正しく設定
        if (data.detectedLanguage) {
          setDetectedLanguage(data.detectedLanguage);
          localStorage.setItem("detectedLanguage", data.detectedLanguage);
        } else {
          console.warn("detectedLanguage がレスポンスに含まれていません");
        }
  
        const menuJsonString = data.menuData.replace(/```json\n([\s\S]*?)\n```/, "$1");
  
        try {
          const parsedMenu: MenuItemData[] = JSON.parse(menuJsonString).map((item: MenuItemData, index: number) => ({
            ...item,
            id: `menu-${index + 1}`,
            quantity: 0
          }));
  
          setMenuItems(parsedMenu);
          console.log("Menu Items:", parsedMenu);
  
          const menuWithImages = await addImagesToMenuItems(parsedMenu);
          setMenuItems(menuWithImages);
          console.log("画像検索完了:", menuWithImages);
  
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

  // 翻訳後の言語変更時
  const handleTranslatedLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setTranslatedLanguage(newLanguage);
    localStorage.setItem("translatedLanguage", newLanguage); // 翻訳後の言語情報を保存
  };

  const handleSaveAllergies = (selectedAllergies: string[]) => {
    setUserAllergies(selectedAllergies);
    console.log("ユーザーのアレルギー:", userAllegeries);
  }

  return (
    <div className="relative flex flex-col justify-center items-center min-h-screen">
      {!apiStatus && (
        <>
          <TranslatedLanguageSelector 
            translatedLanguage={translatedLanguage} 
            onChange={handleTranslatedLanguageChange} />
          <AllergySelector onSave={handleSaveAllergies}/>
            {/* ファイル選択とボタン */}
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="file" onChange={handleImageChange} disabled={apiStatus} accept="image/*" />
              <Button type="button" onClick={handleSubmit} disabled={apiStatus}>
                {loading ? "処理中..." : "翻訳メニューを作成"}
              </Button>
            </div>
        </>
      )}

      {loading && <Loading message={loadingMessage}/>}
      
      <MenuList 
        items={menuItems} 
        onQuantityChange={updateQuantity}
        userAllegeries={userAllegeries}
      />
      
      {/* カートボタン - カート内に商品がある場合のみ表示 */}
      {orderListItemCount > 0 && (
        <button
          onClick={() => setIsOrderListOpen(true)}
          className="fixed bottom-16 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-10 flex items-center justify-center"
        >
          <ShoppingCart /> {orderListItemCount}
        </button>
      )}
      <OrderList
        isOpen={isOrderListOpen}
        onClose={() => setIsOrderListOpen(false)}
        cartItems={menuItems.filter(item => item.quantity > 0)}
        total={orderListTotal}
        onQuantityChange={updateQuantity}
        onPlaceOrder={placeOrder}
        onResetOrder={resetOrder}
      />
      <Suggestion detectedLanguage={detectedLanguage} />
    </div>
  );
}
