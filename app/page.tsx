"use client";

import { Button } from "@/components/ui/button";
import { ChangeEvent, useState, useEffect } from "react";
import MenuList from "@/components/MenuList";
import OrderList from "@/components/OrderList";
import Loading from "@/components/Loading";
import Suggestion from "@/components/Suggestion";
import { ShoppingCart, Camera, Image as ImageIcon } from "lucide-react";
import TranslatedLanguageSelector from "@/components/TranslatedLanguageSelector";
import { AllergySelector } from "@/components/AllergySelector";
import { MenuItemData } from "./types/MenuItemData";
import { useRouter } from "next/navigation";
import { searchImageForMenuItem } from "@/utils/imageSearch";
import Image from "next/image";
import imageCompression from "browser-image-compression";

// OCR で得た料理名+価格のみ
type MenuSummary = { name: string; price: string };

export default function Home() {
  // 基本 state
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // OCR → menuList, その詳細 → menuItems
  const [menuList, setMenuList] = useState<MenuSummary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // 何件読込み済みか
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);

  // その他表示関連
  const [orderListTotal, setOrderListTotal] = useState(0);
  const [orderListItemCount, setOrderListItemCount] = useState(0);
  const [isOrderListOpen, setIsOrderListOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState(false);

  // ローディングと画像検索
  const [loadingMessage, setLoadingMessage] = useState("メニューを解析中...");
  const [imageSearchProgress, setImageSearchProgress] = useState(0);
  const [totalItemsToSearch, setTotalItemsToSearch] = useState(0);

  // ユーザー設定
  const [translatedLanguage, setTranslatedLanguage] = useState("日本語");
  const [detectedLanguage, setDetectedLanguage] = useState("日本語");
  const [userAllegeries, setUserAllergies] = useState<string[]>([]);

  const router = useRouter();

  /* -------------------- 画像アップロード -------------------- */
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const compressed = await Promise.all(
      Array.from(e.target.files).map(async (file) => {
        try {
          return await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true });
        } catch {
          return file;
        }
      })
    );
    setImages(compressed);
  };

  /* -------------------- OCR 呼び出し -------------------- */
  const handleSubmit = async () => {
    setLoading(true);
    setLoadingMessage("メニューを解析中...");

    try {
      const fd = new FormData();
      images.forEach((img) => fd.append("images", img));
      fd.append("translatedLanguage", translatedLanguage);
      const res = await fetch("/api/gemini-ocr", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR 失敗");

      setMenuList(data.menuList as MenuSummary[]);
      setDetectedLanguage(data.detectedLanguage);
      localStorage.setItem("detectedLanguage", data.detectedLanguage);
      setApiStatus(true);

      // 最初の 6 件詳細取得
      await loadNextDetails(0, data.menuList as MenuSummary[]);
    } catch (e) {
      console.error(e);
      setApiStatus(false);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- 詳細取得 (6 件ずつ) -------------------- */
  const loadNextDetails = async (start: number, list = menuList) => {
    const slice = list.slice(start, start + 6);
    if (slice.length === 0) return;

    setLoading(true);
    setLoadingMessage("詳細を取得中...");

    try {
      const res = await fetch("/api/gemini-describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItems: slice, translatedLanguage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "describe 失敗");

      // id と quantity 付与
      const detailed: MenuItemData[] = data.detailedMenus.map((m: any, i: number) => ({
        ...m,
        id: `menu-${start + i + 1}`,
        quantity: 0,
      }));

      // 画像検索
      const withImg = await addImagesToMenuItems(detailed);
      setMenuItems((prev) => [...prev, ...withImg]);
      setCurrentIndex(start + slice.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- 画像検索 -------------------- */
  const addImagesToMenuItems = async (items: MenuItemData[]) => {
    setImageSearchProgress(0);
    setTotalItemsToSearch(items.length);
    const updated = [...items];
    for (let i = 0; i < items.length; i++) {
      const url = await searchImageForMenuItem(items[i]);
      if (url) updated[i].imageURL = url;
      setImageSearchProgress(i + 1);
    }
    return updated;
  };

  /* -------------------- 続きを読み込む -------------------- */
  const handleLoadMore = async () => {
    await loadNextDetails(currentIndex);
  };

  /* -------------------- Quantity / Order など -------------------- */
  useEffect(() => {
    const totalQty = menuItems.reduce((t, m) => t + m.quantity, 0);
    setOrderListItemCount(totalQty);
    const totalPrice = menuItems.reduce((sum, m) => {
      // price が数値または undefined の場合に備え安全に文字列化
      const priceStr = m.price !== undefined && m.price !== null ? String(m.price) : "0";
      const num = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
      return sum + num * m.quantity;
    }, 0);

    setOrderListTotal(totalPrice);(totalPrice);
  }, [menuItems]);

  const updateQuantity = (id: string, qty: number) => setMenuItems((prev) => prev.map((m) => (m.id === id ? { ...m, quantity: qty } : m)));
  const resetOrder = () => setMenuItems((prev) => prev.map((m) => ({ ...m, quantity: 0 })));  
  const placeOrder = () => {
    const ordered = menuItems.filter((m) => m.quantity > 0);
    if (!ordered.length) return;
    localStorage.setItem("orderItems", JSON.stringify(ordered));
    router.push("/order");
  };

  /* -------------------- JSX -------------------- */
  return (
    <div className="relative flex flex-col items-center min-h-screen pt-4">
      {/* 言語 & アレルギー設定 */}
      {!apiStatus && (
        <>
          <div className="fixed top-4 right-4 z-50">
            <TranslatedLanguageSelector translatedLanguage={translatedLanguage} onChange={(e) => setTranslatedLanguage(e.target.value)} />
          </div>
          <div className="mt-20">
            <AllergySelector onSave={setUserAllergies} />
          </div>
        </>
      )}

      {/* 画像アップロード UI */}
      {images.length === 0 && !apiStatus && (
        <div className="flex space-x-4 mt-10 justify-center">
          <label htmlFor="camera-upload" className="w-24 h-24 bg-gray-300 flex items-center justify-center rounded cursor-pointer shadow-md">
            <Camera className="w-8 h-8" />
            <input id="camera-upload" type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
          </label>
          <label htmlFor="file-upload" className="w-24 h-24 bg-gray-300 flex items-center justify-center rounded cursor-pointer shadow-md">
            <ImageIcon className="w-8 h-8" />
            <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>
      )}

      {/* 画像プレビュー & 開始ボタン */}
      {!apiStatus && images.length > 0 && (
        <>
          <div className="flex flex-wrap justify-center gap-6 mt-4">
            {images.map((img, i) => (
              <Image key={i} src={URL.createObjectURL(img)} alt="preview" width={192} height={192} className="rounded shadow" />
            ))}
          </div>

          {/* ← 戻る */}
          <div className="fixed bottom-4 left-4 z-50">
            <Button
              type="button"
              onClick={() => setImages([])}
              className="w-16 h-16 text-3xl rounded-full bg-gray-300 hover:bg-gray-400 shadow"
            >
              ←
            </Button>
          </div>

          {/* → 進む */}
          <div className="fixed bottom-4 right-4 z-50">
            <Button
              type="button"
              onClick={handleSubmit}
              className="w-16 h-16 text-3xl rounded-full bg-gray-300 hover:bg-gray-400 shadow"
            >
              {loading ? "…" : "→"}
            </Button>
          </div>
        </>
      )}

      {loading && <Loading message={loadingMessage} />}

      {loading && <Loading message={loadingMessage} />}

      {/* メニュー表示 */}
      <MenuList items={menuItems} onQuantityChange={updateQuantity} userAllegeries={userAllegeries} />

      {/* 続きを読み込む */}
      {!loading && currentIndex < menuList.length && menuList.length > 0 && (
        <Button onClick={handleLoadMore} className="my-4 px-6 py-3">続きを読み込む</Button>
      )}

      {/* カート */}
      {orderListItemCount > 0 && (
        <button onClick={() => setIsOrderListOpen(true)} className="fixed bottom-16 right-4 bg-blue-600 text-white p-3 rounded-full flex items-center">
          <ShoppingCart className="mr-1" /> {orderListItemCount}
        </button>
      )}

      <OrderList isOpen={isOrderListOpen} onClose={() => setIsOrderListOpen(false)} cartItems={menuItems.filter((m) => m.quantity > 0)} total={orderListTotal} onQuantityChange={updateQuantity} onPlaceOrder={placeOrder} onResetOrder={resetOrder} />

      {apiStatus && <Suggestion detectedLanguage={detectedLanguage} />}
    </div>
  );
}
