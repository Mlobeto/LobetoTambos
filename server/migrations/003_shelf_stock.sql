CREATE TABLE stock_shelf_entries (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id uuid NOT NULL UNIQUE,
  item_id integer NOT NULL REFERENCES stock_supplier_items(id),
  quantity numeric(16,3) NOT NULL CHECK (quantity > 0),
  stock_after numeric(16,3),
  created_at timestamptz NOT NULL DEFAULT now()
);
