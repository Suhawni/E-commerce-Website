import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Search, Sparkles } from 'lucide-react';
import { CartContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { cart, addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, category, searchQuery]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="navbar sticky top-0 z-50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 gold-accent" />
            <h1 className="text-2xl font-bold" style={{fontFamily: 'Playfair Display'}}>Elegant Artisan</h1>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/track-order" className="text-sm hover:text-amber-600 transition-colors" data-testid="track-order-link">
              Track Order
            </Link>
            <Link to="/cart" className="relative" data-testid="cart-link">
              <ShoppingCart className="w-6 h-6 hover:text-amber-600 transition-colors" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" data-testid="cart-count">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="luxury-gradient text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style={{fontFamily: 'Playfair Display'}} data-testid="hero-title">
            Exquisite Handcrafted Treasures
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto opacity-90" data-testid="hero-subtitle">
            Discover our curated collection of premium jewellery and artisan wooden creations
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => setCategory('all')}
              variant={category === 'all' ? 'default' : 'outline'}
              className={category === 'all' ? 'luxury-button' : ''}
              data-testid="filter-all"
            >
              All
            </Button>
            <Button
              onClick={() => setCategory('jewellery')}
              variant={category === 'jewellery' ? 'default' : 'outline'}
              className={category === 'jewellery' ? 'luxury-button' : ''}
              data-testid="filter-jewellery"
            >
              Jewellery
            </Button>
            <Button
              onClick={() => setCategory('wooden')}
              variant={category === 'wooden' ? 'default' : 'outline'}
              className={category === 'wooden' ? 'luxury-button' : ''}
              data-testid="filter-wooden"
            >
              Wooden Items
            </Button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="elegant-card rounded-lg overflow-hidden">
                <div className="shimmer h-64 w-full"></div>
                <div className="p-4 space-y-2">
                  <div className="shimmer h-4 w-3/4"></div>
                  <div className="shimmer h-4 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg" data-testid="no-products-message">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="products-grid">
            {filteredProducts.map(product => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="elegant-card rounded-lg overflow-hidden block"
                data-testid={`product-card-${product.id}`}
              >
                <div className="product-image h-64 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={`${BACKEND_URL}${product.images[0]}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Sparkles className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="category-badge">{product.category}</span>
                    {product.stock <= 0 && (
                      <span className="text-xs text-red-500">Out of Stock</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg mb-1" style={{fontFamily: 'Playfair Display'}} data-testid={`product-name-${product.id}`}>
                    {product.name}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold gold-accent" data-testid={`product-price-${product.id}`}>
                      ₹{product.price.toLocaleString()}
                    </span>

                    <Button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={product.stock <= 0}
                      className="luxury-button text-xs"
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="luxury-gradient text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="opacity-80">© 2025 Elegant Artisan. Crafted with passion.</p>
        </div>
      </footer>
    </div>
  );
}