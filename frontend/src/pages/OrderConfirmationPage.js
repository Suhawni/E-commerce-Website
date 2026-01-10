import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Sparkles, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderNumber}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <Link to="/">
            <Button className="luxury-button">Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" data-testid="success-icon" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{fontFamily: 'Playfair Display'}} data-testid="confirmation-title">
            Order Confirmed!
          </h1>
          <p className="text-gray-600">Thank you for your purchase</p>
        </div>

        <div className="elegant-card p-8 rounded-lg mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="text-2xl font-bold gold-accent" data-testid="order-number">{order.order_number}</p>
              </div>
              <span className="status-badge status-processing" data-testid="order-status">{order.order_status}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Customer Name</p>
                <p className="font-semibold" data-testid="customer-name">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Email</p>
                <p className="font-semibold" data-testid="customer-email">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Phone</p>
                <p className="font-semibold" data-testid="customer-phone">{order.phone}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Payment Method</p>
                <p className="font-semibold uppercase" data-testid="payment-method">{order.payment_method}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-600 mb-1">Shipping Address</p>
              <p className="font-semibold" data-testid="shipping-address">{order.shipping_address}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center" data-testid={`order-item-${idx}`}>
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-bold gold-accent">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total Amount</span>
                <span className="gold-accent" data-testid="total-amount">₹{order.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <Package className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">What's Next?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ You'll receive an email confirmation shortly</li>
                <li>✓ We'll notify you when your order ships</li>
                <li>✓ Track your order using the order number above</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link to="/track-order" className="flex-1">
            <Button variant="outline" className="w-full" data-testid="track-order-button">Track Order</Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button className="luxury-button w-full" data-testid="continue-shopping-button">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}