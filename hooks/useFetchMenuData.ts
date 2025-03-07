import { useState } from "react";
import { MenuItemData } from "../app/types/MenuItemData";

export const useFetchMenuData = () => {
    const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [apiStatus, setApiStatus] = useState<boolean>(false);
    const fetchMenuData = async (images: File[], translatedLanguage: string) => {
        setLoading(true);
        setMenuItems([]);

        try {
            const formData = new FormData();
            images.forEach((image) => formData.append("images", image));
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

                // 画像検索を適用
                const menuWithImages = await addImagesToMenuItems(menuData);
                setMenuItems(menuWithImages);
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

    return { menuItems, loading, apiStatus, fetchMenuData };
};