CREATE TABLE IF NOT EXISTS industry_benchmarks (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  conversion_rate NUMERIC NOT NULL,
  average_order_value NUMERIC NOT NULL,
  gross_margin NUMERIC NOT NULL,
  return_rate NUMERIC NOT NULL,
  monthly_sessions INTEGER NOT NULL DEFAULT 50000,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed from existing hardcoded benchmarks
INSERT INTO industry_benchmarks (id, label, conversion_rate, average_order_value, gross_margin, return_rate, monthly_sessions, sort_order) VALUES
  ('fashion-apparel',  'Fashion & Apparel',     0.025, 85,   0.50, 0.12, 50000, 1),
  ('electronics',      'Electronics & Tech',    0.018, 320,  0.25, 0.08, 50000, 2),
  ('home-garden',      'Home & Garden',         0.022, 135,  0.40, 0.10, 50000, 3),
  ('health-beauty',    'Health & Beauty',       0.028, 65,   0.60, 0.05, 50000, 4),
  ('food-beverage',    'Food & Beverage',       0.032, 55,   0.35, 0.03, 50000, 5),
  ('sports-outdoors',  'Sports & Outdoors',     0.020, 110,  0.45, 0.09, 50000, 6),
  ('luxury',           'Luxury Goods',          0.015, 850,  0.65, 0.04, 50000, 7),
  ('automotive',       'Automotive Parts',      0.021, 180,  0.35, 0.07, 50000, 8),
  ('b2b-services',     'B2B Services',          0.008, 2500, 0.70, 0.02, 50000, 9),
  ('education',        'Education & Training',  0.012, 450,  0.80, 0.01, 50000, 10),
  ('retail-general',   'General Retail',        0.023, 95,   0.40, 0.08, 50000, 11),
  ('other',            'Other',                 0.020, 100,  0.40, 0.08, 50000, 12)
ON CONFLICT (id) DO NOTHING;
