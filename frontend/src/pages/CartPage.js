import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { CartContext } from '@/App';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 100 : 0;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="navbar px-4 py-4 border-b">
          <div className="max-w-7xl mx-auto">
            <Link to="/" className="flex items-center gap-2" data-testid="home-link">
              <Sparkles className="w-6 h-6 gold-accent" />
              <h1 className="text-2xl font-bold" style={{fontFamily: 'Playfair Display'}}>Elegant Artisan</h1>
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center" data-testid="empty-cart-message">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{fontFamily: 'Playfair Display'}}>Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Discover our exquisite collection</p>
            <Link to="/">
              <Button className="luxury-button" data-testid="continue-shopping-button">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="navbar px-4 py-4 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="home-link">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Continue Shopping</span>
          </Link>
          
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 gold-accent" />
            <h1 className="text-xl font-bold" style={{fontFamily: 'Playfair Display'}}>Elegant Artisan</h1>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8" style={{fontFamily: 'Playfair Display'}} data-testid="cart-title">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="elegant-card p-4 rounded-lg flex gap-4" data-testid={`cart-item-${item.id}`}>
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={`${BACKEND_URL}${item.images[0]}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold mb-1" style={{fontFamily: 'Playfair Display'}} data-testid={`cart-item-name-${item.id}`}>
                    {item.name}
                  </h3>
                  <span className="category-badge text-xs">{item.category}</span>
                  <p className="text-lg font-bold gold-accent mt-2" data-testid={`cart-item-price-${item.id}`}>
                    ₹{item.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    data-testid={`remove-item-${item.id}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8"
                      data-testid={`decrease-quantity-${item.id}`}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-semibold" data-testid={`cart-item-quantity-${item.id}`}>{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8"
                      data-testid={`increase-quantity-${item.id}`}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="elegant-card p-6 rounded-lg sticky top-4">
              <h2 className="text-xl font-bold mb-4" style={{fontFamily: 'Playfair Display'}} data-testid="order-summary-title">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold" data-testid="subtotal-amount">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold" data-testid="shipping-amount">₹{shipping.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl gold-accent" data-testid="total-amount">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/checkout')}
                className="luxury-button w-full"
                data-testid="proceed-checkout-button"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}