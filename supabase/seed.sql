-- ====================================================================
-- Initial Seed Data for Dairy System
-- ====================================================================

-- 1. Initialize Dairy Settings
INSERT INTO dairy_settings (
  dairy_name,
  timezone,
  morning_start,
  morning_end,
  evening_start,
  evening_end,
  is_default
) VALUES (
  'Gokul Dairy Cooperative',
  'Asia/Kolkata',
  '04:00:00',
  '12:00:00',
  '15:00:00',
  '22:00:00',
  true
) ON CONFLICT (is_default) DO NOTHING;

-- 2. Initial Collection Rate Rules (Cow - kg)
INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to) VALUES
('cow', 'kg', 3.0, 4.0, 35.00, '2026-01-01', NULL),
('cow', 'kg', 4.0, 5.0, 38.50, '2026-01-01', NULL),
('cow', 'kg', 5.0, 7.0, 42.00, '2026-01-01', NULL);

-- 3. Initial Collection Rate Rules (Cow - litre)
INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to) VALUES
('cow', 'litre', 3.0, 4.0, 36.00, '2026-01-01', NULL),
('cow', 'litre', 4.0, 5.0, 39.50, '2026-01-01', NULL),
('cow', 'litre', 5.0, 7.0, 43.50, '2026-01-01', NULL);

-- 4. Initial Collection Rate Rules (Buffalo - kg)
INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to) VALUES
('buffalo', 'kg', 5.0, 6.5, 50.00, '2026-01-01', NULL),
('buffalo', 'kg', 6.5, 8.0, 56.00, '2026-01-01', NULL),
('buffalo', 'kg', 8.0, 11.0, 63.00, '2026-01-01', NULL);

-- 5. Initial Collection Rate Rules (Buffalo - litre)
INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to) VALUES
('buffalo', 'litre', 5.0, 6.5, 52.00, '2026-01-01', NULL),
('buffalo', 'litre', 6.5, 8.0, 58.50, '2026-01-01', NULL),
('buffalo', 'litre', 8.0, 11.0, 66.00, '2026-01-01', NULL);

-- 6. Initial Selling Rates (Litres only)
INSERT INTO sale_rate_versions (milk_type, rate_per_litre, valid_from, valid_to) VALUES
('cow', 55.00, '2026-01-01', NULL),
('buffalo', 72.00, '2026-01-01', NULL);

-- 7. Initial Sample Farmers
INSERT INTO farmers (name, phone, is_active) VALUES
('Ramesh Patil', '9822012345', true),
('Suresh Deshmukh', '9822023456', true),
('Ananda Shinde', '9822034567', true),
('Balasaheb Kadam', '9822045678', true);

-- 8. Initial Sample Customers
INSERT INTO customers (name, phone, is_active) VALUES
('Hotel Annapurna', '9422011111', true),
('Pooja Sweets & Dairy', '9422022222', true),
('Mahesh Sharma', '9422033333', true),
('Shree Krishna Tea House', '9422044444', true);
