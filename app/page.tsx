"use client";

import { Button } from "@/components/ui/button";
import { ChangeEvent, useState, useEffect } from "react";
import MenuList from "@/components/MenuList";
import OrderList from "@/components/OrderList";
import Loading from "@/components/Loading";
import Suggestion from "@/components/Suggestion";
import { ShoppingCart, Camera, Image as ImageIcon } from 'lucide-react';
import TranslatedLanguageSelector from "@/components/TranslatedLanguageSelector";
import { AllergySelector } from "@/components/AllergySelector";
import { MenuItemData } from "./types/MenuItemData";
import { useRouter } from "next/navigation";
import { searchImageForMenuItem } from "@/utils/imageSearch";
import Image from "next/image";
import imageCompression from "browser-image-compression";

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
  const [translatedLanguage, setTranslatedLanguage] = useState<string>("Japan");
  const [menuOffset, setMenuOffset] = useState<number>(0);

  const router = useRouter();

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const compressedFiles = await Promise.all(selectedFiles.map(async (file) => {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
        try {
          return await imageCompression(file, options);
        } catch (error) {
          console.error("画像圧縮に失敗", error);
          return file;
        }
      }));
      setImages(compressedFiles);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setMenuItems(prevItems => prevItems.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  };

  const resetOrder = () => {
    setMenuItems(prevItems => prevItems.map(item => ({ ...item, quantity: 0 })));
    setIsOrderListOpen(false);
  };

  const placeOrder = () => {
    const orderedItems = menuItems.filter(item => item.quantity > 0);
    if (orderedItems.length === 0) return;
    localStorage.setItem("orderItems", JSON.stringify(orderedItems));
    router.push("/order");
  };

  const addImagesToMenuItems = async (menuItems: MenuItemData[]) => {
    setImageSearchProgress(0);
    const limit = Math.min(menuItems.length, 6);
    setTotalItemsToSearch(limit);
    setProcessingPhase("imageSearch");

    const updatedMenuItems = [...menuItems];
    for (let i = 0; i < limit; i++) {
      const imageUrl = await searchImageForMenuItem(updatedMenuItems[i]);
      if (imageUrl) {
        updatedMenuItems[i] = { ...updatedMenuItems[i], imageURL: imageUrl };
      }
      setImageSearchProgress(i + 1);
    }
    return updatedMenuItems;
  };

  const fetchMoreMenus = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      images.forEach((image) => formData.append("images", image));
      formData.append("translatedLanguage", translatedLanguage);

      const response = await fetch("/api/gemini", { method: "POST", body: formData });
      const data = await response.json();

      if (response.ok) {
        if (data.detectedLanguage) {
          setDetectedLanguage(data.detectedLanguage);
          localStorage.setItem("detectedLanguage", data.detectedLanguage);
        }

        const match = data.menuData.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = match ? match[1] : data.menuData;
        const parsed: MenuItemData[] = JSON.parse(jsonString);

        const nextBatch = parsed.slice(menuOffset, menuOffset + 8).map((item, index) => ({
          ...item,
          id: `menu-${menuOffset + index + 1}`,
          quantity: 0
        }));

        const menuWithImages = await addImagesToMenuItems(nextBatch);
        setMenuItems(prev => [...prev, ...menuWithImages]);
        setMenuOffset(prev => prev + 8);
        setProcessingPhase("");
        setApiStatus(true);
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

  const handleSubmit = async () => {
    setMenuItems([]);
    setMenuOffset(0);
    await fetchMoreMenus();
  };

  useEffect(() => {
    const count = menuItems.reduce((total, item) => total + item.quantity, 0);
    const total = menuItems.reduce((sum, item) => sum + parseFloat(item.price.replace(/[^0-9.]/g, '')) * item.quantity, 0);
    setOrderListItemCount(count);
    setOrderListTotal(total);
  }, [menuItems]);

  useEffect(() => {
    const stored = localStorage.getItem("translatedLanguage");
    if (stored) setTranslatedLanguage(stored);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("detectedLanguage");
    if (stored) setDetectedLanguage(stored);
  }, []);

  const handleTranslatedLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setTranslatedLanguage(newLang);
    localStorage.setItem("translatedLanguage", newLang);
  };

  const handleSaveAllergies = (selected: string[]) => {
    setUserAllergies(selected);
    console.log("ユーザーのアレルギー:", selected);
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen pt-4">
      {!apiStatus && (
        <div className="fixed top-4 right-4 z-50">
          <TranslatedLanguageSelector translatedLanguage={translatedLanguage} onChange={handleTranslatedLanguageChange} />
        </div>
      )}

      {!apiStatus && (
        <div className="mt-20">
          <AllergySelector onSave={handleSaveAllergies} />
        </div>
      )}

      {images.length === 0 && !apiStatus && (
        <div className="flex space-x-4 mt-10 justify-center">
          <label htmlFor="camera-upload" className="w-24 h-24 bg-gray-300 text-black flex items-center justify-center rounded cursor-pointer shadow-md hover:bg-gray-400 transition">
            <Camera className="w-8 h-8" />
            <input id="camera-upload" type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" disabled={apiStatus} />
          </label>

          <label htmlFor="file-upload" className="w-24 h-24 bg-gray-300 text-black flex items-center justify-center rounded cursor-pointer shadow-md hover:bg-gray-400 transition">
            <ImageIcon className="w-8 h-8" />
            <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={apiStatus} />
          </label>
        </div>
      )}

      {images.length > 0 && !apiStatus && (
        <>
          <div className="flex flex-col items-center justify-center min-h-[30vh] mt-4">
            <div className="flex flex-wrap justify-center gap-6">
              {images.map((image, index) => (
                <Image key={index} src={URL.createObjectURL(image)} alt={`プレビュー${index + 1}`} width={192} height={192} className="object-cover rounded shadow" />
              ))}
            </div>
          </div>

          <div className="fixed bottom-4 left-4 z-50">
            <Button type="button" onClick={() => setImages([])} disabled={apiStatus} className="w-24 h-24 bg-gray-300 hover:bg-gray-400 text-black rounded-full shadow-md flex items-center justify-center text-4xl">
              ←
            </Button>
          </div>

          <div className="fixed bottom-4 right-4 z-50">
            <Button type="button" onClick={handleSubmit} disabled={apiStatus} className="w-24 h-24 bg-gray-300 hover:bg-gray-400 text-black rounded-full shadow-md flex items-center justify-center text-4xl">
              {loading ? "…" : "→"}
            </Button>
          </div>
        </>
      )}

      {loading && <Loading message={loadingMessage} />}

      <MenuList items={menuItems} onQuantityChange={updateQuantity} userAllegeries={userAllegeries} />

      {menuItems.length > 0 && (
        <div className="my-4">
          <Button onClick={fetchMoreMenus} disabled={loading}>もっと見る</Button>
        </div>
      )}

      {orderListItemCount > 0 && (
        <button onClick={() => setIsOrderListOpen(true)} className="fixed bottom-16 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-10 flex items-center justify-center">
          <ShoppingCart /> {orderListItemCount}
        </button>
      )}

      <OrderList isOpen={isOrderListOpen} onClose={() => setIsOrderListOpen(false)} cartItems={menuItems.filter(item => item.quantity > 0)} total={orderListTotal} onQuantityChange={updateQuantity} onPlaceOrder={placeOrder} onResetOrder={resetOrder} />

      {apiStatus && <Suggestion detectedLanguage={detectedLanguage} />}
    </div>
  );
}


