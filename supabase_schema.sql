-- ========================================================
-- HomeHub - Teljes Supabase Adatbázis & Tábla Script
-- ========================================================
-- Másold be ezt a teljes scriptet a Supabase SQL Editor-ba,
-- majd kattints a "RUN" gombra az adatbázis beállításához!

-- 1. CSALÁDI PROFILOK TÁBLA (Tetszőleges új személyek hozzáadásával)
CREATE TABLE IF NOT EXISTS public.family_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    color TEXT NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alapértelmezett családi profilok beszúrása
INSERT INTO public.family_profiles (id, name, avatar, color, is_custom)
VALUES 
    ('apa', 'Apa', 'AP', '#38bdf8', false),
    ('anya', 'Anya', 'AN', '#ec4899', false),
    ('gyerek', 'Ármin', 'ÁR', '#10b981', false),
    ('everyone', 'Mindenki', 'MI', '#8b5cf6', false)
ON CONFLICT (id) DO NOTHING;

-- 2. BOLTOK / ÜZLETEK TÁBLA (Egyedi boltok támogatásával)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alapértelmezett üzletek beszúrása
INSERT INTO public.stores (name)
VALUES 
    ('Lidl'), ('Aldi'), ('SPAR'), ('Tesco'), ('Penny'), 
    ('Auchan'), ('DM'), ('Rossmann'), ('Egyéb')
ON CONFLICT (name) DO NOTHING;

-- 3. BEVÁSÁRLÓLISTA TÁBLA (Termékfotó támogatással)
CREATE TABLE IF NOT EXISTS public.shopping_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    quantity TEXT,
    estimated_price NUMERIC DEFAULT 0,
    store TEXT DEFAULT 'Lidl',
    category TEXT DEFAULT 'Élelmiszer',
    date DATE DEFAULT CURRENT_DATE,
    assigned_user TEXT DEFAULT 'everyone',
    image_url TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TEENDŐK TÁBLA
CREATE TABLE IF NOT EXISTS public.todo_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Otthon',
    priority TEXT DEFAULT 'medium',
    date DATE DEFAULT CURRENT_DATE,
    assigned_user TEXT DEFAULT 'apa',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. BEFIZETNIVALÓK / SZÁMLÁK TÁBLA
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    due_date DATE DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'Rezsi',
    status TEXT DEFAULT 'pending',
    assigned_user TEXT DEFAULT 'apa',
    paid_date DATE,
    paid_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - Teljes elérés a családnak
-- ========================================================
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Nyilvános hozzáférés engedélyezése az alkalmazás számára
CREATE POLICY "Public profiles access" ON public.family_profiles FOR ALL USING (true);
CREATE POLICY "Public stores access" ON public.stores FOR ALL USING (true);
CREATE POLICY "Public shopping access" ON public.shopping_items FOR ALL USING (true);
CREATE POLICY "Public todos access" ON public.todo_tasks FOR ALL USING (true);
CREATE POLICY "Public bills access" ON public.bills FOR ALL USING (true);

-- ========================================================
-- STORAGE BUCKET BEÁLLÍTÁSA A TERMÉKFOTÓKHOZ
-- ========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Storage Access" ON storage.objects
FOR ALL USING (bucket_id = 'product-photos');
