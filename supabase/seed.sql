-- =============================================================
-- Madlen — sample catalogue. Run after schema.sql.
-- Mirrors lib/mock-products.ts so the site looks identical with or
-- without Supabase configured.
-- =============================================================

insert into public.products
  (slug, name_bg, name_en, price_bgn, compare_at_bgn, category, gender, images, sizes, colors, is_new, stock, material_bg)
values
  ('lenena-roklya-ecru', 'Ленена рокля Ecru', 'Ecru Linen Dress', 149, null, 'rokli', 'female',
   array['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80'],
   array['XS','S','M','L'],
   '[{"name":"Екрю","hex":"#e7e1d4"},{"name":"Черно","hex":"#0d0d0d"}]'::jsonb, true, 12, '100% лен'),

  ('oversize-riza-byala', 'Oversize риза, бяла', 'Oversize White Shirt', 89, null, 'topove', 'female',
   array['https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1485231183945-fffde7cc051e?auto=format&fit=crop&w=900&q=80'],
   array['S','M','L','XL'],
   '[{"name":"Бяло","hex":"#f7f5f1"},{"name":"Светло синьо","hex":"#b9c6d6"}]'::jsonb, true, 20, '70% памук, 30% лен'),

  ('vulneno-palto-camel', 'Вълнено палто Camel', 'Camel Wool Coat', 329, 389, 'vrahni', 'female',
   array['https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80'],
   array['S','M','L'],
   '[{"name":"Камел","hex":"#b08d57"},{"name":"Графит","hex":"#3b3b3b"}]'::jsonb, true, 7, '80% вълна, 20% кашмир'),

  ('shiroki-pantaloni-len', 'Широки панталони, лен', 'Wide Linen Trousers', 119, null, 'pantaloni', 'female',
   array['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80'],
   array['XS','S','M','L','XL'],
   '[{"name":"Пясък","hex":"#d8cdb8"},{"name":"Черно","hex":"#0d0d0d"}]'::jsonb, true, 15, '100% лен'),

  ('muzhki-set-leten', 'Мъжки летен сет', 'Men''s Summer Set', 199, null, 'setove', 'male',
   array['https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=80'],
   array['S','M','L','XL','XXL'],
   '[{"name":"Бежово","hex":"#cdbfa6"},{"name":"Маслина","hex":"#6b6b4a"}]'::jsonb, true, 9, '55% лен, 45% вискоза'),

  ('muzhka-tenikka-pique', 'Мъжка тениска Piqué', 'Men''s Piqué Tee', 59, null, 'topove', 'male',
   array['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80'],
   array['S','M','L','XL'],
   '[{"name":"Бяло","hex":"#f7f5f1"},{"name":"Черно","hex":"#0d0d0d"},{"name":"Тъмносиньо","hex":"#1f2a3c"}]'::jsonb, true, 30, '100% памук пике'),

  ('muzhki-pantaloni-chino', 'Мъжки панталон Chino', 'Men''s Chino Trousers', 99, null, 'pantaloni', 'male',
   array['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80'],
   array['S','M','L','XL','XXL'],
   '[{"name":"Бежово","hex":"#cdbfa6"},{"name":"Графит","hex":"#3b3b3b"}]'::jsonb, false, 18, '98% памук, 2% еластан'),

  ('damski-top-rebran', 'Дамски топ, рипс', 'Women''s Ribbed Top', 49, null, 'topove', 'female',
   array['https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'],
   array['XS','S','M','L'],
   '[{"name":"Черно","hex":"#0d0d0d"},{"name":"Екрю","hex":"#e7e1d4"}]'::jsonb, false, 25, '95% вискоза, 5% еластан'),

  ('midi-roklya-satin', 'Midi рокля сатен', 'Satin Midi Dress', 169, null, 'rokli', 'female',
   array['https://images.unsplash.com/photo-1496217590455-aa63a8350eea?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80'],
   array['XS','S','M','L'],
   '[{"name":"Маслина","hex":"#6b6b4a"},{"name":"Черно","hex":"#0d0d0d"}]'::jsonb, false, 10, '100% вискозен сатен'),

  ('muzhko-palto-vulna', 'Мъжко палто, вълна', 'Men''s Wool Coat', 359, null, 'vrahni', 'male',
   array['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80'],
   array['M','L','XL','XXL'],
   '[{"name":"Графит","hex":"#3b3b3b"},{"name":"Камел","hex":"#b08d57"}]'::jsonb, false, 6, '90% вълна, 10% полиамид')

on conflict (slug) do nothing;
