-- roles
CREATE TYPE public.app_role AS ENUM ('admin','staff');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff');
$$;

-- bootstrap manager
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT lower(coalesce(auth.jwt() ->> 'email','')) INTO _email;
  IF _email <> 'fredgitau116@gmail.com' THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  image text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories managed by managers" ON public.categories FOR ALL TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());

-- products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  make text,
  model text,
  year_from int,
  year_to int,
  oem text,
  condition text NOT NULL DEFAULT 'New',
  availability text NOT NULL DEFAULT 'Available',
  price numeric(12,2),
  description text,
  image text,
  gallery text[] NOT NULL DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products managed by managers" ON public.products FOR ALL TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers managed by managers" ON public.customers FOR ALL TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());

-- quotations
CREATE SEQUENCE public.quotation_seq;
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  message text,
  status text NOT NULL DEFAULT 'Pending',
  admin_notes text,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotations managed by managers" ON public.quotations FOR ALL TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());
CREATE TRIGGER quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- quotation items
CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_items TO authenticated;
GRANT ALL ON public.quotation_items TO service_role;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotation items managed by managers" ON public.quotation_items FOR ALL TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());

-- public submission routine
CREATE OR REPLACE FUNCTION public.submit_quotation(
  _full_name text,
  _phone text,
  _email text,
  _vehicle_make text,
  _vehicle_model text,
  _vehicle_year text,
  _message text,
  _items jsonb
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _customer_id uuid;
  _quotation_id uuid;
  _number text;
  _item jsonb;
BEGIN
  IF coalesce(trim(_full_name),'') = '' OR coalesce(trim(_phone),'') = '' THEN
    RAISE EXCEPTION 'Name and phone are required';
  END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'At least one part is required';
  END IF;
  IF jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'Too many items';
  END IF;

  INSERT INTO public.customers (full_name, phone, email)
  VALUES (left(trim(_full_name),120), left(trim(_phone),40), left(nullif(trim(coalesce(_email,'')),''),160))
  RETURNING id INTO _customer_id;

  _number := 'Q-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.quotation_seq')::text, 4, '0');

  INSERT INTO public.quotations (quotation_number, customer_id, vehicle_make, vehicle_model, vehicle_year, message)
  VALUES (_number, _customer_id, left(_vehicle_make,80), left(_vehicle_model,80), left(_vehicle_year,20), left(_message,2000))
  RETURNING id INTO _quotation_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    INSERT INTO public.quotation_items (quotation_id, product_id, product_name, quantity, unit_price)
    SELECT _quotation_id, p.id, p.name, greatest(1, least(999, coalesce((_item->>'quantity')::int, 1))), p.price
    FROM public.products p WHERE p.id = (_item->>'product_id')::uuid;
  END LOOP;

  RETURN _number;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_quotation(text,text,text,text,text,text,text,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quotation(text,text,text,text,text,text,text,jsonb) TO anon, authenticated;