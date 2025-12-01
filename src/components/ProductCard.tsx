import { memo } from 'react';
import { Product } from '../types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard = memo(function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden group"
      onClick={() => onAdd(product)}
    >
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.imageUrl ? (
            <ImageWithFallback
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <span className="text-6xl">🥤</span>
            </div>
          )}
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category Badge */}
          {product.category && (
            <Badge className="absolute top-2 right-2 bg-white/90 text-gray-800 backdrop-blur-sm">
              {product.category}
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          <h3 className="text-center truncate">{product.name}</h3>
          
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <div className="text-2xl text-[#0B69FF]">{product.price} ج.م</div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">التكلفة: {product.cost} ج.م</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ربح: {product.profit} ج.م
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default ProductCard;