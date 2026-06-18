BEGIN;

-- 1. Seed Core Products
INSERT INTO products (product_name, product_description, is_active) VALUES
('Classic Essential Hoodie', 'Heavyweight organic cotton streetwear hoodie.', TRUE),
('Signature Graphic Tee', 'Premium combed cotton t-shirt with screen print.', TRUE);

-- 2. Seed Product Variants (Linking sizes, colors, and unique SKUs)
-- Using product_id 1 for Hoodies, product_id 2 for Tees
INSERT INTO product_variants (product_id, sku, size_label, color_name, price_cents, is_active) VALUES
(1, 'NYK-HD-BLK-SM', 'S', 'Matte Black', 6500, TRUE),
(1, 'NYK-HD-BLK-MD', 'M', 'Matte Black', 6500, TRUE),
(1, 'NYK-HD-BLK-LG', 'L', 'Matte Black', 6800, TRUE), -- Large has a slight price bump
(2, 'NYK-TS-WHT-MD', 'M', 'Off-White', 3500, TRUE),
(2, 'NYK-TS-WHT-LG', 'L', 'Off-White', 3500, TRUE);

-- 3. Seed Initial Inventory Allocation
-- Linking physical stock directly to the variant IDs generated above
INSERT INTO inventory (product_variant_id, quantity_on_hand, quantity_reserved) VALUES
(1, 50, 0),  -- Small Black Hoodie: 50 available
(2, 100, 5), -- Medium Black Hoodie: 100 on hand, 5 reserved for carts
(3, 75, 12), -- Large Black Hoodie: 75 on hand, 12 reserved
(4, 120, 0), -- Medium White Tee: 120 available
(5, 85, 2);  -- Large White Tee: 85 on hand, 2 reserved

COMMIT;
