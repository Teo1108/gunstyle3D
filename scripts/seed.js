// Run once: node scripts/seed.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const products = require('../server/products.json');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function seed() {
  const rows = products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    rating: p.rating,
    is_new: p.isNew,
    description: p.description || '',
    images: p.images || [],
    catalog_image: p.catalogImage || (p.images && p.images[0]) || '',
    sizes: p.sizes || {},
  }));

  const { error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'id' });

  if (error) { console.error('Seed failed:', error.message); process.exit(1); }
  console.log(`Seeded ${rows.length} products.`);
}

seed();
