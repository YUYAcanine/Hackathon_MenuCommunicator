import React from 'react';
import { Button } from "@/components/ui/button";
import { MenuItemData } from "../app/types/MenuItemData";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: MenuItemData[];
  total: number;
  onQuantityChange: (id: string, quantity: number) => void;
  onPlaceOrder: (cartItems: MenuItemData[]) => void;
  onResetOrder: () => void;
}

const OrderList: React.FC<CartPanelProps> = ({
  isOpen,
  onClose,
  cartItems,
  total,
  onQuantityChange,
  onPlaceOrder,
  onResetOrder
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">注文内容</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow p-4">
          {cartItems.length === 0 ? (
            <p className="text-center text-gray-500 py-4">カートは空です</p>
          ) : (
            <ul className="space-y-3">
              {cartItems.map(item => (
                <li key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div className="flex-1">
                    <p className="font-medium">{item.translatedMenuName}</p>
                    <p className="text-sm text-gray-500">{item.price} × {item.quantity}</p>
                  </div>
                  
                  <div className="flex items-center border border-gray-300 rounded ml-2">
                    <button 
                      onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-2 py-1">{item.quantity}</span>
                    <button 
                      onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold">合計</span>
            <span className="font-bold text-lg">${total.toFixed(2)}</span>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={onResetOrder} 
              variant="outline" 
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button 
              onClick={() => onPlaceOrder(cartItems)}
              variant="default"
              className="flex-1"
              disabled={cartItems.length === 0}
            >
              注文確定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderList;