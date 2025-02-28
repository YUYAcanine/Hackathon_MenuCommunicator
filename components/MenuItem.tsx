import { MenuItemData } from "../app/types/MenuItemData";

interface MenuItemProps {
    item: MenuItemData;
    onQuantityChange: (id: string, quantity: number) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, onQuantityChange }) => {
    const incrementQuantity = () => {
        onQuantityChange(item.id, item.quantity + 1);
    };
    
    const decrementQuantity = () => {
        if (item.quantity > 0) {
          onQuantityChange(item.id, item.quantity - 1);
        }
    };
    
    return (
        <div className="p-4 sm:p-6 border border-gray-200 rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
                {/* 左側: メニュー名 (原文と翻訳名) */}
                <div className="flex-1">
                    <p className="text-sm text-gray-500 italic mb-1">{item.originalMenuName}</p>
                    <p className="text-lg font-bold text-gray-800">{item.translatedMenuName}</p>
                </div>

                {/* 右側: 価格とカウンター */}
                <div className="flex flex-col items-end">
                    <p className="text-lg font-semibold text-black mb-2">{item.price}</p>
                
                    {/* 数量カウンター */}
                    <div className="flex items-center border border-gray-300 rounded">
                        <button 
                        onClick={decrementQuantity}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        >
                        -
                        </button>
                        <span className="px-3 py-1 text-center w-6">{item.quantity}</span>
                        <button 
                        onClick={incrementQuantity}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        >
                        +
                        </button>
                    </div>
                </div>
            </div>
            
            {/* 下部: 説明文 */}
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{item.description}</p>
            
            {/* 画像をコンテナの下部中央に配置 */}
            <div className="flex justify-center mt-4">
                {item.imageURL ? (
                // img使うとwarningが出るが、無視してOK
                <img
                    src={item.imageURL}
                    alt={item.originalMenuName}
                    className="w-40 h-40 object-cover rounded"
                />
                ) : (
                <div className="w-40 h-40 bg-gray-200 flex items-center justify-center rounded">
                    <span className="text-sm text-gray-500">No image</span>
                </div>
                )}
            </div>
        </div>
    );
};

export default MenuItem;
