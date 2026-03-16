-- Insert sample viandas
INSERT INTO "decomer_viandas" (
  "name", "slug", "description",
  "calories", "protein", "carbs", "fats",
  "is_vegetarian", "is_vegan", "is_gluten_free", "is_low_carb", "is_high_protein",
  "ingredients", "price", "is_available"
) VALUES
  ('Pollo al horno con batatas', 'pollo-horno-batatas', 'Pechuga de pollo marinada con especias, acompañada de batatas asadas y vegetales salteados.', 520, '45.5', '38.2', '15.8', false, false, true, false, true, '["pechuga de pollo","batatas","pimientos","cebolla","aceite de oliva","especias"]', '3500.00', true),
  ('Fideos integrales con salsa de tomate casera', 'fideos-integrales-tomate', 'Pasta integral con salsa de tomate natural, albahaca fresca y queso rallado.', 450, '18.0', '65.0', '12.5', true, false, false, false, false, '["fideos integrales","tomate","albahaca","ajo","aceite de oliva","queso rallado"]', '2800.00', true),
  ('Bowl vegano de quinoa y garbanzos', 'bowl-quinoa-garbanzos', 'Quinoa cocida con garbanzos especiados, espinaca, zanahoria y hummus casero.', 480, '22.0', '58.0', '16.0', true, true, true, false, false, '["quinoa","garbanzos","espinaca","zanahoria","hummus","tahini","limon"]', '3200.00', true),
  ('Salmón grillado con brócoli', 'salmon-brocoli', 'Filet de salmón a la parrilla con brócoli al vapor y arroz yamaní.', 550, '42.0', '35.0', '22.0', false, false, true, false, true, '["salmón","brócoli","arroz yamaní","limón","aceite de oliva","ajo"]', '4500.00', true),
  ('Carne al wok con verduras', 'carne-wok-verduras', 'Tiras de carne magra salteadas al wok con mix de vegetales frescos y salsa teriyaki casera.', 490, '38.0', '28.0', '18.5', false, false, false, true, true, '["carne magra","brócoli","pimientos","zanahoria","cebolla","salsa teriyaki","jengibre"]', '3800.00', true),
  ('Milanesa de berenjena con ensalada', 'milanesa-berenjena', 'Milanesas de berenjena al horno acompañadas de ensalada mixta.', 380, '12.0', '42.0', '18.0', true, false, false, false, false, '["berenjena","pan rallado","huevo","lechuga","tomate","zanahoria","aceite de oliva"]', '2600.00', true),
  ('Pechuga de pollo a la mostaza', 'pollo-mostaza', 'Pechuga de pollo con salsa de mostaza y miel, acompañada de puré de calabaza.', 510, '44.0', '32.0', '16.0', false, false, true, false, true, '["pechuga de pollo","mostaza","miel","calabaza","leche","manteca","nuez moscada"]', '3400.00', true),
  ('Risotto de hongos y espinaca', 'risotto-hongos', 'Arroz arborio cremoso con hongos salteados, espinaca y queso parmesano.', 480, '16.0', '62.0', '18.0', true, false, true, false, false, '["arroz arborio","hongos","espinaca","cebolla","vino blanco","queso parmesano","caldo de verduras"]', '3600.00', true),
  ('Taco bowl bajo en carbos', 'taco-bowl-low-carb', 'Carne picada especiada sobre base de coliflor, con palta, tomate y queso.', 420, '35.0', '18.0', '22.0', false, false, true, true, true, '["carne picada","coliflor","palta","tomate","queso rallado","especias mexicanas","cilantro"]', '3700.00', true),
  ('Lentejas con vegetales', 'lentejas-vegetales', 'Guiso de lentejas rojas con zanahoria, apio y batatas. Comfort food saludable.', 390, '20.0', '55.0', '8.0', true, true, true, false, false, '["lentejas rojas","zanahoria","apio","batata","cebolla","ajo","comino","caldo de verduras"]', '2900.00', true)
ON CONFLICT ("slug") DO NOTHING;

-- Create a weekly menu for this week
INSERT INTO "decomer_weekly_menus" ("week_start", "week_end", "is_active")
SELECT 
  DATE_TRUNC('week', CURRENT_DATE)::date AT TIME ZONE 'UTC' as week_start,
  (DATE_TRUNC('week', CURRENT_DATE)::date + 6)::date AT TIME ZONE 'UTC' as week_end,
  true
WHERE NOT EXISTS (SELECT 1 FROM "decomer_weekly_menus" WHERE "is_active" = true)
RETURNING id;

-- Add viandas to the active weekly menu
INSERT INTO "decomer_weekly_menu_viandas" ("weekly_menu_id", "vianda_id", "is_available")
SELECT 
  wm.id,
  v.id,
  true
FROM "decomer_weekly_menus" wm
CROSS JOIN "decomer_viandas" v
WHERE wm."is_active" = true
  AND NOT EXISTS (
    SELECT 1 FROM "decomer_weekly_menu_viandas" wmv
    WHERE wmv."weekly_menu_id" = wm.id AND wmv."vianda_id" = v.id
  )
ON CONFLICT DO NOTHING;
