// ─── Shared Types & Constants for AgriHub Indonesia ───────────────────────

// ── Auth ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;          // WhatsApp number (primary key untuk WA user)
  name: string;
  email?: string;
  role: 'petani' | 'konsumen' | 'distributor' | 'admin';
  avatar_url?: string;
  is_verified: boolean;
  puter_user_id?: string;
  created_at: string;
  updated_at: string;
}

// ── Store / Toko ──────────────────────────────────────────────────────────

export interface Store {
  id: string;
  owner_id: string;
  store_code: string;     // e.g. "TM-2841"
  name: string;
  kabupaten: string;
  provinsi: string;
  latitude?: number;
  longitude?: number;
  product_types: string[];
  description?: string;
  is_active: boolean;
  rating: number;
  total_orders: number;
  created_at: string;
}

// ── Product / Listing ────────────────────────────────────────────────────

export interface Product {
  id: string;
  store_id: string;
  store?: Store;
  name: string;
  category: string;
  unit: string;           // "kg", "ikat", "buah", dll
  price_per_unit: number;
  stock_quantity: number;
  min_order: number;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Order ────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'dibayar'
  | 'diproses'
  | 'dikirim'
  | 'diterima'
  | 'sengketa'
  | 'selesai'
  | 'dibatalkan';

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  platform_fee: number;   // 2% dari total
  ppn_fee: number;        // 11% × platform_fee
  midtrans_mdr: number;   // ~0.7%
  seller_net: number;     // total - fees
  status: OrderStatus;
  midtrans_order_id?: string;
  midtrans_token?: string;
  payment_method?: string;
  shipping_resi?: string;
  shipping_courier?: string;
  notes?: string;
  escrow_released_at?: string;
  dispute_reason?: string;
  created_at: string;
  updated_at: string;
}

// ── Wallet ───────────────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number; // escrow belum release
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit' | 'escrow_hold' | 'escrow_release' | 'withdrawal';
  amount: number;
  description: string;
  reference_id?: string;  // order_id atau withdrawal_id
  created_at: string;
}

// ── Supply-Demand Matching ────────────────────────────────────────────────

export interface SupplyReport {
  id: string;
  reporter_id: string;
  komoditas: string;
  jumlah_kg: number;
  harga_per_kg: number;
  kota: string;
  kabupaten: string;
  provinsi: string;
  latitude?: number;
  longitude?: number;
  tanggal_tersedia: string;
  is_active: boolean;
  match_radius_km: number;    // default 200
  match_price_pct: number;    // default 20 (±20%)
  match_date_days: number;    // default 7 (±7 hari)
  created_at: string;
}

export interface DemandRequest {
  id: string;
  requester_id: string;
  komoditas: string;
  jumlah_kg: number;
  harga_max_per_kg: number;
  kota_tujuan: string;
  deadline: string;
  is_active: boolean;
  match_radius_km: number;
  match_price_pct: number;
  match_date_days: number;
  created_at: string;
}

export interface MatchResult {
  id: string;
  supply_id: string;
  demand_id: string;
  score: number;          // match quality score 0-100
  distance_km: number;
  price_diff_pct: number;
  is_contacted: boolean;
  supply?: SupplyReport;
  demand?: DemandRequest;
  created_at: string;
}

// ── Price Monitoring ─────────────────────────────────────────────────────

export interface PriceHistory {
  id: string;
  komoditas: string;
  wilayah: string;
  harga_per_kg: number;
  source: string;         // "BPS" | "manual" | "scraper"
  date: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  komoditas: string;
  wilayah?: string;
  condition: 'naik' | 'turun';
  threshold_price: number;
  is_active: boolean;
  created_at: string;
}

export interface PricePrediction {
  komoditas: string;
  wilayah: string;
  predicted_price: number;
  confidence: number;     // 0-1
  prediction_date: string;
  generated_at: string;
}

// ── Shipment / Logistik ───────────────────────────────────────────────────

export interface ShipmentOrder {
  id: string;
  order_id: string;
  courier: string;        // "jne", "sicepat", "jnt", dll
  service_type: string;
  origin_area_id: string;
  destination_area_id: string;
  weight_kg: number;
  price: number;
  estimated_days: string;
  waybill_id?: string;    // nomor resi
  biteship_order_id?: string;
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'delivered';
  created_at: string;
}

// ── RAG / AI ──────────────────────────────────────────────────────────────

export interface RAGDocument {
  id: string;
  user_id: string;
  title: string;
  source_type: 'pdf' | 'docx' | 'xlsx' | 'url' | 'youtube' | 'text';
  source_url?: string;
  content_preview: string;
  chunk_count: number;
  is_global: boolean;     // true = tersedia untuk semua user (admin upload)
  created_at: string;
}

// ── WhatsApp Group Credit ──────────────────────────────────────────────────

export interface GroupCredit {
  id: string;
  group_id: string;       // WhatsApp group JID
  owner_id: string;       // user_id pemilik grup
  credits_balance: number;
  credits_used: number;
  is_ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ── API Response ───────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const PLATFORM_FEE_RATE = 0.02;         // 2%
export const PPN_RATE = 0.11;                   // 11% dari platform fee
export const MIDTRANS_MDR_RATE = 0.007;         // ~0.7%
export const ESCROW_AUTO_RELEASE_DAYS = 3;
export const WITHDRAWAL_MIN = 50000;            // Rp 50.000
export const WITHDRAWAL_FEE = 2500;             // Rp 2.500

export const MATCH_DEFAULT_RADIUS_KM = 200;
export const MATCH_DEFAULT_PRICE_PCT = 20;
export const MATCH_DEFAULT_DATE_DAYS = 7;

export const WA_COMMANDS = {
  // Pilar 1 - Marketplace
  DAFTAR_TOKO: 'DAFTAR TOKO',
  JUAL: 'JUAL',
  STOK: 'STOK',
  CARI: 'CARI',
  BELI: 'BELI',
  PESANAN: 'PESANAN',
  KONFIRMASI: 'KONFIRMASI',
  TOLAK: 'TOLAK',
  TERIMA: 'TERIMA',
  BANDING: 'BANDING',
  SALDO: 'SALDO',
  TARIK: 'TARIK',
  LAPORAN: 'LAPORAN',
  BAYAR: 'BAYAR',
  // Pilar 2 - Matching
  BUTUH: 'BUTUH',
  CARI_STOK: 'CARI STOK',
  HUBUNGI: 'HUBUNGI',
  SKALA_MATCHING: 'SKALA MATCHING',
  // Pilar 3 - Harga
  CEK: 'CEK',
  ALERT: 'ALERT',
  INFLASI: 'INFLASI',
  // Pilar 4 - Logistik
  ONGKIR: 'ONGKIR',
  KIRIM: 'KIRIM',
  CEK_RESI: 'CEK RESI',
} as const;

/**
 * Hitung fee breakdown untuk suatu transaksi
 */
export function calculateFees(totalAmount: number) {
  const platformFee = Math.round(totalAmount * PLATFORM_FEE_RATE);
  const ppnFee = Math.round(platformFee * PPN_RATE);
  const midtransMdr = Math.round(totalAmount * MIDTRANS_MDR_RATE);
  const sellerNet = totalAmount - platformFee - ppnFee;
  const platformRevenue = platformFee - ppnFee;
  return { platformFee, ppnFee, midtransMdr, sellerNet, platformRevenue };
}
