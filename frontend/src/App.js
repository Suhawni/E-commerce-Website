import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';

// Customer Pages
import HomePage from '@/pages/HomePage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderConfirmationPage from '@/pages/OrderConfirmationPage';
import OrderTrackingPage from '@/pages/OrderTrackingPage';

// Admin Pages
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Cart Context
export const CartContext = React.createContext();

function App() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Check auth status
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity }];
    }

    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const newCart = cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const cartValue = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <CartContext.Provider value={cartValue}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
            <Route path="/track-order" element={<OrderTrackingPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={user ? <Navigate to="/admin/dashboard" /> : <AdminLoginPage onAuth={checkAuth} />} />
            <Route path="/admin/dashboard" element={user ? <AdminDashboard user={user} /> : <Navigate to="/admin/login" />} />
            <Route path="/admin/products" element={user ? <AdminProducts user={user} /> : <Navigate to="/admin/login" />} />
            <Route path="/admin/orders" element={user ? <AdminOrders user={user} /> : <Navigate to="/admin/login" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </CartContext.Provider>
  );
}

import React from 'react';

export default App;