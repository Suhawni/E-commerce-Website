import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { CartContext } from '@/App';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/slug/${slug}`);
      setProduct(response.data);
      
      // Set meta tags for social sharing
      document.title = `${response.data.name} - Elegant Artisan`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', response.data.description);
      }
    } catch (error) {
      toast.error('Product not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="navbar px-4 py-4 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="home-link">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Shop</span>
          </Link>
          
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 gold-accent" />
            <h1 className="text-xl font-bold" style={{fontFamily: 'Playfair Display'}}>Elegant Artisan</h1>
          </Link>

          <Link to="/cart" data-testid="cart-link">
            <ShoppingCart className="w-6 h-6 hover:text-amber-600 transition-colors" />
          </Link>
        </div>
      </nav>

      {/* Product Details */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="product-image rounded-lg overflow-hidden mb-4" data-testid="main-product-image">
              {product.images && product.images.length > 0 ? (
                <img
                  src={`${BACKEND_URL}${product.images[selectedImage]}`}
                  alt={product.name}
                  className="w-full h-[500px] object-cover"
                />
              ) : (
                <div className="w-full h-[500px] flex items-center justify-center bg-gray-100">
                  <Sparkles className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-amber-600' : 'border-transparent'}`}
                    data-testid={`thumbnail-${idx}`}
                  >
                    <img
                      src={`${BACKEND_URL}${img}`}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <span className="category-badge mb-4 inline-block" data-testid="product-category">{product.category}</span>
            
            <h1 className="text-4xl font-bold mb-4" style={{fontFamily: 'Playfair Display'}} data-testid="product-title">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold gold-accent" data-testid="product-price">
                ₹{product.price.toLocaleString()}
              </span>
              
              {product.stock > 0 ? (
                <span className="text-green-600 text-sm" data-testid="stock-status">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-red-600 text-sm" data-testid="stock-status">Out of Stock</span>
              )}
            </div>

            <div className="prose max-w-none mb-8">
              <p className="text-gray-600 leading-relaxed" data-testid="product-description">{product.description}</p>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10"
                    data-testid="decrease-quantity"
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-semibold" data-testid="quantity-value">{quantity}</span>
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10"
                    data-testid="increase-quantity"
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="luxury-button flex-1"
                data-testid="add-to-cart-button"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>

              <Button
                variant="outline"
                onClick={handleShare}
                className="w-12 h-12"
                data-testid="share-button"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Product Features */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Product Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Handcrafted with premium materials</li>
                <li>✓ Unique artisan design</li>
                <li>✓ Perfect for gifting</li>
                <li>✓ Authentic craftsmanship</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}