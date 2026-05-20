import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  Package,
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  RefreshCw,
  Search,
  GraduationCap,
  User,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Crown,
  ToggleLeft,
  ToggleRight,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ProductCatalogService, { Product } from '@/services/productCatalogService';
import ImageUpload from './ImageUpload';

const ProductCatalogManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'training' | 'personal'>('training');
  const [trainingProducts, setTrainingProducts] = useState<Product[]>([]);
  const [personalProducts, setPersonalProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    brand: '',
    price: 0,
    category: '',
    image: '',
    commission: 0,
    vip_level: 'vip2',
    status: 'active',
    is_active: true
  });

  // Load products on mount and subscribe to realtime changes
  useEffect(() => {
    loadProducts();

    // Subscribe to realtime changes
    ProductCatalogService.subscribeToTrainingProducts((products) => {
      console.log('[ProductCatalogManager] Training products updated via realtime:', products.length);
      setTrainingProducts(products);
    });

    ProductCatalogService.subscribeToPersonalProducts((products) => {
      console.log('[ProductCatalogManager] Personal products updated via realtime:', products.length);
      setPersonalProducts(products);
    });

    // Cleanup subscriptions on unmount
    return () => {
      ProductCatalogService.unsubscribeFromTrainingProducts();
      ProductCatalogService.unsubscribeFromPersonalProducts();
    };
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const [training, personal] = await Promise.all([
        ProductCatalogService.getTrainingProducts(),
        ProductCatalogService.getPersonalProducts()
      ]);
      setTrainingProducts(training);
      setPersonalProducts(personal);
    } catch (error) {
      console.error('[ProductCatalogManager] Error loading products:', error);
      toast.error('Failed to load products from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  const currentProducts = activeTab === 'training' ? trainingProducts : personalProducts;
  
  // Memoize filtered products to prevent unnecessary re-renders
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return currentProducts;
    const query = searchQuery.toLowerCase();
    return currentProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }, [currentProducts, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  // Memoize paginated products
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: '',
      price: 0,
      category: '',
      image: '',
      commission: 0,
      vip_level: 'vip2',
      status: 'active',
      is_active: true
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.brand || !formData.image) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      let result;
      if (isAddingNew) {
        if (activeTab === 'training') {
          result = await ProductCatalogService.addTrainingProduct(formData as Omit<Product, 'id'>);
          if (result.success) {
            toast.success('Training product added successfully to Supabase');
            if (result.products) setTrainingProducts(result.products);
          } else {
            toast.error(result.error || 'Failed to add training product');
          }
        } else {
          result = await ProductCatalogService.addPersonalProduct(formData as Omit<Product, 'id'>);
          if (result.success) {
            toast.success('Personal product added successfully to Supabase');
            if (result.products) setPersonalProducts(result.products);
          } else {
            toast.error(result.error || 'Failed to add personal product');
          }
        }
      } else if (editingProduct) {
        if (activeTab === 'training') {
          result = await ProductCatalogService.updateTrainingProduct(editingProduct.id, formData);
          if (result.success) {
            toast.success('Training product updated in Supabase');
            console.log('[ProductCatalogManager] Product updated successfully:', editingProduct.id);
            if (result.products) setTrainingProducts(result.products);
          } else {
            toast.error(result.error || 'Failed to update training product');
            console.error('[ProductCatalogManager] Product update failed:', result.error);
          }
        } else {
          result = await ProductCatalogService.updatePersonalProduct(editingProduct.id, formData);
          if (result.success) {
            toast.success('Personal product updated in Supabase');
            if (result.products) setPersonalProducts(result.products);
          } else {
            toast.error(result.error || 'Failed to update personal product');
          }
        }
      }

      setEditingProduct(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error('[ProductCatalogManager] Error saving product:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      let result;
      if (activeTab === 'training') {
        result = await ProductCatalogService.deleteTrainingProduct(id);
        if (result.success) {
          toast.success('Training product deleted from Supabase');
          if (result.products) setTrainingProducts(result.products);
        } else {
          toast.error(result.error || 'Failed to delete training product');
        }
      } else {
        result = await ProductCatalogService.deletePersonalProduct(id);
        if (result.success) {
          toast.success('Personal product deleted from Supabase');
          if (result.products) setPersonalProducts(result.products);
        } else {
          toast.error(result.error || 'Failed to delete personal product');
        }
      }
    } catch (error) {
      console.error('[ProductCatalogManager] Error deleting product:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleReset = async () => {
    if (!confirm(`Reset all ${activeTab} products to defaults in Supabase? This cannot be undone.`)) return;

    try {
      let result;
      if (activeTab === 'training') {
        result = await ProductCatalogService.resetTrainingProducts();
        if (result.success) {
          toast.success('Training products reset to defaults in Supabase');
          if (result.products) setTrainingProducts(result.products);
        } else {
          toast.error(result.error || 'Failed to reset training products');
        }
      } else {
        result = await ProductCatalogService.resetPersonalProducts();
        if (result.success) {
          toast.success('Personal products reset to defaults in Supabase');
          if (result.products) setPersonalProducts(result.products);
        } else {
          toast.error(result.error || 'Failed to reset personal products');
        }
      }
    } catch (error) {
      console.error('[ProductCatalogManager] Error resetting products:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
  };

  const categories = [...new Set(currentProducts.map(p => p.category))];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <GraduationCap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Training Products</p>
                <p className="text-2xl font-bold text-white">{trainingProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 backdrop-blur-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Personal Products</p>
                <p className="text-2xl font-bold text-white">{personalProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Layers className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Products</p>
                <p className="text-2xl font-bold text-white">{trainingProducts.length + personalProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl backdrop-blur-xl border border-slate-700/50 shadow-lg">
        <button
          onClick={() => {
            setActiveTab('training');
            setCurrentPage(1);
            setSearchQuery('');
            handleCancel();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'training'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          Training Products ({trainingProducts.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('personal');
            setCurrentPage(1);
            setSearchQuery('');
            handleCancel();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'personal'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <User className="w-5 h-5" />
          Personal Products ({personalProducts.length})
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={`Search ${activeTab} products...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-xl"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAddNew}
            className={`${
              activeTab === 'training'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25'
            } text-white`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:text-white backdrop-blur-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Defaults
          </Button>
        </div>
      </div>

      {/* Edit/Add Form */}
      {(editingProduct || isAddingNew) && (
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl shadow-lg shadow-blue-500/10">
          <CardHeader>
            <CardTitle className="text-white">
              {isAddingNew ? 'Add New Product' : 'Edit Product'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="bg-slate-900/50 border-slate-700/50 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Brand *</label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Enter brand name"
                  className="bg-slate-900/50 border-slate-700/50 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-slate-900/50 border-slate-700/50 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Category
                </label>
                <Input
                  list="categories"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Select or enter category"
                  className="bg-slate-900/50 border-slate-700/50 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-xl"
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2 md:col-span-2">
                <ImageUpload
                  currentImageUrl={formData.image}
                  onImageUrlChange={(url) => setFormData({ ...formData, image: url })}
                  productName={formData.name}
                  productId={editingProduct?.id}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Commission ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.commission || 0}
                  onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-slate-900/50 border-slate-700/50 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  VIP Level
                </label>
                <select
                  value={formData.vip_level || 'vip2'}
                  onChange={(e) => setFormData({ ...formData, vip_level: e.target.value })}
                  className="w-full bg-slate-900/50 border-slate-700/50 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 backdrop-blur-xl"
                >
                  <option value="vip1">VIP1 (0.5%)</option>
                  <option value="vip2">VIP2 (1.0%)</option>
                  <option value="vip3">VIP3 (1.5%)</option>
                  <option value="vip4">VIP4 (2.0%)</option>
                  <option value="vip5">VIP5 (2.5%)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Status
                </label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-900/50 border-slate-700/50 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 backdrop-blur-xl"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <ToggleLeft className="w-4 h-4" />
                  Enable Product
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: true })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      formData.is_active
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 backdrop-blur-xl border border-slate-700/50'
                    }`}
                  >
                    <ToggleRight className="w-4 h-4 inline mr-2" />
                    Enabled
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: false })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      !formData.is_active
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 backdrop-blur-xl border border-slate-700/50'
                    }`}
                  >
                    <ToggleLeft className="w-4 h-4 inline mr-2" />
                    Disabled
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                className={`${
                  activeTab === 'training'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25'
                } text-white`}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Product'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:text-white backdrop-blur-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>
              {activeTab === 'training' ? 'Training' : 'Personal'} Products
              <Badge className="ml-2 bg-slate-700 text-slate-300">
                {filteredProducts.length}
              </Badge>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProducts.map((product, index) => {
              const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
              return (
                <div
                  key={product.id}
                  className="group relative bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 backdrop-blur-xl shadow-lg hover:shadow-blue-500/10"
                >
                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white shadow-lg shadow-blue-500/25 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg text-white shadow-lg shadow-red-500/25 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Image */}
                  <div className="relative w-full h-48 bg-slate-900 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="absolute inset-0 flex items-center justify-center bg-slate-800"><svg class="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;
                        }
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-white truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-400">{product.brand}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-slate-600/50 text-slate-400 backdrop-blur-xl">
                        {product.category}
                      </Badge>
                      <span className="text-emerald-400 font-semibold shadow-lg shadow-emerald-500/10">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50 backdrop-blur-xl">
                        <p className="text-slate-500 mb-1">Commission</p>
                        <p className="text-white font-semibold">${(product.commission || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50 backdrop-blur-xl">
                        <p className="text-slate-500 mb-1">VIP Level</p>
                        <p className="text-blue-400 font-semibold uppercase shadow-lg shadow-blue-500/10">{product.vip_level || 'VIP2'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${
                            product.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                              : product.status === 'inactive'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-lg shadow-red-500/10'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                          } backdrop-blur-xl`}
                        >
                          {product.status || 'Active'}
                        </Badge>
                        {product.is_active !== false ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shadow-lg shadow-emerald-500/10" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400 shadow-lg shadow-red-500/10" />
                        )}
                      </div>
                      {product.created_at && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(product.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {paginatedProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No products found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search or add new products</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-slate-400">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium mb-1">Product Management Tips</p>
            <ul className="text-sm text-amber-400/80 space-y-1">
              <li>• Training products are used for training accounts (45 products, 1% commission - same as VIP2)</li>
              <li>• Personal products are used for VIP1 accounts (35 products, 0.5% commission) and VIP2 (1% commission)</li>
              <li>• Changes are saved to Supabase and sync in real-time across all users</li>
              <li>• Use "Reset Defaults" to restore original product catalogs in Supabase</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalogManager;
