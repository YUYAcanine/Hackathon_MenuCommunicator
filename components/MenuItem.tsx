import { MenuItemData } from "../app/types/MenuItemData";

interface MenuItemProps {
    item: MenuItemData;
    onQuantityChange: (id: string, quantity: number) => void;
    userAllegeries: string[];
}

const MenuItem: React.FC<MenuItemProps> = ({ item, onQuantityChange, userAllegeries }) => {
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
            
            {/* 下部: 情報と画像を横に並べる */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4">
                {/* 左側: 辛さレベルとアレルギー情報 */}
                <div className="flex flex-col space-y-4">
                {/* 辛さレベル */}
                    <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 mr-2">辛さレベル予想:</span>
                        <div >
                            {item.spicyLevel > 0 ? (
                                Array.from({ length: item.spicyLevel }, (_, i) => (
                                    <span key={i} role="img" aria-label="spicy" className="mr-0.5">🔥</span>
                                ))
                            ) : (
                                <span>0</span>
                            )}
                        </div>
                    </div>
                
                
                {/* アレルギー情報 */}
                {item.allergyInfo && item.allergyInfo.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700 block mb-1">アレルギー予想:</span>
                        <div className="flex flex-row flex-wrap gap-1">
                            {item.allergyInfo.map(({id, name }, index) => (
                            <span 
                                key={index} 
                                className={`inline-block px-2 py-1 text-yellow-800 text-xs rounded-full
                                    ${userAllegeries.includes(id) ? 'bg-red-200' : 'bg-yellow-100'}`}
                            >
                                {name}
                            </span>
                            ))}
                        </div>
                    </div>
                )}
                </div>
                
                {/* 右側: 画像 */}
                <div className="flex justify-center sm:justify-end w-full sm:w-auto mt-2">
                {item.imageURL ? (
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
        </div>
    );
};

export default MenuItem;
