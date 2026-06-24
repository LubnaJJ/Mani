-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  price numeric(10,2) not null,
  category_id uuid references categories(id) on delete set null,
  stock integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  cloudinary_url text not null,
  is_primary boolean not null default false
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  phone text not null,
  address text not null,
  total numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity integer not null,
  price_at_purchase numeric(10,2) not null
);

create table payment_slips (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  cloudinary_url text not null,
  uploaded_at timestamptz not null default now()
);
