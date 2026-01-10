import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AdminSidebar from '@/components/AdminSidebar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateData, setUpdateData] = useState({
    order_status: '',
    tracking_link: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/admin/orders`, { withCredentials: true });
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.order_status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(o =>
        o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setUpdateData({
      order_status: order.order_status,
      tracking_link: order.tracking_link || ''
    });
    setShowDialog(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `${API}/admin/orders/${selectedOrder.id}/status`,
        updateData,
        { withCredentials: true }
      );
      toast.success('Order updated successfully');
      setShowDialog(false);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  return (
    <div className="min-h-screen flex">
      <AdminSidebar user={user} />

      <div className="flex-1 bg-gray-50">
        <header className="bg-white border-b px-8 py-6">
          <h1 className="text-2xl font-bold mb-4" style={{fontFamily: 'Playfair Display'}} data-testid="orders-title">
            Orders Management
          </h1>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by order number, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-orders-input"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="status-filter-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <main className="p-8">
          {loading ? (
            <div className="bg-white rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="shimmer h-16 w-full"></div>
                ))}
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500" data-testid="no-orders-message">No orders found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden elegant-card">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="orders-table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-sm">Order #</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm">Customer</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm">Contact</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm">Amount</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm">Payment</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="border-t hover:bg-gray-50" data-testid={`order-row-${order.id}`}>
                        <td className="py-4 px-6">
                          <span className="font-mono font-semibold" data-testid={`order-number-${order.id}`}>{order.order_number}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-semibold">{order.customer_name}</p>
                            <p className="text-sm text-gray-600">{order.customer_email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm">{order.phone}</p>
                          <p className="text-xs text-gray-600 line-clamp-1">{order.shipping_address}</p>
                        </td>
                        <td className="py-4 px-6 font-semibold gold-accent" data-testid={`order-amount-${order.id}`}>
                          ₹{order.total_amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm uppercase">{order.payment_method}</p>
                            <p className="text-xs text-gray-600">{order.payment_status}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`status-badge status-${order.order_status}`} data-testid={`order-status-${order.id}`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            onClick={() => handleOpenDialog(order)}
                            variant="outline"
                            size="sm"
                            data-testid={`edit-order-${order.id}`}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Update Order Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent data-testid="update-order-dialog">
          <DialogHeader>
            <DialogTitle style={{fontFamily: 'Playfair Display'}} data-testid="dialog-title">
              Update Order Status
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="font-semibold" data-testid="dialog-order-number">{selectedOrder.order_number}</p>
              </div>

              <div>
                <Label htmlFor="order_status">Order Status *</Label>
                <Select
                  value={updateData.order_status}
                  onValueChange={(value) => setUpdateData({ ...updateData, order_status: value })}
                >
                  <SelectTrigger data-testid="status-update-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tracking_link">Tracking Link (Optional)</Label>
                <Input
                  id="tracking_link"
                  type="url"
                  placeholder="https://tracking.example.com/..."
                  value={updateData.tracking_link}
                  onChange={(e) => setUpdateData({ ...updateData, tracking_link: e.target.value })}
                  data-testid="tracking-link-input"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} data-testid="cancel-button">
                  Cancel
                </Button>
                <Button type="submit" className="luxury-button" data-testid="save-order-button">
                  Update Order
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}