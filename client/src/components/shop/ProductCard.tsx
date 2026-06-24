import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { lkr } from '../../utils/format';

interface ProductCardProps {
  product: Product;
}

function getPrimaryImage(product: Product): string | null {
  const images = product.product_images;
  if (!images?.length) return null;
  return (images.find((i) => i.is_primary) ?? images[0]).cloudinary_url;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getPrimaryImage(product);

  return (
    <Link to={`/product/${product.id}`} className="group block bg-bg border border-border">
      {/* Image */}
      <div className="aspect-[3/4] bg-surface overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-75"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-6xl text-border select-none">まに</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-5 pt-4 pb-6 border-t border-border">
        <p className="font-display text-[1rem] text-ink leading-snug mb-1 transition-opacity duration-300 group-hover:opacity-75">
          {product.name}
        </p>
        <p className="font-body text-[11px] text-ink-2 tracking-[0.08em]">
          {lkr(product.price)}
        </p>
      </div>
    </Link>
  );
}
