-- 1) Insert categories (si ya existen, no duplica por slug)
INSERT INTO public.categories (name, slug, icon)
VALUES
  ('Sazonadores','sazonadores','🍲'),
  ('ajies','ajies','🌶️'),
  ('Granos','granos','🌽'),
  ('Bebidas','bebidas','🥤'),
  ('Snacks','snacks','🍿'),
  ('Conservas','conservas','🥫'),
  ('Hierbas','hierbas','🌿'),
  ('Especias','especias','🧂')
ON CONFLICT (slug) DO NOTHING;

-- 2) Insert brands (si ya existen, no duplica por slug)
INSERT INTO public.brands (name, slug)
VALUES
  ('Sazón Lopeza','sazon-lopeza'),
  ('Sibarita','sibarita'),
  ('Alacena','alacena'),
  ('Peru Gourmet','peru-gourmet'),
  ('Andes Foods','andes-foods'),
  ('Cusco Herbs','cusco-herbs'),
  ('Lima Spices','lima-spices'),
  ('Amazon Flavors','amazon-flavors')
ON CONFLICT (slug) DO NOTHING;

-- 3) Insert products usando slug -> id (sin FK error)
INSERT INTO public.products (name, slug, description, price_estimated, weight, image_url, category_id, brand_id)
SELECT
  p.name,
  p.slug,
  p.description,
  p.price_estimated,
  p.weight,
  p.image_url,
  c.id as category_id,
  b.id as brand_id
FROM (
  VALUES
  ('Sazón Lopeza Completo','sazon-lopeza-completo','Mezcla completa de sazonadores peruanos',15.99,200,'/placeholder.png','sazonadores','sazon-lopeza'),
  ('Ají Amarillo en Pasta','aji-amarillo-pasta','Pasta de ají amarillo fresco',12.50,150,'/placeholder.png','ajies','sibarita'),
  ('Culantro Fresco','culantro-fresco','Culantro fresco de los Andes',8.99,100,'/placeholder.png','hierbas','cusco-herbs'),
  ('Tari en Polvo','tari-polvo','Polvo de tari para aderezos',10.00,50,'/placeholder.png','especias','lima-spices'),
  ('Maíz Morado','maiz-morado','Granos de maíz morado andino',6.50,500,'/placeholder.png','granos','andes-foods'),
  ('Inca Kola','inca-kola','Bebida gaseosa tradicional',2.50,355,'/placeholder.png','bebidas','alacena'),
  ('Canchita Salada','canchita-salada','Maíz tostado con sal',4.99,200,'/placeholder.png','snacks','peru-gourmet'),
  ('Filete de Atún','filete-atun','Atún en conserva premium',18.99,170,'/placeholder.png','conservas','sibarita'),
  ('Huacatay en Pasta','huacatay-pasta','Pasta de huacatay fresco',9.50,120,'/placeholder.png','hierbas','cusco-herbs'),
  ('Cúrcuma Andina','curcuma-andina','Cúrcuma orgánica de Cusco',14.99,100,'/placeholder.png','especias','cusco-herbs'),
  ('Quinoa Blanca','quinoa-blanca','Quinoa orgánica blanca',11.99,500,'/placeholder.png','granos','andes-foods'),
  ('Chicha Morada','chicha-morada','Bebida de maíz morado',3.50,500,'/placeholder.png','bebidas','alacena'),
  ('Papas Fritas','papas-fritas','Papas fritas artesanales',6.99,150,'/placeholder.png','snacks','peru-gourmet'),
  ('Palmito en Conserva','palmito-conserva','Palmito ecuatoriano',12.99,400,'/placeholder.png','conservas','alacena'),
  ('Orégano Peruano','oregano-peruano','Orégano seco de la costa',8.50,30,'/placeholder.png','hierbas','lima-spices'),
  ('Achiote en Pasta','achiote-pasta','Pasta de achiote natural',9.99,100,'/placeholder.png','especias','amazon-flavors'),
  ('Cacao en Polvo','cacao-polvo','Cacao puro amazónico',16.99,250,'/placeholder.png','especias','amazon-flavors'),
  ('Café Orgánico','cafe-organico','Café de altura orgánico',19.99,500,'/placeholder.png','bebidas','andes-foods'),
  ('Yuca Fresca','yuca-fresca','Yuca fresca de la selva',3.99,1000,'/placeholder.png','granos','amazon-flavors'),
  ('Maní Salado','mani-salado','Maní tostado con sal',5.50,200,'/placeholder.png','snacks','peru-gourmet')
) AS p(name, slug, description, price_estimated, weight, image_url, category_slug, brand_slug)
JOIN public.categories c ON c.slug = p.category_slug
JOIN public.brands b ON b.slug = p.brand_slug
ON CONFLICT (slug) DO NOTHING;
