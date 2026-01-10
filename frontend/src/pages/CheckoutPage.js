import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles } from 'lucide-react';
import { CartContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CheckoutPage() {
  const { cart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState('');
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    phone: '',
    shipping_address: '',
    payment_method: 'cod'
  });

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 100;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (orderId) => {
    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Failed to load payment gateway');
      return;
    }

    // Create Razorpay order
    const razorpayOrderResponse = await axios.post(`${API}/payment/create-order`, null, {
      params: { amount: total }
    });
    const razorpayOrder = razorpayOrderResponse.data;

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || razorpayKey,
      amount: razorpayOrder.amount,
      currency: 'INR',
      order_id: razorpayOrder.id,
      name: 'Elegant Artisan',
      description: 'Order Payment',
      handler: async function (response) {
        try {
          await axios.post(`${API}/payment/verify`, {
            order_id: orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          
          clearCart();
          navigate(`/order-confirmation/${orderId}`);
        } catch (error) {
          toast.error('Payment verification failed');
        }
      },
      prefill: {
        name: formData.customer_name,
        email: formData.customer_email,
        contact: formData.phone
      },
      theme: {
        color: '#d4af37'
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_email || !formData.phone || !formData.shipping_address) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        ...formData,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: total
      };

      const response = await axios.post(`${API}/orders`, orderData);
      const order = response.data;

      if (formData.payment_method === 'online') {
        await handleRazorpayPayment(order.id);
      } else {
        clearCart();
        navigate(`/order-confirmation/${order.order_number}`);
      }
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="navbar px-4 py-4 border-b">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2" data-testid="home-link">
            <Sparkles className="w-6 h-6 gold-accent" />
            <h1 className="text-2xl font-bold" style={{fontFamily: 'Playfair Display'}}>Elegant Artisan</h1>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8" style={{fontFamily: 'Playfair Display'}} data-testid="checkout-title">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <div className="elegant-card p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4" style={{fontFamily: 'Playfair Display'}}>Customer Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    required
                    data-testid="customer-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="customer_email">Email *</Label>
                  <Input
                    id="customer_email"
                    name="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={handleChange}
                    required
                    data-testid="customer-email-input"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    data-testid="customer-phone-input"
                  />
                </div>

                <div>
                  <Label htmlFor="shipping_address">Shipping Address *</Label>
                  <Textarea
                    id="shipping_address"
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleChange}
                    rows={4}
                    required
                    data-testid="shipping-address-input"
                  />
                </div>
              </div>
            </div>

            <div className="elegant-card p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4" style={{fontFamily: 'Playfair Display'}}>Payment Method</h2>
              
              <RadioGroup
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                data-testid="payment-method-group"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="cod" id="cod" data-testid="payment-cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-semibold">Cash on Delivery</div>
                      <div className="text-sm text-gray-500">Pay when you receive</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="online" id="online" data-testid="payment-online" />
                  <Label htmlFor="online" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-semibold">Online Payment (UPI/Cards)</div>
                      <div className="text-sm text-gray-500">Pay via Razorpay</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="luxury-button w-full"
              data-testid="place-order-button"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </Button>
          </form>

          {/* Order Summary */}
          <div>
            <div className="elegant-card p-6 rounded-lg sticky top-4">
              <h2 className="text-xl font-bold mb-4" style={{fontFamily: 'Playfair Display'}} data-testid="order-summary-title">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold" data-testid="checkout-subtotal">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold" data-testid="checkout-shipping">₹{shipping.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl gold-accent" data-testid="checkout-total">₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}