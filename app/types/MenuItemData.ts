export type MenuItemData = {
    id: string;
    originalMenuName: string;
    translatedMenuName: string;
    description: string;
    price: string;
    quantity: number;
    imageURL?: string;
    spicyLevel: number;
    allergyInfo: allergyInfo[];
};

type allergyInfo = {
    id: string;
    name: string;
}