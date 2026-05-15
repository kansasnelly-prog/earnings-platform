// ===========================================
// PRODUCT CATALOG SERVICE - SUPABASE BACKEND
// Training: 45 products | Personal: 35 products
// ===========================================

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  image: string;
  product_number?: number;
  commission?: number;
  vip_level?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ===========================================
// DEFAULT TRAINING PRODUCTS (45 products) - Fallback
// ===========================================
export const DEFAULT_TRAINING_PRODUCTS: Product[] = [
  { id: 't1', name: 'Nova Pro Headphones', brand: 'AudioTech', price: 89.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg', product_number: 1 },
  { id: 't2', name: 'Eclipse Wireless Buds', brand: 'SoundCore', price: 49.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787082009_0270efe4.jpg', product_number: 2 },
  { id: 't3', name: 'Luxe Smartwatch Pro', brand: 'ChronoTech', price: 129.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg', product_number: 3 },
  { id: 't4', name: 'Velocity Runner X', brand: 'StridePro', price: 79.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181124_5bfe01ea.jpg', product_number: 4 },
  { id: 't5', name: 'AeroGlide Sneakers', brand: 'FlexFit', price: 69.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181160_a55f4194.jpg', product_number: 5 },
  { id: 't6', name: 'Pulse Sport Shoes', brand: 'RunElite', price: 89.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787182124_f83fc6a1.jpg', product_number: 6 },
  { id: 't7', name: 'Elegance Tote Bag', brand: 'LuxCraft', price: 59.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787207165_96f32090.jpg', product_number: 7 },
  { id: 't8', name: 'Milano Crossbody', brand: 'VogueHaus', price: 45.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787206756_02ab622b.jpg', product_number: 8 },
  { id: 't9', name: 'Parisian Clutch', brand: 'ChicMode', price: 39.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787208836_6bed33bf.jpg', product_number: 9 },
  { id: 't10', name: 'Quantum Phone Ultra', brand: 'TechVision', price: 349.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg', product_number: 10 },
  { id: 't11', name: 'NexGen Smartphone', brand: 'InnoTech', price: 299.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228875_22deddf5.jpg', product_number: 11 },
  { id: 't12', name: 'Prism Phone Lite', brand: 'PixelCore', price: 199.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228214_83ae7bac.jpg', product_number: 12 },
  { id: 't13', name: 'Aviator Gold Shades', brand: 'OpticLux', price: 59.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787293025_0eb30818.png', product_number: 13 },
  { id: 't14', name: 'Retro Classic Frames', brand: 'VintageEye', price: 39.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787294111_60cc7e3c.png', product_number: 14 },
  { id: 't15', name: 'Sport Shield Lens', brand: 'ActiveView', price: 29.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787297312_c22cfe12.png', product_number: 15 },
  { id: 't16', name: 'AirPod Max Elite', brand: 'SoundWave', price: 99.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324656_974c3fd9.jpg', product_number: 16 },
  { id: 't17', name: 'Crystal Clear Buds', brand: 'PureAudio', price: 39.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787319217_3608a441.jpg', product_number: 17 },
  { id: 't18', name: 'Bass Boost Pods', brand: 'DeepSound', price: 29.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324035_89c94026.jpg', product_number: 18 },
  { id: 't19', name: 'Noir Essence Parfum', brand: 'MaisonLux', price: 49.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787341472_3444168c.jpg', product_number: 19 },
  { id: 't20', name: 'Amber Oud Reserve', brand: 'FragranceCo', price: 69.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg', product_number: 20 },
  { id: 't21', name: 'Rose Gold Mist', brand: 'PetalScent', price: 39.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349855_685c5231.jpg', product_number: 21 },
  { id: 't22', name: 'MechStrike RGB Board', brand: 'KeyForge', price: 59.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787375145_9df53cc3.jpg', product_number: 22 },
  { id: 't23', name: 'TactileType Pro', brand: 'SwitchCraft', price: 49.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787371308_5751966c.jpg', product_number: 23 },
  { id: 't24', name: 'Phantom Keys 60%', brand: 'GhostBoard', price: 39.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787369611_dd23e2c4.jpg', product_number: 24 },
  { id: 't25', name: 'Viper X Gaming Mouse', brand: 'ClickForce', price: 29.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787407963_baffffe3.jpg', product_number: 25 },
  { id: 't26', name: 'Stealth Ergo Mouse', brand: 'ProGrip', price: 24.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787405290_e248a39d.jpg', product_number: 26 },
  { id: 't27', name: 'Apex Precision Mouse', brand: 'AimTech', price: 34.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787402492_78e0000f.jpg', product_number: 27 },
  { id: 't28', name: 'Heritage Bifold Wallet', brand: 'LeatherCo', price: 34.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426896_6aef43d7.jpg', product_number: 28 },
  { id: 't29', name: 'Slim Card Holder', brand: 'MinimalWear', price: 19.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426601_23fa6276.jpg', product_number: 29 },
  { id: 't30', name: 'FitBand Ultra', brand: 'VitalTrack', price: 79.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787444470_809c5d8f.jpg', product_number: 30 },
  { id: 't31', name: 'PulseTrack Slim', brand: 'HealthSync', price: 59.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787446440_a77aea1d.jpg', product_number: 31 },
  { id: 't32', name: 'Studio Monitor Pro', brand: 'AudioTech', price: 119.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg', product_number: 32 },
  { id: 't33', name: 'Titanium Watch Elite', brand: 'ChronoTech', price: 149.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg', product_number: 33 },
  { id: 't34', name: 'Zenith Phone Max', brand: 'TechVision', price: 399.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg', product_number: 34 },
  { id: 't35', name: 'Royal Oud Intense', brand: 'MaisonLux', price: 79.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg', product_number: 35 },
  { id: 't36', name: 'Gaming Laptop Pro', brand: 'GameTech', price: 1299.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400', product_number: 36 },
  { id: 't37', name: 'Wireless Earbuds Elite', brand: 'AudioMax', price: 149.99, category: 'Audio', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', product_number: 37 },
  { id: 't38', name: 'Smart Home Hub', brand: 'HomeTech', price: 199.99, category: 'Smart Home', image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400', product_number: 38 },
  { id: 't39', name: '4K Action Camera', brand: 'ActionPro', price: 299.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400', product_number: 39 },
  { id: 't40', name: 'VR Headset Pro', brand: 'VirtualTech', price: 499.99, category: 'Gaming', image: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400', product_number: 40 },
  { id: 't41', name: 'Drone Flyer X', brand: 'SkyTech', price: 899.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400', product_number: 41 },
  { id: 't42', name: 'Smart Door Lock', brand: 'SecureHome', price: 249.99, category: 'Smart Home', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', product_number: 42 },
  { id: 't43', name: 'Portable Projector', brand: 'CinemaTech', price: 399.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400', product_number: 43 },
  { id: 't44', name: 'Electric Toothbrush', brand: 'DentalPro', price: 89.99, category: 'Health', image: 'https://images.unsplash.com/photo-1559671088-795c4b25565d?w=400', product_number: 44 },
  { id: 't45', name: 'Coffee Maker Deluxe', brand: 'BrewMaster', price: 179.99, category: 'Kitchen', image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400', product_number: 45 },
];

// ===========================================
// DEFAULT PERSONAL PRODUCTS (35 products) - Fallback
// ===========================================
export const DEFAULT_PERSONAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'iPhone 14 Pro Max', brand: 'Apple', price: 1099.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', product_number: 1 },
  { id: 'p2', name: 'iPhone 16 Pro', brand: 'Apple', price: 1199.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1696446702183-cbd13c0c4a27?w=400', product_number: 2 },
  { id: 'p3', name: 'Samsung Galaxy S24', brand: 'Samsung', price: 999.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1610945265078-3858a0828671?w=400', product_number: 3 },
  { id: 'p4', name: 'MacBook Air M3', brand: 'Apple', price: 1299.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=400', product_number: 4 },
  { id: 'p5', name: 'iPad Pro 12.9', brand: 'Apple', price: 1099.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', product_number: 5 },
  { id: 'p6', name: 'AirPods Pro 2', brand: 'Apple', price: 249.99, category: 'Audio', image: 'https://images.unsplash.com/photo-1603351154351-5cfb3d04ef32?w=400', product_number: 6 },
  { id: 'p7', name: 'Sony WH-1000XM5', brand: 'Sony', price: 399.99, category: 'Audio', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400', product_number: 7 },
  { id: 'p8', name: 'Apple Watch Ultra', brand: 'Apple', price: 799.99, category: 'Wearables', image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400', product_number: 8 },
  { id: 'p9', name: 'Rolex Submariner', brand: 'Rolex', price: 8950.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400', product_number: 9 },
  { id: 'p10', name: 'Rolex Daytona', brand: 'Rolex', price: 12500.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400', product_number: 10 },
  { id: 'p11', name: 'Louis Vuitton Bag', brand: 'Louis Vuitton', price: 2850.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', product_number: 11 },
  { id: 'p12', name: 'Gucci Handbag', brand: 'Gucci', price: 2300.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', product_number: 12 },
  { id: 'p13', name: 'Premium Leather Briefcase', brand: 'Coach', price: 495.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', product_number: 13 },
  { id: 'p14', name: 'Luxury Leather Wallet', brand: 'Montblanc', price: 385.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', product_number: 14 },
  { id: 'p15', name: 'Designer Leather Jacket', brand: 'AllSaints', price: 520.00, category: 'Fashion', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', product_number: 15 },
  { id: 'p16', name: 'Nike Air Jordan 1', brand: 'Nike', price: 180.00, category: 'Footwear', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', product_number: 16 },
  { id: 'p17', name: 'Adidas Yeezy Boost', brand: 'Adidas', price: 220.00, category: 'Footwear', image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400', product_number: 17 },
  { id: 'p18', name: 'New Balance 990', brand: 'New Balance', price: 184.99, category: 'Footwear', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', product_number: 18 },
  { id: 'p19', name: 'Sony PlayStation 5', brand: 'Sony', price: 499.99, category: 'Gaming', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400', product_number: 19 },
  { id: 'p20', name: 'Xbox Series X', brand: 'Microsoft', price: 499.99, category: 'Gaming', image: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400', product_number: 20 },
  { id: 'p21', name: 'Nintendo Switch OLED', brand: 'Nintendo', price: 349.99, category: 'Gaming', image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400', product_number: 21 },
  { id: 'p22', name: 'Dyson Vacuum V15', brand: 'Dyson', price: 749.99, category: 'Home', image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400', product_number: 22 },
  { id: 'p23', name: 'Dyson Airwrap', brand: 'Dyson', price: 599.99, category: 'Beauty', image: 'https://images.unsplash.com/photo-1522338140262-f46f9510963c?w=400', product_number: 23 },
  { id: 'p24', name: 'Samsung 4K TV 55"', brand: 'Samsung', price: 899.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400', product_number: 24 },
  { id: 'p25', name: 'Canon EOS R6', brand: 'Canon', price: 2499.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', product_number: 25 },
  { id: 'p26', name: 'Bose SoundLink', brand: 'Bose', price: 299.99, category: 'Audio', image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400', product_number: 26 },
  { id: 'p27', name: 'Fendi Peekaboo', brand: 'Fendi', price: 3900.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', product_number: 27 },
  { id: 'p28', name: 'Prada Galleria', brand: 'Prada', price: 3200.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', product_number: 28 },
  { id: 'p29', name: 'Chanel Classic Flap', brand: 'Chanel', price: 8900.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', product_number: 29 },
  { id: 'p30', name: 'Ray-Ban Aviator', brand: 'Ray-Ban', price: 185.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', product_number: 30 },
  { id: 'p31', name: 'Tiffany Necklace', brand: 'Tiffany', price: 1250.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', product_number: 31 },
  { id: 'p32', name: 'Cartier Santos', brand: 'Cartier', price: 6750.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400', product_number: 32 },
  { id: 'p33', name: 'Omega Seamaster', brand: 'Omega', price: 5200.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400', product_number: 33 },
  { id: 'p34', name: 'Burberry Trench Coat', brand: 'Burberry', price: 1890.00, category: 'Fashion', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', product_number: 34 },
  { id: 'p35', name: 'Canada Goose Parka', brand: 'Canada Goose', price: 995.00, category: 'Fashion', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400', product_number: 35 },
];

// Storage keys for localStorage fallback
const TRAINING_PRODUCTS_KEY = 'training_products_catalog';
const PERSONAL_PRODUCTS_KEY = 'personal_products_catalog';

// Realtime subscription channels
let trainingChannel: RealtimeChannel | null = null;
let personalChannel: RealtimeChannel | null = null;

// Callbacks for realtime updates
let trainingProductsUpdateCallback: ((products: Product[]) => void) | null = null;
let personalProductsUpdateCallback: ((products: Product[]) => void) | null = null;

// ===========================================
// SUPABASE SERVICE FUNCTIONS
// ===========================================

export const ProductCatalogService = {
  // ===========================================
  // FETCH FUNCTIONS
  // ===========================================

  // Get Training Products from Supabase
  async getTrainingProducts(): Promise<Product[]> {
    try {
      console.log('[ProductCatalog] Fetching training products from Supabase...');

      const { data, error } = await supabase
        .from('training_products')
        .select('*')
        .order('product_number', { ascending: true });

      if (error) {
        console.error('[ProductCatalog] Error loading training products:', error);
        console.log('[ProductCatalog] Falling back to localStorage/defaults');
        return this.getTrainingProductsLocal();
      }

      if (data && data.length > 0) {
        console.log(`[ProductCatalog] Loaded ${data.length} training products from Supabase`);
        // Map database columns to Product interface
        const products: Product[] = data.map((item: any) => ({
          id: item.id,
          name: item.product_name,
          brand: item.brand,
          price: item.price,
          category: item.category,
          image: item.image,
          product_number: item.product_number,
          commission: item.commission,
          vip_level: item.vip_level,
          status: item.status,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        // Cache in localStorage for offline fallback
        this.saveTrainingProductsLocal(products);
        return products;
      }

      console.log('[ProductCatalog] No training products in Supabase, using defaults');
      return DEFAULT_TRAINING_PRODUCTS;
    } catch (error) {
      console.error('[ProductCatalog] Exception loading training products:', error);
      return this.getTrainingProductsLocal();
    }
  },

  // Get Personal Products from Supabase
  async getPersonalProducts(): Promise<Product[]> {
    try {
      console.log('[ProductCatalog] Fetching personal products from Supabase...');
      
      const { data, error } = await supabase
        .from('personal_products')
        .select('*')
        .order('product_number', { ascending: true });

      if (error) {
        console.error('[ProductCatalog] Error loading personal products:', error);
        console.log('[ProductCatalog] Falling back to localStorage/defaults');
        return this.getPersonalProductsLocal();
      }

      if (data && data.length > 0) {
        console.log(`[ProductCatalog] Loaded ${data.length} personal products from Supabase`);
        // Cache in localStorage for offline fallback
        this.savePersonalProductsLocal(data);
        return data;
      }

      console.log('[ProductCatalog] No personal products in Supabase, using defaults');
      return DEFAULT_PERSONAL_PRODUCTS;
    } catch (error) {
      console.error('[ProductCatalog] Exception loading personal products:', error);
      return this.getPersonalProductsLocal();
    }
  },

  // ===========================================
  // UPDATE FUNCTIONS
  // ===========================================

  // Update single Training Product in Supabase
  async updateTrainingProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      console.log(`[ProductCatalog] Updating training product ${id} in Supabase:`, updates);

      // Map field names to match database columns
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) dbUpdates.product_name = updates.name;
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.image !== undefined) dbUpdates.image = updates.image;
      if (updates.product_number !== undefined) dbUpdates.product_number = updates.product_number;
      if (updates.commission !== undefined) dbUpdates.commission = updates.commission;
      if (updates.vip_level !== undefined) dbUpdates.vip_level = updates.vip_level;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;

      console.log('[ProductCatalog] Mapped database updates:', dbUpdates);

      const { data, error } = await supabase
        .from('training_products')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[ProductCatalog] Product update failed:', error);
        return { success: false, error: error.message };
      }

      console.log('[ProductCatalog] Product updated successfully:', data);
      const products = await this.getTrainingProducts();
      return { success: true, products };
    } catch (error) {
      console.error('[ProductCatalog] Product update failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Update single Personal Product in Supabase
  async updatePersonalProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      console.log(`[ProductCatalog] Updating personal product ${id} in Supabase:`, updates);

      const { data, error } = await supabase
        .from('personal_products')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[ProductCatalog] Product update failed:', error);
        return { success: false, error: error.message };
      }

      console.log('[ProductCatalog] Product updated successfully:', data);

      // Sync product image to tasks table for all personal users
      if (data && data.length > 0 && updates.image) {
        const product = data[0];
        console.log('[ProductCatalog] Syncing product image to tasks for product number:', product.product_number);

        const { error: syncError } = await supabase
          .from('tasks')
          .update({ product_image: updates.image })
          .eq('product_name', 'Personal Product ' + product.product_number);

        if (syncError) {
          console.error('[ProductCatalog] Error syncing product image to tasks:', syncError);
        } else {
          console.log('[ProductCatalog] Product image synced to tasks successfully');
        }
      }

      const products = await this.getPersonalProducts();
      return { success: true, products };
    } catch (error) {
      console.error('[ProductCatalog] Product update failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // ===========================================
  // ADD FUNCTIONS
  // ===========================================

  // Add Training Product to Supabase
  async addTrainingProduct(product: Omit<Product, 'id'>): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      // Get current count for new product number
      const { count } = await supabase
        .from('training_products')
        .select('*', { count: 'exact', head: true });

      const newProductNumber = (count || 0) + 1;
      const newId = `t${newProductNumber}`;

      console.log(`[ProductCatalog] Adding training product ${newId} to Supabase:`, product);

      // Map field names to match database columns
      const dbProduct: any = {
        id: newId,
        product_number: newProductNumber,
        product_name: product.name,
        brand: product.brand,
        price: product.price,
        category: product.category,
        image: product.image,
        commission: product.commission || 0,
        vip_level: product.vip_level || 'vip2',
        status: product.status || 'active',
        is_active: product.is_active !== undefined ? product.is_active : true
      };

      if (product.product_number !== undefined) dbProduct.product_number = product.product_number;

      console.log('[ProductCatalog] Mapped database insert:', dbProduct);

      const { data, error } = await supabase
        .from('training_products')
        .insert(dbProduct)
        .select();

      if (error) {
        console.error('[ProductCatalog] Error adding training product:', error);
        return { success: false, error: error.message };
      }

      console.log('[ProductCatalog] Training product added successfully:', data);
      const products = await this.getTrainingProducts();
      return { success: true, products };
    } catch (error) {
      console.error('[ProductCatalog] Exception adding training product:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Add Personal Product to Supabase
  async addPersonalProduct(product: Omit<Product, 'id'>): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      // Get current count for new product number
      const { count } = await supabase
        .from('personal_products')
        .select('*', { count: 'exact', head: true });

      const newProductNumber = (count || 0) + 1;
      const newId = `p${newProductNumber}`;

      console.log(`[ProductCatalog] Adding personal product ${newId} to Supabase:`, product);

      const { data, error } = await supabase
        .from('personal_products')
        .insert({
          id: newId,
          ...product,
          product_number: newProductNumber
        })
        .select();

      if (error) {
        console.error('[ProductCatalog] Error adding personal product:', error);
        return { success: false, error: error.message };
      }

      console.log('[ProductCatalog] Personal product added successfully:', data);

      // Sync product image to tasks table for all personal users
      if (data && data.length > 0 && product.image) {
        const newProduct = data[0];
        console.log('[ProductCatalog] Syncing product image to tasks for product number:', newProduct.product_number);

        const { error: syncError } = await supabase
          .from('tasks')
          .update({ product_image: product.image })
          .eq('product_name', 'Personal Product ' + newProduct.product_number);

        if (syncError) {
          console.error('[ProductCatalog] Error syncing product image to tasks:', syncError);
        } else {
          console.log('[ProductCatalog] Product image synced to tasks successfully');
        }
      }

      const products = await this.getPersonalProducts();
      return { success: true, products };
    } catch (error) {
      console.error('[ProductCatalog] Exception adding personal product:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // ===========================================
  // DELETE FUNCTIONS
  // ===========================================

  // Delete Training Product from Supabase
  async deleteTrainingProduct(id: string): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      console.log(`[ProductCatalog] Deleting training product ${id} from Supabase`);

      const { error } = await supabase
        .from('training_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[ProductCatalog] Error deleting training product:', error);
        return { success: false, error: error.message };
      }

      console.log('[ProductCatalog] Training product deleted successfully');
      const products = await this.getTrainingProducts();
      return { success: true, products };
    } catch (error) {
      console.error('[ProductCatalog] Exception deleting training product:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Delete Personal Product from Supabase
  async deletePersonalProduct(id: string): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      console.log(`[ProductCatalog] Deleting personal product ${id} from Supabase`);

      const { error } = await supabase
        .from('personal_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[ProductCatalog] Error deleting personal product:', error);
        return { success: false, error: error.message };
      }

      console.log('[ProductCatalog] Personal product deleted successfully');
      const products = await this.getPersonalProducts();
      return { success: true, products };
    } catch (error) {
      console.error('[ProductCatalog] Exception deleting personal product:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // ===========================================
  // RESET FUNCTIONS
  // ===========================================

  // Reset Training Products to defaults in Supabase
  async resetTrainingProducts(): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      console.log('[ProductCatalog] Resetting training products to defaults in Supabase');

      // Delete all existing training products
      const { error: deleteError } = await supabase
        .from('training_products')
        .delete()
        .neq('id', 'placeholder'); // Delete all

      if (deleteError) {
        console.error('[ProductCatalog] Error deleting training products:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Insert default products
      const { data, error: insertError } = await supabase
        .from('training_products')
        .insert(DEFAULT_TRAINING_PRODUCTS)
        .select();

      if (insertError) {
        console.error('[ProductCatalog] Error inserting default training products:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log('[ProductCatalog] Training products reset successfully');
      return { success: true, products: data || DEFAULT_TRAINING_PRODUCTS };
    } catch (error) {
      console.error('[ProductCatalog] Exception resetting training products:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Reset Personal Products to defaults in Supabase
  async resetPersonalProducts(): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      console.log('[ProductCatalog] Resetting personal products to defaults in Supabase');

      // Delete all existing personal products
      const { error: deleteError } = await supabase
        .from('personal_products')
        .delete()
        .neq('id', 'placeholder'); // Delete all

      if (deleteError) {
        console.error('[ProductCatalog] Error deleting personal products:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Insert default products
      const { data, error: insertError } = await supabase
        .from('personal_products')
        .insert(DEFAULT_PERSONAL_PRODUCTS)
        .select();

      if (insertError) {
        console.error('[ProductCatalog] Error inserting default personal products:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log('[ProductCatalog] Personal products reset successfully');
      return { success: true, products: data || DEFAULT_PERSONAL_PRODUCTS };
    } catch (error) {
      console.error('[ProductCatalog] Exception resetting personal products:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  // Get product for task (cycles through catalog)
  getProductForTask(taskNumber: number, accountType: 'training' | 'personal', products?: Product[]): Product {
    if (products && products.length > 0) {
      const index = (taskNumber - 1) % products.length;
      return products[index];
    }
    
    // Fallback to defaults if no products provided
    const catalog = accountType === 'training' 
      ? DEFAULT_TRAINING_PRODUCTS 
      : DEFAULT_PERSONAL_PRODUCTS;
    const index = (taskNumber - 1) % catalog.length;
    return catalog[index];
  },

  // Get stats from provided products or Supabase
  async getStats(trainingProducts?: Product[], personalProducts?: Product[]): Promise<{ trainingCount: number; personalCount: number; totalCount: number }> {
    const training = trainingProducts || await this.getTrainingProducts();
    const personal = personalProducts || await this.getPersonalProducts();
    
    return {
      trainingCount: training.length,
      personalCount: personal.length,
      totalCount: training.length + personal.length
    };
  },

  // ===========================================
  // REALTIME SUBSCRIPTION FUNCTIONS
  // ===========================================

  // Subscribe to training products changes
  subscribeToTrainingProducts(callback: (products: Product[]) => void): void {
    console.log('[ProductCatalog] Subscribing to training products changes...');
    trainingProductsUpdateCallback = callback;

    trainingChannel = supabase
      .channel('training_products_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_products' },
        async (payload) => {
          console.log('[ProductCatalog] Training products change detected:', payload.eventType);
          const products = await this.getTrainingProducts();
          if (trainingProductsUpdateCallback) {
            trainingProductsUpdateCallback(products);
          }
        }
      )
      .subscribe((status) => {
        // Subscription status logged only on error
      });
  },

  // Subscribe to personal products changes
  subscribeToPersonalProducts(callback: (products: Product[]) => void): void {
    console.log('[ProductCatalog] Subscribing to personal products changes...');
    personalProductsUpdateCallback = callback;

    personalChannel = supabase
      .channel('personal_products_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personal_products' },
        async (payload) => {
          console.log('[ProductCatalog] Personal products change detected:', payload.eventType);
          const products = await this.getPersonalProducts();
          if (personalProductsUpdateCallback) {
            personalProductsUpdateCallback(products);
          }
        }
      )
      .subscribe((status) => {
        // Subscription status logged only on error
      });
  },

  // Unsubscribe from realtime changes
  unsubscribeFromTrainingProducts(): void {
    console.log('[ProductCatalog] Unsubscribing from training products changes...');
    if (trainingChannel) {
      trainingChannel.unsubscribe();
      trainingChannel = null;
    }
    trainingProductsUpdateCallback = null;
  },

  unsubscribeFromPersonalProducts(): void {
    console.log('[ProductCatalog] Unsubscribing from personal products changes...');
    if (personalChannel) {
      personalChannel.unsubscribe();
      personalChannel = null;
    }
    personalProductsUpdateCallback = null;
  },

  // ===========================================
  // LOCAL STORAGE FALLBACK FUNCTIONS (private)
  // ===========================================

  getTrainingProductsLocal(): Product[] {
    if (typeof window === 'undefined') return DEFAULT_TRAINING_PRODUCTS;
    const stored = localStorage.getItem(TRAINING_PRODUCTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_TRAINING_PRODUCTS;
      }
    }
    return DEFAULT_TRAINING_PRODUCTS;
  },

  getPersonalProductsLocal(): Product[] {
    if (typeof window === 'undefined') return DEFAULT_PERSONAL_PRODUCTS;
    const stored = localStorage.getItem(PERSONAL_PRODUCTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_PERSONAL_PRODUCTS;
      }
    }
    return DEFAULT_PERSONAL_PRODUCTS;
  },

  saveTrainingProductsLocal(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TRAINING_PRODUCTS_KEY, JSON.stringify(products));
  },

  savePersonalProductsLocal(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PERSONAL_PRODUCTS_KEY, JSON.stringify(products));
  }
};

export default ProductCatalogService;
