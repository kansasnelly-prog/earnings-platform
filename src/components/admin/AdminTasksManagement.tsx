import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Search, X, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  category: string;
}

// Full product catalog from TaskGrid - 45 products
const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: 'Nova Pro Headphones', brand: 'AudioTech', price: 89.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg' },
  { id: '2', name: 'Eclipse Wireless Buds', brand: 'SoundCore', price: 49.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787082009_0270efe4.jpg' },
  { id: '3', name: 'Luxe Smartwatch Pro', brand: 'ChronoTech', price: 129.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg' },
  { id: '4', name: 'Velocity Runner X', brand: 'StridePro', price: 79.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181124_5bfe01ea.jpg' },
  { id: '5', name: 'AeroGlide Sneakers', brand: 'FlexFit', price: 69.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181160_a55f4194.jpg' },
  { id: '6', name: 'Pulse Sport Shoes', brand: 'RunElite', price: 89.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787182124_f83fc6a1.jpg' },
  { id: '7', name: 'Elegance Tote Bag', brand: 'LuxCraft', price: 59.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787207165_96f32090.jpg' },
  { id: '8', name: 'Milano Crossbody', brand: 'VogueHaus', price: 45.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787206756_02ab622b.jpg' },
  { id: '9', name: 'Parisian Clutch', brand: 'ChicMode', price: 39.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787208836_6bed33bf.jpg' },
  { id: '10', name: 'Quantum Phone Ultra', brand: 'TechVision', price: 349.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg' },
  { id: '11', name: 'NexGen Smartphone', brand: 'InnoTech', price: 299.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228875_22deddf5.jpg' },
  { id: '12', name: 'Prism Phone Lite', brand: 'PixelCore', price: 199.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228214_83ae7bac.jpg' },
  { id: '13', name: 'Aviator Gold Shades', brand: 'OpticLux', price: 59.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787293025_0eb30818.png' },
  { id: '14', name: 'Retro Classic Frames', brand: 'VintageEye', price: 39.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787294111_60cc7e3c.png' },
  { id: '15', name: 'Sport Shield Lens', brand: 'ActiveView', price: 29.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787297312_c22cfe12.png' },
  { id: '16', name: 'AirPod Max Elite', brand: 'SoundWave', price: 99.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324656_974c3fd9.jpg' },
  { id: '17', name: 'Crystal Clear Buds', brand: 'PureAudio', price: 39.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787319217_3608a441.jpg' },
  { id: '18', name: 'Bass Boost Pods', brand: 'DeepSound', price: 29.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324035_89c94026.jpg' },
  { id: '19', name: 'Noir Essence Parfum', brand: 'MaisonLux', price: 49.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787341472_3444168c.jpg' },
  { id: '20', name: 'Amber Oud Reserve', brand: 'FragranceCo', price: 69.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg' },
  { id: '21', name: 'Rose Gold Mist', brand: 'PetalScent', price: 39.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349855_685c5231.jpg' },
  { id: '22', name: 'MechStrike RGB Board', brand: 'KeyForge', price: 59.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787375145_9df53cc3.jpg' },
  { id: '23', name: 'TactileType Pro', brand: 'SwitchCraft', price: 49.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787371308_5751966c.jpg' },
  { id: '24', name: 'Phantom Keys 60%', brand: 'GhostBoard', price: 39.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787369611_dd23e2c4.jpg' },
  { id: '25', name: 'Viper X Gaming Mouse', brand: 'ClickForce', price: 29.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787407963_baffffe3.jpg' },
  { id: '26', name: 'Stealth Ergo Mouse', brand: 'ProGrip', price: 24.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787405290_e248a39d.jpg' },
  { id: '27', name: 'Apex Precision Mouse', brand: 'AimTech', price: 34.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787402492_78e0000f.jpg' },
  { id: '28', name: 'Heritage Bifold Wallet', brand: 'LeatherCo', price: 34.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426896_6aef43d7.jpg' },
  { id: '29', name: 'Slim Card Holder', brand: 'MinimalWear', price: 19.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426601_23fa6276.jpg' },
  { id: '30', name: 'FitBand Ultra', brand: 'VitalTrack', price: 79.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787444470_809c5d8f.jpg' },
  { id: '31', name: 'PulseTrack Slim', brand: 'HealthSync', price: 59.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787446440_a77aea1d.jpg' },
  { id: '32', name: 'Studio Monitor Pro', brand: 'AudioTech', price: 119.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg' },
  { id: '33', name: 'Titanium Watch Elite', brand: 'ChronoTech', price: 149.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg' },
  { id: '34', name: 'Zenith Phone Max', brand: 'TechVision', price: 399.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg' },
  { id: '35', name: 'Royal Oud Intense', brand: 'MaisonLux', price: 79.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg' },
  { id: '36', name: 'Diamond Edition Watch', brand: 'ChronoLux', price: 149.99, category: 'Luxury', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg' },
  { id: '37', name: 'Platinum Wireless Pro', brand: 'AudioElite', price: 89.99, category: 'Premium Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg' },
  { id: '38', name: 'Royal Signature Bag', brand: 'MaisonHaus', price: 79.99, category: 'Luxury Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787207165_96f32090.jpg' },
  { id: '39', name: 'Elite Gaming Station', brand: 'ProForge', price: 129.99, category: 'Premium Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787375145_9df53cc3.jpg' },
  { id: '40', name: 'Obsidian Phone Ultra', brand: 'NexGen', price: 299.99, category: 'Flagship', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg' },
  { id: '41', name: 'Prestige Oud Parfum', brand: 'MaisonNoir', price: 59.99, category: 'Premium Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg' },
  { id: '42', name: 'Velocity Max Runners', brand: 'EliteSport', price: 99.99, category: 'Premium Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181124_5bfe01ea.jpg' },
  { id: '43', name: 'Master Craft Leather', brand: 'ArtisanCo', price: 129.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426896_6aef43d7.jpg' },
  { id: '44', name: 'Elite Performance Mat', brand: 'ProTech', price: 49.99, category: 'Sports', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787375145_9df53cc3.jpg' },
  { id: '45', name: 'Executive Briefcase', brand: 'CrownLeather', price: 189.99, category: 'Business', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787207165_96f32090.jpg' },
  // Original Admin Products (8 items)
  { id: '46', name: 'Luxury Watch Pro', brand: 'ChronoMax', price: 299.99, category: 'Luxury', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
  { id: '47', name: 'Wireless Headphones', brand: 'AudioTech', price: 149.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
  { id: '48', name: 'Designer Handbag', brand: 'FashionHouse', price: 199.99, category: 'Fashion', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' },
  { id: '49', name: 'Smart Fitness Watch', brand: 'FitPro', price: 89.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400' },
  { id: '50', name: 'Premium Sunglasses', brand: 'VisionLux', price: 129.99, category: 'Fashion', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
  { id: '51', name: 'Leather Wallet', brand: 'CraftsMan', price: 59.99, category: 'Accessories', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400' },
  { id: '52', name: 'Bluetooth Speaker', brand: 'SoundMax', price: 79.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' },
  { id: '53', name: 'Running Shoes', brand: 'SportPro', price: 119.99, category: 'Sports', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
  // Custom User Products (Restored - Commission comes from task position, not price)
  { id: '54', name: 'iPhone 14 Pro Max', brand: 'Apple', price: 349.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400' },
  { id: '55', name: 'iPhone 16 Pro', brand: 'Apple', price: 399.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1696446702183-cbd13c0c4a27?w=400' },
  { id: '56', name: 'Wireless Smart TV', brand: 'VisionTech', price: 299.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400' },
  { id: '57', name: 'Rolex Submariner', brand: 'Rolex', price: 149.99, category: 'Luxury', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400' },
  { id: '58', name: 'Rolex Daytona', brand: 'Rolex', price: 199.99, category: 'Luxury', image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400' },
  { id: '59', name: 'Premium Leather Briefcase', brand: 'Leather Company', price: 129.99, category: 'Accessories', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
  { id: '60', name: 'Men\'s Premium T-Shirt', brand: 'FashionCo', price: 39.99, category: 'Fashion', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
  { id: '61', name: 'Designer Leather Jacket', brand: 'Leather Company', price: 79.99, category: 'Fashion', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' },
  { id: '62', name: 'Luxury Leather Wallet', brand: 'Leather Company', price: 59.99, category: 'Accessories', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400' },
];

// Shared storage key - used by both Admin and Main site
export const STORAGE_KEY = 'admin_products';

const AdminTasksManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    image: '',
    category: 'General'
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load products from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        } else {
          setProducts(DEFAULT_PRODUCTS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
        }
      } catch {
        setProducts(DEFAULT_PRODUCTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      }
    } else {
      setProducts(DEFAULT_PRODUCTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    }
  }, []);

  // Save products to localStorage whenever they change
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }
  }, [products]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData(prev => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = () => {
    if (!formData.name || !formData.brand || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      brand: formData.brand,
      price: parseFloat(formData.price),
      image: formData.image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400',
      category: formData.category
    };

    setProducts(prev => [...prev, newProduct]);
    toast.success('Product added successfully!');
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditProduct = () => {
    if (!editingProduct || !formData.name || !formData.brand || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setProducts(prev => prev.map(p => 
      p.id === editingProduct.id 
        ? { 
            ...p, 
            name: formData.name,
            brand: formData.brand,
            price: parseFloat(formData.price),
            image: formData.image || p.image,
            category: formData.category
          }
        : p
    ));
    toast.success('Product updated successfully!');
    setIsEditModalOpen(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully!');
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      price: product.price.toString(),
      image: product.image,
      category: product.category
    });
    setImagePreview(product.image);
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      price: '',
      image: '',
      category: 'General'
    });
    setImagePreview(null);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // VIP Commission Rates
  const VIP_RATES = [
    { level: 1, rate: 0.005, label: '0.5%' },
    { level: 2, rate: 0.01, label: '1%' },
    { level: 3, rate: 0.015, label: '1.5%' },
    { level: 4, rate: 0.02, label: '2%' },
    { level: 5, rate: 0.025, label: '2.5%' },
  ];

  // Calculate earnings based on VIP rates
  const getEarnings = (price: number, vipLevel: number = 1) => {
    const rate = VIP_RATES.find(r => r.level === vipLevel)?.rate || 0.005;
    return (price * rate).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Task Products Management
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage products that users can submit for task completion
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          aria-label="Add New Product"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Products</p>
          <p className="text-2xl font-bold text-white mt-1">{products.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-sm text-gray-400">Categories</p>
          <p className="text-2xl font-bold text-white mt-1">
            {new Set(products.map(p => p.category)).size}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-sm text-gray-400">Avg. Price</p>
          <p className="text-2xl font-bold text-white mt-1">
            ${products.length > 0 ? (products.reduce((a, b) => a + b.price, 0) / products.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* VIP Commission Rates */}
      <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-indigo-900/30 border border-indigo-500/20 rounded-xl p-4">
        <p className="text-sm text-gray-400 mb-3">VIP Commission Rates (Task Rewards)</p>
        <div className="flex flex-wrap gap-3">
          {VIP_RATES.map((rate) => (
            <div key={rate.level} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-sm text-white font-medium">VIP{rate.level}</span>
              <span className="text-sm text-emerald-400">{rate.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Example: $100 product × VIP1 (0.5%) = $0.50 commission per task
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search products by name, brand, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all group">
              {/* Image */}
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400';
                  }}
                />
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    aria-label="Edit Product"
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    aria-label="Delete Product"
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <span className="text-xs text-indigo-400 font-medium">{product.category}</span>
                <h3 className="text-white font-semibold mt-1 truncate">{product.name}</h3>
                <p className="text-sm text-gray-400">{product.brand}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-emerald-400">${product.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">Earn: ${getEarnings(product.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-white/[0.1] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {isEditModalOpen ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  aria-label="Close"
                  className="p-2 hover:bg-white/[0.05] rounded-lg text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Product Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Luxury Watch Pro"
                    className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                {/* Brand Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Brand Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g. ChronoMax"
                    className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Product Price ($) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. 299.99"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Earnings are calculated automatically from product price × VIP rate (0.9%-9.99% by level)
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="categorySelect" className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    id="categorySelect"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="General" className="bg-[#0f1420]">General</option>
                    <option value="Luxury" className="bg-[#0f1420]">Luxury</option>
                    <option value="Electronics" className="bg-[#0f1420]">Electronics</option>
                    <option value="Fashion" className="bg-[#0f1420]">Fashion</option>
                    <option value="Sports" className="bg-[#0f1420]">Sports</option>
                    <option value="Accessories" className="bg-[#0f1420]">Accessories</option>
                    <option value="Beauty" className="bg-[#0f1420]">Beauty</option>
                    <option value="Audio" className="bg-[#0f1420]">Audio</option>
                    <option value="Wearables" className="bg-[#0f1420]">Wearables</option>
                    <option value="Footwear" className="bg-[#0f1420]">Footwear</option>
                    <option value="Tech" className="bg-[#0f1420]">Tech</option>
                    <option value="Gaming" className="bg-[#0f1420]">Gaming</option>
                    <option value="Premium Audio" className="bg-[#0f1420]">Premium Audio</option>
                    <option value="Luxury Fashion" className="bg-[#0f1420]">Luxury Fashion</option>
                    <option value="Premium Tech" className="bg-[#0f1420]">Premium Tech</option>
                    <option value="Flagship" className="bg-[#0f1420]">Flagship</option>
                    <option value="Premium Beauty" className="bg-[#0f1420]">Premium Beauty</option>
                    <option value="Premium Footwear" className="bg-[#0f1420]">Premium Footwear</option>
                    <option value="Business" className="bg-[#0f1420]">Business</option>
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Product Image <span className="text-red-400">*</span>
                  </label>
                  
                  {/* File Upload */}
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-all">
                      <ImageIcon className="w-4 h-4" />
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-sm text-gray-400">
                      {imagePreview ? 'Image selected' : 'No file chosen'}
                    </span>
                  </div>

                  {/* Or URL */}
                  <p className="text-xs text-gray-500 mb-2">or paste URL below</p>
                  <input
                    type="text"
                    value={formData.image.startsWith('data:') ? '' : formData.image}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, image: e.target.value }));
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-white/[0.05]">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        crossOrigin="anonymous"
                        onError={() => setImagePreview(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={isEditModalOpen ? handleEditProduct : handleAddProduct}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
                >
                  <Save className="w-4 h-4" />
                  {isEditModalOpen ? 'Save Changes' : 'Save Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTasksManagement;
