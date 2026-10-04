-- ==============================================================================
-- SETUP DATABASE & SEED DATA LENGKAP UNTUK DEMO PROJECT POS BAKEBLISS
-- Jalankan seluruh script ini di Supabase SQL Editor project Anda.
-- ==============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. DROP EXISTING TABLES JIKA PERLU RESET (Opsional, hapus komentar jika ingin fresh)
-- ==============================================================================
-- DROP TABLE IF EXISTS transaction_items CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS cash_flow CASCADE;
-- DROP TABLE IF EXISTS ingredients CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;

-- ==============================================================================
-- 2. TABEL ROLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (id, name) VALUES 
(1, 'admin'), 
(2, 'cashier') 
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ==============================================================================
-- 3. TABEL PROFILES (Terhubung ke auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role_id INT REFERENCES roles(id) DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. TABEL CATEGORIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO categories (id, name) VALUES 
(1, 'Pastry & Croissant'),
(2, 'Cakes & Desserts'),
(3, 'Coffee & Espresso'),
(4, 'Non-Coffee'),
(5, 'Cookies & Hampers')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ==============================================================================
-- 5. TABEL PRODUCTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. TABEL TRANSACTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    total DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    grand_total DECIMAL(10, 2) NOT NULL,
    paid DECIMAL(10, 2) NOT NULL,
    change DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger untuk nomor transaksi otomatis jika kosong
CREATE OR REPLACE FUNCTION generate_transaction_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_no IS NULL OR NEW.transaction_no = '' THEN
    NEW.transaction_no := 'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_transaction_no ON transactions;
CREATE TRIGGER trg_generate_transaction_no
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION generate_transaction_no();

-- ==============================================================================
-- 7. TABEL TRANSACTION_ITEMS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    qty INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. TABEL CASH_FLOW (Kas Masuk & Keluar)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS cash_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    category VARCHAR(100),
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 9. TABEL INGREDIENTS (Bahan Baku)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    stock DECIMAL(10, 3) DEFAULT 0,
    min_stock DECIMAL(10, 3) DEFAULT 0,
    price_per_unit DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 10. KEAMANAN RLS (Untuk demo project dimatikan agar tidak terkendala permission)
-- ==============================================================================
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 11. SEED DATA DUMMY PRODUK DEMO
-- ==============================================================================
INSERT INTO products (id, name, price, stock, category_id, active, image_url) VALUES
('b1000001-0000-0000-0000-000000000001', 'Butter Croissant Premium', 22000, 35, 1, true, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'),
('b1000001-0000-0000-0000-000000000002', 'Pain au Chocolat', 26000, 28, 1, true, 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400'),
('b1000001-0000-0000-0000-000000000003', 'Almond Croissant', 28000, 20, 1, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'),
('b1000001-0000-0000-0000-000000000004', 'Cinnamon Roll Glaze', 24000, 25, 1, true, 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400'),

('b1000001-0000-0000-0000-000000000005', 'Basque Burnt Cheesecake Slice', 35000, 18, 2, true, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400'),
('b1000001-0000-0000-0000-000000000006', 'Red Velvet Cake Slice', 32000, 15, 2, true, 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=400'),
('b1000001-0000-0000-0000-000000000007', 'Tiramisu Classic Jar', 38000, 14, 2, true, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'),

('b1000001-0000-0000-0000-000000000008', 'Iced Caffe Latte', 24000, 50, 3, true, 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400'),
('b1000001-0000-0000-0000-000000000009', 'Iced Caramel Macchiato', 28000, 45, 3, true, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
('b1000001-0000-0000-0000-000000000010', 'Americano Espresso', 20000, 60, 3, true, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400'),

('b1000001-0000-0000-0000-000000000011', 'Matcha Latte Oatmilk', 28000, 40, 4, true, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400'),
('b1000001-0000-0000-0000-000000000012', 'Signature Belgian Chocolate', 26000, 35, 4, true, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400'),

('b1000001-0000-0000-0000-000000000013', 'Nastar Wisman Toples 350g', 75000, 20, 5, true, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400'),
('b1000001-0000-0000-0000-000000000014', 'Kastengel Keju Edam 350g', 80000, 18, 5, true, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 12. SEED DATA DUMMY BAHAN BAKU (INGREDIENTS)
-- ==============================================================================
INSERT INTO ingredients (id, name, unit, stock, min_stock, price_per_unit) VALUES
('c1000001-0000-0000-0000-000000000001', 'Tepung Terigu Cakra Kembar', 'kg', 65.5, 15.0, 14500),
('c1000001-0000-0000-0000-000000000002', 'Butter Elle & Vire Unsalted', 'kg', 22.0, 5.0, 185000),
('c1000001-0000-0000-0000-000000000003', 'Susu Fresh Milk Greenfields', 'liter', 45.0, 10.0, 22000),
('c1000001-0000-0000-0000-000000000004', 'Biji Kopi Arabica House Blend', 'kg', 18.0, 4.0, 135000),
('c1000001-0000-0000-0000-000000000005', 'Dark Couverture Chocolate 70%', 'kg', 20.0, 5.0, 95000),
('c1000001-0000-0000-0000-000000000006', 'Keju Edam Original', 'kg', 12.0, 3.0, 210000),
('c1000001-0000-0000-0000-000000000007', 'Gula Pasir Kristal', 'kg', 80.0, 20.0, 17500),
('c1000001-0000-0000-0000-000000000008', 'Telur Ayam Omega', 'kg', 30.0, 10.0, 31000)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 13. SEED DATA DUMMY CASH FLOW (KAS MASUK/KELUAR)
-- ==============================================================================
INSERT INTO cash_flow (id, type, category, description, amount, date) VALUES
('d1000001-0000-0000-0000-000000000001', 'in', 'Modal', 'Modal Awal Kas Demo Toko', 5000000, CURRENT_DATE - INTERVAL '3 days'),
('d1000001-0000-0000-0000-000000000002', 'out', 'Pembelian Bahan', 'Restock Butter & Tepung', 850000, CURRENT_DATE - INTERVAL '2 days'),
('d1000001-0000-0000-0000-000000000003', 'in', 'Penjualan', 'Penjualan Shift Pagi Demo', 720000, CURRENT_DATE - INTERVAL '1 days'),
('d1000001-0000-0000-0000-000000000004', 'out', 'Listrik & Air', 'Tagihan Listrik Gerai', 450000, CURRENT_DATE - INTERVAL '1 days'),
('d1000001-0000-0000-0000-000000000005', 'in', 'Penjualan', 'Penjualan Hari Ini', 580000, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 14. SEED DATA DUMMY TRANSAKSI CONTOH (Agar Dashboard & Laporan Langsung Berisi)
-- ==============================================================================
INSERT INTO transactions (id, transaction_no, total, shipping_cost, grand_total, paid, change, payment_method, created_at) VALUES
('e1000001-0000-0000-0000-000000000001', 'TRX-DEMO-001', 70000, 0, 70000, 100000, 30000, 'CASH', now() - interval '2 days'),
('e1000001-0000-0000-0000-000000000002', 'TRX-DEMO-002', 88000, 0, 88000, 100000, 12000, 'CASH', now() - interval '1 days'),
('e1000001-0000-0000-0000-000000000003', 'TRX-DEMO-003', 104000, 0, 104000, 150000, 46000, 'CASH', now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_items (id, transaction_id, product_id, product_name, price, qty, subtotal, created_at) VALUES
('f1000001-0000-0000-0000-000000000001', 'e1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000001', 'Butter Croissant Premium', 22000, 2, 44000, now() - interval '2 days'),
('f1000001-0000-0000-0000-000000000002', 'e1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000002', 'Pain au Chocolat', 26000, 1, 26000, now() - interval '2 days'),

('f1000001-0000-0000-0000-000000000003', 'e1000001-0000-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000005', 'Basque Burnt Cheesecake Slice', 35000, 1, 35000, now() - interval '1 days'),
('f1000001-0000-0000-0000-000000000004', 'e1000001-0000-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000008', 'Iced Caffe Latte', 24000, 1, 24000, now() - interval '1 days'),
('f1000001-0000-0000-0000-000000000005', 'e1000001-0000-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000004', 'Cinnamon Roll Glaze', 24000, 1, 24000, now() - interval '1 days'),

('f1000001-0000-0000-0000-000000000006', 'e1000001-0000-0000-0000-000000000003', 'b1000001-0000-0000-0000-000000000007', 'Tiramisu Classic Jar', 38000, 2, 76000, now() - interval '2 hours'),
('f1000001-0000-0000-0000-000000000007', 'e1000001-0000-0000-0000-000000000003', 'b1000001-0000-0000-0000-000000000009', 'Iced Caramel Macchiato', 28000, 1, 28000, now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 15. SEED USER DEMO (ADMIN & KASIR)
-- Password untuk kedua akun di bawah adalah: demo123456
-- Catatan: Jika query auth.users menghasilkan permission denied karena policy Supabase,
-- Anda juga bisa membuat user via dashboard: Authentication -> Users -> Add User.
-- ==============================================================================
DO $$
BEGIN
  -- Insert Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@bakebliss.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'a1000001-0000-0000-0000-000000000001',
      'authenticated', 'authenticated',
      'admin@bakebliss.com',
      crypt('demo123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo Administrator"}',
      now(), now()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      'a1000001-0000-0000-0000-000000000001',
      'a1000001-0000-0000-0000-000000000001',
      format('{"sub":"%s","email":"%s"}', 'a1000001-0000-0000-0000-000000000001', 'admin@bakebliss.com')::jsonb,
      'email', 'admin@bakebliss.com', now(), now(), now()
    );

    INSERT INTO profiles (id, email, full_name, role_id) VALUES
    ('a1000001-0000-0000-0000-000000000001', 'admin@bakebliss.com', 'Demo Administrator', 1)
    ON CONFLICT (id) DO UPDATE SET role_id = 1;
  END IF;

  -- Insert Kasir
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kasir@bakebliss.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'a1000001-0000-0000-0000-000000000002',
      'authenticated', 'authenticated',
      'kasir@bakebliss.com',
      crypt('demo123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo Kasir"}',
      now(), now()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      'a1000001-0000-0000-0000-000000000002',
      'a1000001-0000-0000-0000-000000000002',
      format('{"sub":"%s","email":"%s"}', 'a1000001-0000-0000-0000-000000000002', 'kasir@bakebliss.com')::jsonb,
      'email', 'kasir@bakebliss.com', now(), now(), now()
    );

    INSERT INTO profiles (id, email, full_name, role_id) VALUES
    ('a1000001-0000-0000-0000-000000000002', 'kasir@bakebliss.com', 'Demo Kasir', 2)
    ON CONFLICT (id) DO UPDATE SET role_id = 2;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback jika Supabase membatasi direct DML pada auth schema
    RAISE NOTICE 'Catatan: Pembuatan user via auth.users dilewati (%.%). Silakan tambahkan user via Authentication > Users pada dashboard Supabase jika belum ada.', SQLSTATE, SQLERRM;
END $$;

