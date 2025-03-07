import { MenuItemData } from "../app/types/MenuItemData";

export const searchImageForMenuItem = async (item: MenuItemData): Promise<string | null> => {
    try {
        // 検索クエリを作成
        const searchQuery = `${item.originalMenuName} food image`;

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