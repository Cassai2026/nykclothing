-- TEST 1: Verify Automated Stock Calculations
SELECT 
    p.product_name,
    v.sku,
    v.size_label,
    v.color_name,
    (v.price_cents / 100.0) AS price_formatted,
    i.quantity_on_hand,
    i.quantity_reserved,
    i.quantity_available
FROM products p
JOIN product_variants v ON p.product_id = v.product_id
JOIN inventory i ON v.product_variant_id = i.product_variant_id;

-- TEST 2: Simulate a Customer Cart Reservation
BEGIN;
UPDATE inventory 
SET quantity_reserved = quantity_reserved + 1 
WHERE product_variant_id = 2;
COMMIT;
