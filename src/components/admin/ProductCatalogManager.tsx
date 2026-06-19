import React, { useState, useEffect, useMemo } from 'react';
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
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const currentProducts = activeTab === 'training' ? trainingProducts : personalProducts;
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return currentProducts;
    const query = searchQuery.toLowerCase();
    return currentProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }, [currentProducts, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleSave = async () => {
    if (!formData.name || !formData.brand || !formData.image) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSaving(true);
    try {
      if (isAddingNew) {
        if (activeTab === 'training') await ProductCatalogService.addTrainingProduct(formData as Omit<Product, 'id'>);
        else await ProductCatalogService.addPersonalProduct(formData as Omit<Product, 'id'>);
        toast.success('Product added successfully');
      } else if (editingProduct) {
        if (activeTab === 'training') await ProductCatalogService.updateTrainingProduct(editingProduct.id, formData);
        else await ProductCatalogService.updatePersonalProduct(editingProduct.id, formData);
        toast.success('Product updated successfully');
      }
      setEditingProduct(null);
      setIsAddingNew(false);
      loadProducts();
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      if (activeTab === 'training') await ProductCatalogService.deleteTrainingProduct(id);
      else await ProductCatalogService.deletePersonalProduct(id);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <Button variant={activeTab === 'training' ? 'default' : 'ghost'} onClick={() => { setActiveTab('training'); setCurrentPage(1); }} className="flex-1">
          <GraduationCap className="w-5 h-5 mr-2" /> Training Products ({trainingProducts.length})
        </Button>
        <Button variant={activeTab === 'personal' ? 'default' : 'ghost'} onClick={() => { setActiveTab('personal'); setCurrentPage(1); }} className="flex-1">
          <User className="w-5 h-5 mr-2" /> Personal Products ({personalProducts.length})
        </Button>
      </div>

      <div className="flex gap-4 items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search products..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-10 bg-slate-800 border-slate-700 text-white" />
        </div>
        <Button onClick={() => { setIsAddingNew(true); }} aria-label="Add New Product"><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedProducts.map(product => (
          <div key={product.id} className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden group">
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button size="sm" variant="secondary" onClick={() => { setEditingProduct(product); setFormData({...product}); setIsAddingNew(false); }} aria-label="Edit Product"><Edit2 className="w-4 h-4" /></Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)} aria-label="Delete Product"><Trash2 className="w-4 h-4" /></Button>
            </div>
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-white truncate">{product.name}</h3>
              <p className="text-sm text-slate-400">{product.brand}</p>
              <p className="text-emerald-400 font-bold">${product.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modal, Pagination, etc. would go here, ensured accessibility */}
    </div>
  );
};
export default ProductCatalogManager;
