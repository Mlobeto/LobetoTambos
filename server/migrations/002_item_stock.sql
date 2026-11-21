LOCK TABLE stock_supplier_items, stock_balances, stock_note_lines IN EXCLUSIVE MODE;

ALTER TABLE stock_supplier_items ADD COLUMN own_code text CHECK (own_code IS NULL OR length(trim(own_code)) > 0);

UPDATE stock_supplier_items i SET own_code = p.own_code
FROM stock_products p WHERE i.product_id = p.id AND p.own_code IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM stock_balances b
    WHERE (SELECT count(*) FROM stock_supplier_items i WHERE i.product_id = b.product_id AND i.supplier_id = b.supplier_id) <> 1
  ) OR EXISTS (
    SELECT 1 FROM stock_note_lines l
    WHERE (SELECT count(*) FROM stock_supplier_items i WHERE i.product_id = l.product_id AND i.supplier_id = l.supplier_id) <> 1
  ) THEN
    RAISE EXCEPTION 'No se puede migrar el stock: hay saldos o movimientos asociados a cero o varios artículos del proveedor. Revisar antes de continuar.';
  END IF;
END $$;

CREATE TABLE stock_item_balances (
  item_id integer PRIMARY KEY REFERENCES stock_supplier_items(id),
  quantity numeric(16,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);

CREATE TABLE stock_note_item_lines (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  note_id integer NOT NULL REFERENCES stock_notes(id),
  item_id integer NOT NULL REFERENCES stock_supplier_items(id),
  quantity numeric(16,3) NOT NULL CHECK (quantity > 0),
  legacy_line_id integer UNIQUE REFERENCES stock_note_lines(id)
);

INSERT INTO stock_item_balances (item_id, quantity)
SELECT i.id, b.quantity FROM stock_balances b
JOIN stock_supplier_items i ON i.product_id = b.product_id AND i.supplier_id = b.supplier_id;

INSERT INTO stock_note_item_lines (note_id, item_id, quantity, legacy_line_id)
SELECT l.note_id, i.id, l.quantity, l.id FROM stock_note_lines l
JOIN stock_supplier_items i ON i.product_id = l.product_id AND i.supplier_id = l.supplier_id;
