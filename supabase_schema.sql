-- ========================================================
-- HomeHub v4.0.0 - Teljes Supabase Auth Gate & Fiók Szegregációs Adatbázis Script
-- ========================================================
-- Másold be ezt a teljes scriptet a Supabase SQL Editor-ba,
-- majd kattints a "RUN" gombra!

-- 1. CSALÁDI PROFILOK TÁBLA (Fiókonként / Regisztrációnként elkülönítve)
CREATE TABLE IF NOT EXISTS public.family_profiles (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    color TEXT NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id, user_id)
);

-- 2. BOLTOK / ÜZLETEK TÁBLA
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BEVÁSÁRLÓLISTA TÁBLA (Termékfotó támogatással)
CREATE TABLE IF NOT EXISTS public.shopping_items (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Otthon',
    priority TEXT DEFAULT 'medium',
    date DATE DEFAULT CURRENT_DATE,
    assigned_user TEXT DEFAULT 'apa',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - Fiók izoláció
-- ========================================================
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_tasks ENABLE ROW LEVEL SECURITY;

-- Csak a bejelentkezett felhasználó éri el a saját adatait!
CREATE POLICY "Family profiles policy" ON public.family_profiles
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stores policy" ON public.stores
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shopping items policy" ON public.shopping_items
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Todo tasks policy" ON public.todo_tasks
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- STORAGE BUCKET BEÁLLÍTÁSA A TERMÉKFOTÓKHOZ
-- ========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Storage Access" ON storage.objects
FOR ALL USING (bucket_id = 'product-photos');
