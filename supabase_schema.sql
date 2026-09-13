-- ========================================================
-- HomeHub v4.2.0 - Realtime & Idempotent Schema Script
-- ========================================================
-- Másold be ezt a teljes scriptet a Supabase SQL Editor-ba,
-- majd kattints a "RUN" gombra!

-- 1. Régi meglévő táblák és házirendek törlése (Hiba elkerülése)
DROP TABLE IF EXISTS public.family_profiles CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.shopping_items CASCADE;
DROP TABLE IF EXISTS public.todo_tasks CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.family_meals CASCADE;

DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
DROP POLICY IF EXISTS "Product photos are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users manage product photos" ON storage.objects;

-- 2. CSALÁDI PROFILOK TÁBLA (Fiókonként / Családonként elkülönítve)
CREATE TABLE public.family_profiles (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    color TEXT NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id, user_id)
);

-- 3. BOLTOK / ÜZLETEK TÁBLA
CREATE TABLE public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BEVÁSÁRLÓLISTA TÁBLA (Termékfotó támogatással)
CREATE TABLE public.shopping_items (
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

-- 5. TEENDŐK TÁBLA
CREATE TABLE public.todo_tasks (
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

-- 6. HETI ÉTLAP & CSALÁDI EBÉDEK TÁBLA
CREATE TABLE public.family_meals (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT DEFAULT 'ebed',
    title TEXT NOT NULL,
    ingredients TEXT,
    suggested_by TEXT DEFAULT 'everyone',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - Családi fiók izoláció
-- ========================================================
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family profiles policy" ON public.family_profiles
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stores policy" ON public.stores
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shopping items policy" ON public.shopping_items
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Todo tasks policy" ON public.todo_tasks
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family meals policy" ON public.family_meals
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- SUPABASE REALTIME ENGEDÉLYEZÉSE A CSALÁDI ÉLŐ SZINKRONHOZ
-- ========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todo_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_meals;

-- ========================================================
-- STORAGE BUCKET BEÁLLÍTÁSA A TERMÉKFOTÓKHOZ
-- ========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

-- A korábbi "Public Storage Access" házirend `FOR ALL USING (...)` volt,
-- szerep-megkötés nélkül: így BÁRKI (bejelentkezés nélkül is) felülírhatta és
-- törölhette a bucket tartalmát. Olvasás maradjon nyilvános (a bucket publikus,
-- a képek <img src>-ből töltődnek), de írni/törölni csak bejelentkezve lehet.
CREATE POLICY "Product photos are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'product-photos');

CREATE POLICY "Authenticated users manage product photos" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'product-photos')
WITH CHECK (bucket_id = 'product-photos');
