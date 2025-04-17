import React from "react";
import MenuItem from "./MenuItem";
import { MenuItemData } from "../app/types/MenuItemData";

interface MenuListProps {
    items: MenuItemData[];
    onQuantityChange: (id: string, quantity: number) => void;
    userAllegeries: string[];
  }

const MenuList: React.FC<MenuListProps> = ({ items, onQuantityChange, userAllegeries}) => {
  return (
    <div className="space-y-4 w-full max-w-md mt-4 mb-8">
      {items.length > 0 ? (
        items.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            onQuantityChange={onQuantityChange}
            userAllegeries={userAllegeries}
          />
        ))
      ) : (
        <p className="text-gray-500 text-center">メニューを撮影、またはアップロードしてください</p>
      )}
    </div>
  );
};

export default MenuList;
