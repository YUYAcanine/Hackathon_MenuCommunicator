"use client";//スマホのコンピュータで動作します

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeEvent, useState, useEffect } from "react";
import MenuList from "@/components/MenuList"; //
import OrderList from "@/components/OrderList";
import { MenuItemData } from "./types/MenuItemData";
import { useRouter } from "next/navigation";

const Spinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 backdrop-blur-sm z-50">
    <div className="h-12 w-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
  </div>
);//読み込み中のくるくる

export default function Home() {
  const [images, setImages] = useState<File[]>([]); 
  const [loading, setLoading] = useState<boolean>(false); 
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]); 
  const [apiStatus, setApiStatus] = useState<boolean>(false); 
  const [isOrderListOpen, setIsOrderListOpen] = useState<boolean>(false); 
  const [orderListTotal, setOrderListTotal] = useState<number>(0); 
  const [orderListItemCount, setOrderListItemCount] = useState<number>(0);

  // 画像選択時の処理
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(selectedFiles);
    }
  };

  // 注文数が変更されたときに合計を再計算
  useEffect(() => {
    const itemCount = menuItems.reduce((total, item) => total + item.quantity, 0);
    setOrderListItemCount(itemCount);
    
    const total = menuItems.reduce((sum, item) => {
      const priceValue = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      return sum + (priceValue * item.quantity);
    }, 0);
    
    setOrderListTotal(total);
  }, [menuItems]);

  // 注文数更新関数
  const updateQuantity = (id: string, newQuantity: number) => {
    setMenuItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? {...item, quantity: newQuantity} : item
      )
    );
  };

  // 注文をリセット
  const resetOrder = () => {
    setMenuItems(prevItems => 
      prevItems.map(item => ({...item, quantity: 0}))
    );
    setIsOrderListOpen(false);
  };

  const router = useRouter(); 

  // 注文確定処理
  const placeOrder = () => {
    console.log("カートの中身:", menuItems.filter(item => item.quantity > 0)); // menuItemsを使用
    const orderedItems = menuItems.filter(item => item.quantity > 0); // 注文されたアイテムをフィルタリング

    if (orderedItems.length === 0) {
      console.log("カートが空なので注文できません");
      return;
    }

    localStorage.setItem("orderItems", JSON.stringify(orderedItems));  // `menuItems`を保存
    router.push("/nextpage");
  };

  // 翻訳ボタンを押した時の処理
  const handleSubmit = async () => {
    setLoading(true);

    setMenuItems([]); // メニューを初期化
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
      <MenuList 
        items={menuItems} 
        onQuantityChange={updateQuantity}
      />
      
      {/* カートボタン - カート内に商品がある場合のみ表示 */}
      {orderListItemCount > 0 && (
        <button
          onClick={() => setIsOrderListOpen(true)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-10 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="ml-1">{orderListItemCount}</span>
        </button>
      )}
      
      {/* カートパネル */}
      <OrderList
        isOpen={isOrderListOpen}
        onClose={() => setIsOrderListOpen(false)}
        cartItems={menuItems.filter(item => item.quantity > 0)}
        total={orderListTotal}
        onQuantityChange={updateQuantity}
        onPlaceOrder={placeOrder}
        onResetOrder={resetOrder}
      />
    </div>
  );
}


