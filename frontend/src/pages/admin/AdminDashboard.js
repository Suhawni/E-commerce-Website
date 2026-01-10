import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Package, ShoppingBag, LogOut, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminSidebar from '@/components/AdminSidebar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/admin/orders`, { withCredentials: true })
      ]);

      const products = productsRes.data;
      const orders = ordersRes.data;
      const revenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: revenue,
        recentOrders: orders.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AdminSidebar user={user} />

      <div className="flex-1 bg-gray-50">
        <header className="bg-white border-b px-8 py-6">
          <h1 className="text-2xl font-bold" style={{fontFamily: 'Playfair Display'}} data-testid="dashboard-title">
            Dashboard Overview
          </h1>
        </header>

        <main className="p-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg">
                  <div className="shimmer h-8 w-32 mb-2"></div>
                  <div className="shimmer h-12 w-24"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg elegant-card" data-testid="products-stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-600">Total Products</h3>
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-3xl font-bold gold-accent" data-testid="total-products">{stats.totalProducts}</p>
                </div>

                <div className="bg-white p-6 rounded-lg elegant-card" data-testid="orders-stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-600">Total Orders</h3>
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold" data-testid="total-orders">{stats.totalOrders}</p>
                </div>

                <div className="bg-white p-6 rounded-lg elegant-card" data-testid="revenue-stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-600">Total Revenue</h3>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold gold-accent" data-testid="total-revenue">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg p-6 elegant-card">
                <h2 className="text-xl font-bold mb-4" style={{fontFamily: 'Playfair Display'}} data-testid="recent-orders-title">
                  Recent Orders
                </h2>

                {stats.recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8" data-testid="no-orders-message">No orders yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-sm">Order #</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Customer</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                        </tr>
                      </thead>
                      <tbody data-testid="recent-orders-table">
                        {stats.recentOrders.map(order => (
                          <tr key={order.id} className="border-b hover:bg-gray-50" data-testid={`order-row-${order.id}`}>
                            <td className="py-3 px-4">
                              <Link to="/admin/orders" className="text-amber-600 hover:underline" data-testid={`order-number-${order.id}`}>
                                {order.order_number}
                              </Link>
                            </td>
                            <td className="py-3 px-4">{order.customer_name}</td>
                            <td className="py-3 px-4 font-semibold">₹{order.total_amount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`status-badge status-${order.order_status}`}>{order.order_status}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-6">
                  <Link to="/admin/orders">
                    <Button variant="outline" data-testid="view-all-orders-button">View All Orders</Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}