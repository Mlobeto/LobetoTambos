CREATE TABLE IF NOT EXISTS stock_suppliers (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE CHECK (length(trim(name)) > 0)
);
CREATE TABLE IF NOT EXISTS stock_categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE CHECK (length(trim(name)) > 0)
);
CREATE TABLE IF NOT EXISTS stock_products (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  brand text NOT NULL DEFAULT '',
  own_code text UNIQUE,
  category_id integer REFERENCES stock_categories(id)
);
CREATE TABLE IF NOT EXISTS stock_supplier_items (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  supplier_id integer NOT NULL REFERENCES stock_suppliers(id),
  code text NOT NULL CHECK (length(trim(code)) > 0),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  product_id integer REFERENCES stock_products(id),
  UNIQUE (supplier_id, code)
);
CREATE TABLE IF NOT EXISTS stock_balances (
  product_id integer NOT NULL REFERENCES stock_products(id),
  supplier_id integer NOT NULL REFERENCES stock_suppliers(id),
  quantity numeric(16,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  PRIMARY KEY (product_id, supplier_id)
);
CREATE TABLE IF NOT EXISTS stock_notes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('entry', 'exit')),
  supplier_id integer REFERENCES stock_suppliers(id),
  counterpart text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'entry' AND supplier_id IS NOT NULL) OR (kind = 'exit' AND supplier_id IS NULL))
);
CREATE TABLE IF NOT EXISTS stock_note_lines (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  note_id integer NOT NULL REFERENCES stock_notes(id),
  product_id integer NOT NULL REFERENCES stock_products(id),
  supplier_id integer NOT NULL REFERENCES stock_suppliers(id),
  quantity numeric(16,3) NOT NULL CHECK (quantity > 0)
);
CREATE TABLE IF NOT EXISTS stock_sessions (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS stock_sessions_expire_idx ON stock_sessions(expire);
