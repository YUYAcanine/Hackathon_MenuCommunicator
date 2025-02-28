"use client";//スマホのコンピュータで動作します

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeEvent, useState, useEffect } from "react";
import MenuList from "@/components/MenuList";
import OrderList from "@/components/OrderList";
import Loading from "@/components/Loading";
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
  const [isPhrasePanelOpen, setIsPhrasePanelOpen] = useState<boolean>(false);
  const [translatedPhrases, setTranslatedPhrases] = useState<{ translation: string; pronunciation: string; }[]>([]);
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

  // 画像検索を行う関数
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
          // 画像検索と追加を開始
          console.log("画像検索を開始します...");
          const menuWithImages = await addImagesToMenuItems(menuData);
          setMenuItems(menuWithImages);
          console.log("画像検索完了:", menuWithImages);
        } else {
          console.error("Failed to extract JSON");
        }
      } else {
        setApiStatus(false);
      }
    } catch (error) {
      setApiStatus(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTranslations = async () => {
      const phrases = [
        "おすすめは何ですか？",
        "これはエビが入っていますか？",
        "ありがとう！"
      ];
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrases })
        });
        const data = await response.json();
        setTranslatedPhrases(data.translatedPhrases);
      } catch (error) {
        console.error("翻訳エラー", error);
      }
    };
    fetchTranslations();
  }, []);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    speechSynthesis.speak(utterance);
  };

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
    <div className="relative flex flex-col justify-center items-center min-h-screen space-y-4">
      {!apiStatus && (
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="file" onChange={handleImageChange} disabled={apiStatus} accept="image/*" />
          <Button type="button" onClick={handleSubmit} disabled={apiStatus}>
            {loading ? "処理中..." : "翻訳メニューを作成"}
          </Button>
        </div>
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
          🛒 {orderListItemCount}
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
  
      <div className={`fixed bottom-10 left-0 w-full bg-white p-6 shadow-lg border-t border-gray-300 transition-transform duration-300 ${isPhrasePanelOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-24 h-8 bg-gray-300 rounded-t-lg cursor-pointer text-center"
          onClick={() => setIsPhrasePanelOpen(!isPhrasePanelOpen)}
        >
          Suggestion
        </div>
        <h2 className="text-lg font-bold text-center mb-6">Suggestion</h2>
        <div className="mt-2 space-y-2">
          {translatedPhrases.slice(0, 3).map((phrase, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-gray-700">{["おすすめは何ですか？", "これはエビが入っていますか？", "ありがとう！"][index] || ""}</p>
                <p className="text-blue-600 font-medium">{[
                  "¿Qué me recomienda?",
                  "¿Esto tiene gambas?",
                  "¡Gracias!"
                ][index]}</p>
                <p className="text-gray-500 text-sm">{[
                  "(ケ・メ・レコミエンダ？)",
                  "(エスト・ティエネ・ガンバス？)",
                  "(グラシアス！)"
                ][index]}</p>
              </div>
              <Button onClick={() => speakText([
                  "¿Qué me recomienda?",
                  "¿Esto tiene gambas?",
                  "¡Gracias!"
                ][index])} className="ml-2">🔊</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}