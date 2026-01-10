import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Package, ShoppingBag, LogOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminSidebar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-sidebar w-64 p-6 flex flex-col" data-testid="admin-sidebar">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-8 h-8" style={{color: '#d4af37'}} />
          <h1 className="text-xl font-bold" style={{fontFamily: 'Playfair Display', color: '#d4af37'}}>
            Elegant Artisan
          </h1>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg" style={{background: 'rgba(212, 175, 55, 0.1)'}}>
          <Avatar>
            <AvatarImage src={user.picture} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm" style={{color: '#d4af37'}} data-testid="admin-name">{user.name}</p>
            <p className="text-xs opacity-80" data-testid="admin-email">{user.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <Link
          to="/admin/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/admin/dashboard')
              ? 'bg-amber-600 text-white'
              : 'hover:bg-white hover:bg-opacity-10'
          }`}
          data-testid="nav-dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>

        <Link
          to="/admin/products"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/admin/products')
              ? 'bg-amber-600 text-white'
              : 'hover:bg-white hover:bg-opacity-10'
          }`}
          data-testid="nav-products"
        >
          <Package className="w-5 h-5" />
          <span className="font-medium">Products</span>
        </Link>

        <Link
          to="/admin/orders"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/admin/orders')
              ? 'bg-amber-600 text-white'
              : 'hover:bg-white hover:bg-opacity-10'
          }`}
          data-testid="nav-orders"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="font-medium">Orders</span>
        </Link>
      </nav>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full justify-start gap-3 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
        data-testid="logout-button"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </Button>
    </div>
  );
}