import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Sparkles, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await axios.get(`${API}/orders/${orderNumber.trim()}`);
      setOrder(response.data);
    } catch (error) {
      setOrder(null);
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Package className="w-8 h-8 text-amber-600" />;
      case 'shipped':
        return <Truck className="w-8 h-8 text-blue-600" />;
      case 'delivered':
        return <CheckCircle2 className="w-8 h-8 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Package className="w-8 h-8 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="navbar px-4 py-4 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="home-link">
            <Sparkles className="w-6 h-6 gold-accent" />
            <h1 className="text-2xl font-bold" style={{fontFamily: 'Playfair Display'}}>Elegant Artisan</h1>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-center" style={{fontFamily: 'Playfair Display'}} data-testid="tracking-title">
          Track Your Order
        </h1>
        <p className="text-gray-600 text-center mb-8">Enter your order number to check status</p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="elegant-card p-6 rounded-lg">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Enter order number (e.g., ORD-XXX)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="flex-1"
                data-testid="order-number-input"
              />
              <Button
                type="submit"
                disabled={loading}
                className="luxury-button"
                data-testid="search-order-button"
              >
                <Search className="w-5 h-5 mr-2" />
                {loading ? 'Searching...' : 'Track'}
              </Button>
            </div>
          </div>
        </form>

        {/* Order Details */}
        {searched && order && (
          <div className="elegant-card p-8 rounded-lg" data-testid="order-details">
            <div className="text-center mb-8">
              {getStatusIcon(order.order_status)}
              <h2 className="text-2xl font-bold mt-4 mb-2" style={{fontFamily: 'Playfair Display'}} data-testid="order-number-display">
                Order #{order.order_number}
              </h2>
              <span className={`status-badge status-${order.order_status}`} data-testid="order-status-badge">
                {order.order_status}
              </span>
            </div>

            {/* Order Timeline */}
            <div className="space-y-6 mb-8">
              <div className={`flex gap-4 ${order.order_status === 'processing' || order.order_status === 'shipped' || order.order_status === 'delivered' ? 'opacity-100' : 'opacity-30'}`}>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Order Processing</h3>
                  <p className="text-sm text-gray-600">Your order is being prepared</p>
                </div>
              </div>

              <div className={`flex gap-4 ${order.order_status === 'shipped' || order.order_status === 'delivered' ? 'opacity-100' : 'opacity-30'}`}>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Shipped</h3>
                  <p className="text-sm text-gray-600">Your order is on the way</p>
                  {order.tracking_link && (
                    <a
                      href={order.tracking_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-amber-600 hover:underline"
                      data-testid="tracking-link"
                    >
                      Track Shipment →
                    </a>
                  )}
                </div>
              </div>

              <div className={`flex gap-4 ${order.order_status === 'delivered' ? 'opacity-100' : 'opacity-30'}`}>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Delivered</h3>
                  <p className="text-sm text-gray-600">Order successfully delivered</p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="border-t pt-6">
              <h3 className="font-bold mb-4">Order Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600 mb-1">Customer</p>
                  <p className="font-semibold" data-testid="customer-info">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Total Amount</p>
                  <p className="font-semibold gold-accent" data-testid="order-total">₹{order.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Payment Method</p>
                  <p className="font-semibold uppercase" data-testid="payment-info">{order.payment_method}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Payment Status</p>
                  <p className="font-semibold" data-testid="payment-status">{order.payment_status}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Items</p>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.product_name} x {item.quantity}</span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {searched && !order && !loading && (
          <div className="text-center py-12" data-testid="no-order-found">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600">No order found with this number</p>
          </div>
        )}
      </div>
    </div>
  );
}