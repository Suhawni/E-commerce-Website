import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AdminSidebar from '@/components/AdminSidebar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminProducts({ user }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: 'jewellery',
    stock: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        description: product.description,
        category: product.category,
        stock: product.stock.toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        description: '',
        category: 'jewellery',
        stock: ''
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, productData, { withCredentials: true });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API}/products`, productData, { withCredentials: true });
        toast.success('Product created successfully');
      }

      setShowDialog(false);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleImageUpload = async (productId, files) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      await axios.post(`${API}/products/${productId}/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Images uploaded successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`${API}/products/${productId}`, { withCredentials: true });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="min-h-screen flex">
      <AdminSidebar user={user} />

      <div className="flex-1 bg-gray-50">
        <header className="bg-white border-b px-8 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{fontFamily: 'Playfair Display'}} data-testid="products-title">
            Products Management
          </h1>
          <Button onClick={() => handleOpenDialog()} className="luxury-button" data-testid="add-product-button">
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </header>

        <main className="p-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg overflow-hidden">
                  <div className="shimmer h-48 w-full"></div>
                  <div className="p-4 space-y-2">
                    <div className="shimmer h-4 w-3/4"></div>
                    <div className="shimmer h-4 w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-4" data-testid="no-products-message">No products yet</p>
              <Button onClick={() => handleOpenDialog()} className="luxury-button">Add Your First Product</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="products-grid">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-lg overflow-hidden elegant-card" data-testid={`product-card-${product.id}`}>
                  <div className="h-48 bg-gray-100 relative group">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={`${BACKEND_URL}${product.images[0]}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    
                    <label className="absolute bottom-2 right-2 bg-white p-2 rounded-full cursor-pointer shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-5 h-5 text-amber-600" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(product.id, e.target.files)}
                        data-testid={`upload-images-${product.id}`}
                      />
                    </label>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="category-badge">{product.category}</span>
                      <span className="text-xs text-gray-600">Stock: {product.stock}</span>
                    </div>

                    <h3 className="font-semibold mb-1" style={{fontFamily: 'Playfair Display'}} data-testid={`product-name-${product.id}`}>
                      {product.name}
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    <p className="text-lg font-bold gold-accent mb-3" data-testid={`product-price-${product.id}`}>
                      ₹{product.price.toLocaleString()}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenDialog(product)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        data-testid={`edit-product-${product.id}`}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(product.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        data-testid={`delete-product-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle style={{fontFamily: 'Playfair Display'}} data-testid="dialog-title">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="product-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  data-testid="product-price-input"
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  data-testid="product-stock-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger data-testid="product-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jewellery" data-testid="category-jewellery">Jewellery</SelectItem>
                  <SelectItem value="wooden" data-testid="category-wooden">Wooden Items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
                data-testid="product-description-input"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} data-testid="cancel-button">
                Cancel
              </Button>
              <Button type="submit" className="luxury-button" data-testid="save-product-button">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}