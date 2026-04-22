#!/usr/bin/env node
'use strict';

const { Client } = require('pg');
const fs = require('fs');
const readline = require('readline');

const DATA_DIR = process.env.DATA_DIR || '/data';
const BATCH_SIZE = 300;

const client = new Client({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const b = (v) => (v === null || v === undefined ? null : Boolean(v));
const j = (v) => (v === null || v === undefined ? null : JSON.stringify(v));
const s = (v) => v || null;
const n = (v) => (v === null || v === undefined ? null : v);

// ─── Restaurants ─────────────────────────────────────────────────────────────
// 37 columns per row
const REST_COLS = [
  'identifier','object_id','name','slug','site_name','site_slug','url','short_link',
  'lat','lng','street','postcode','area_name','area_slug','city','country',
  'region','region_code','chef','phone','website',
  'distinction','distinction_score','green_star','good_menu','new_table',
  'guide_year','price_category','currency','currency_symbol',
  'cuisines','image','main_image','main_desc','language','status','online_booking',
];
const REST_K = REST_COLS.length; // 37

function restValues(r) {
  return [
    s(r.identifier), s(r.objectID), s(r.name), s(r.slug),
    s(r.site_name), s(r.site_slug), s(r.url), s(r.short_link),
    n(r._geoloc?.lat), n(r._geoloc?.lng),
    s(r.street), s(r.postcode), s(r.area_name), s(r.area_slug),
    j(r.city), j(r.country),
    s(r.region), s(r.region_code),
    s(r.chef), s(r.phone), s(r.website),
    j(r.distinction), n(r.distinction_score),
    b(r.green_star), b(r.good_menu), b(r.new_table),
    n(r.guide_year), j(r.price_category),
    s(r.currency), s(r.currency_symbol),
    j(r.cuisines), s(r.image), s(r.main_image),
    s(r.main_desc), s(r.language), s(r.status), b(r.online_booking),
  ];
}

// ─── Hotels ──────────────────────────────────────────────────────────────────
// 32 columns per row
const HOTEL_COLS = [
  'hotel_id','object_id','name','slug','url','short_link','michelin_guide_url',
  'lat','lng','address','postal_code','neighborhood','state_province',
  'city','country','region','phone',
  'content','check_in_time','check_out_time',
  'num_rooms','num_reviews','loved_count','favorite_count',
  'is_plus','new_to_selection','sustainable_hotel','bookable',
  'distinction','distinction_score','main_image','language',
];
const HOTEL_K = HOTEL_COLS.length; // 32

function hotelValues(h) {
  return [
    n(h.hotel_id), s(h.objectID), s(h.name), s(h.slug || h.original_slug),
    s(h.url), s(h.short_link), s(h.michelin_guide_url),
    n(h._geoloc?.lat), n(h._geoloc?.lng),
    Array.isArray(h.address) ? h.address.join(', ') : s(h.address),
    s(h.postal_code), s(h.neighborhood), s(h.state_province),
    j(h.city), j(h.country), j(h.region),
    s(h.phone),
    s(h.content), n(h.check_in_time), n(h.check_out_time),
    n(h.num_rooms), n(h.num_reviews), n(h.loved_count), n(h.favorite_count),
    b(h.is_plus), b(h.new_to_selection), b(h.sustainable_hotel), b(h.bookable),
    j(h.distinction), n(h.distinction_score),
    s(h.main_image), s(h.language),
  ];
}

// ─── Generic batch importer ──────────────────────────────────────────────────
async function importFile(filePath, tableName, cols, K, toValues, conflictCol) {
  console.log(`\nImporting ${tableName} from ${filePath}...`);
  if (!fs.existsSync(filePath)) {
    console.warn(`  File not found, skipping.`);
    return;
  }

  const rl = readline.createInterface({ input: fs.createReadStream(filePath) });
  let batch = [];
  let total = 0;
  let skipped = 0;

  const flush = async () => {
    if (!batch.length) return;
    const placeholders = batch.map((_, i) =>
      `(${Array.from({ length: K }, (__, k) => `$${i * K + k + 1}`).join(',')})`
    );
    const values = batch.flatMap(toValues);
    await client.query(
      `INSERT INTO ${tableName} (${cols.join(',')}) VALUES ${placeholders.join(',')}
       ON CONFLICT (${conflictCol}) DO NOTHING`,
      values
    );
    total += batch.length;
    process.stdout.write(`\r  ${total} rows inserted (${skipped} skipped)`);
    batch = [];
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { skipped++; continue; }
    // skip rows without the conflict column value
    const conflictVal = obj[conflictCol === 'identifier' ? 'identifier' : 'hotel_id'];
    if (!conflictVal) { skipped++; continue; }
    batch.push(obj);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
  console.log(`\n  Done: ${total} rows.`);
}

async function waitForDB(retries = 20, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try { await client.connect(); return; } catch {
      console.log(`DB not ready, retrying in ${delay / 1000}s... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Cannot connect to DB.');
}

(async () => {
  try {
    await waitForDB();
    await importFile(
      `${DATA_DIR}/all_restaurants.jsonl`,
      'restaurants', REST_COLS, REST_K, restValues, 'identifier'
    );
    await importFile(
      `${DATA_DIR}/all_hotels.jsonl`,
      'hotels', HOTEL_COLS, HOTEL_K, hotelValues, 'hotel_id'
    );
    console.log('\nImport complete.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
