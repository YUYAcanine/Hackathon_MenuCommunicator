"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeEvent, useState, useEffect } from "react";
import MenuList from "@/components/MenuList";
import OrderList from "@/components/OrderList";
import Loading from "@/components/Loading";
import Suggestion from "@/components/Suggestion";
import CountrySelector from "@/components/CountrySelector";
import { ShoppingCart } from 'lucide-react';

import TranslatedLanguageSelector from "@/components/TranslatedLanguageSelector";

import { AllergySelector } from "@/components/AllergySelector"

import { MenuItemData } from "./types/MenuItemData";
import { useRouter } from "next/navigation";


export default function Home() {
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [apiStatus, setApiStatus] = useState<boolean>(false);
  const [isOrderListOpen, setIsOrderListOpen] = useState<boolean>(false);
  const [orderListTotal, setOrderListTotal] = useState<number>(0);
  const [orderListItemCount, setOrderListItemCount] = useState<number>(0);
  //const [isPhrasePanelOpen, setIsPhrasePanelOpen] = useState<boolean>(false);
  const [imageSearchProgress, setImageSearchProgress] = useState<number>(0);
  const [totalItemsToSearch, setTotalItemsToSearch] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("メニューを解析中...");
  const [processingPhase, setProcessingPhase] = useState<"analysis" | "imageSearch">("analysis");
  

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
    router.push("/nextpage");
  };

  // 画像検索を行う関数//YUYA
  const searchImageForMenuItem = async (item: MenuItemData): Promise<string | null> => {
    try {
      // 検索クエリを作成
      const searchQuery = `${item.originalMenuName} food`;
      
      const response = await fetch("/api/imageSearch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.imageUrl) {
        return data.imageUrl;
      } else {
        console.error("Image search failed for:", item.originalMenuName, data.error);
        return null;
      }
    } catch (error) {
      console.error("Error searching image for:", item.originalMenuName, error);
      return null;
    }
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
      if (response.ok) {
        setApiStatus(true);
        const jsonString = data.response.match(/```json\n([\s\S]*?)\n```/)?.[1];
        if (jsonString) {
          const parsedMenu = JSON.parse(jsonString);
          const menuData: MenuItemData[] = parsedMenu.map((item: MenuItemData, index: number) => ({
            ...item,
            id: `menu-${index + 1}`,
            quantity: 0
          }));
          setMenuItems(menuData);

          console.log("Menu Items:", menuData);

          // 画像検索と追加を開始//YUYA
          console.log("画像検索を開始します...");
          const menuWithImages = await addImagesToMenuItems(menuData);
          setMenuItems(menuWithImages);
          console.log("画像検索完了:", menuWithImages);
          //YUYA

        } else {
          console.error("Failed to extract JSON");
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

  // CountrySelector と TranslatedLanguageSelector の状態管理
  const [selectedCountry, setSelectedCountry] = useState<string>("Japan");
  const [translatedLanguage, setTranslatedLanguage] = useState<string>("Japan");

  useEffect(() => {
    const storedCountry = localStorage.getItem("selectedCountry");
    if (storedCountry) {
      setSelectedCountry(storedCountry);
    }
    const storedTranslatedLanguage = localStorage.getItem("translatedLanguage");
    if (storedTranslatedLanguage) {
      setTranslatedLanguage(storedTranslatedLanguage);
    }
  }, []);

  // 国が変更されたら localStorage に保存
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    localStorage.setItem("selectedCountry", newCountry); // 国情報を保存
  };

  // 翻訳後の言語変更時
  const handleTranslatedLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setTranslatedLanguage(newLanguage);
    localStorage.setItem("translatedLanguage", newLanguage); // 翻訳後の言語情報を保存
  };

  const handleSaveAllergies = (selectedAllergies: string[]) => {
    console.log("選択されたアレルギー:", selectedAllergies)
    // ここでアレルギー情報を保存する処理を追加
    // 例: API呼び出しやローカルストレージへの保存など
  }

  return (
    <div className="relative flex flex-col justify-center items-center min-h-screen space-y-4">
      <AllergySelector onSave={handleSaveAllergies}/>

      

      {!apiStatus && (
  <>
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      {/* 国選択コンポーネント */}
      <CountrySelector selectedCountry={selectedCountry} onChange={handleCountryChange} />

      {/* 矢印 */}
      <span style={{ fontSize: "20px", fontWeight: "bold" }}>→</span>

      {/* 翻訳後の言語選択コンポーネント */}
      <TranslatedLanguageSelector translatedLanguage={translatedLanguage} onChange={handleTranslatedLanguageChange} />
    </div>

    {/* ファイル選択とボタン */}
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input type="file" onChange={handleImageChange} disabled={apiStatus} accept="image/*" />
      <Button type="button" onClick={handleSubmit} disabled={apiStatus}>
        {loading ? "処理中..." : "翻訳メニューを作成"}
      </Button>
    </div>
  </>
)}


      {/* 認識結果のリスト表示 */}
      {loading && <Loading message={loadingMessage}/>}
      
      <MenuList 
        items={menuItems} 
        onQuantityChange={updateQuantity}
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
      <Suggestion selectedCountry={selectedCountry} />

    </div>
  );
}

