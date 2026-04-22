#!/usr/bin/env node
'use strict';

const { Client } = require('pg');
const fs = require('fs');
const readline = require('readline');
const { parse } = require('csv-parse');

const DATA_DIR = process.env.DATA_DIR || '/data';
const BATCH_SIZE = 300;

const client = new Client({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const isBlank = (v) => v === null || v === undefined || v === '';
const s = (v) => (isBlank(v) ? null : String(v));
const toNum = (v) => {
  if (isBlank(v)) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};
const toInt = (v) => {
  if (isBlank(v)) return null;
  const x = parseInt(v, 10);
  return Number.isFinite(x) ? x : null;
};
const toBool = (v) => {
  if (isBlank(v)) return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const x = String(v).trim().toLowerCase();
  if (x === 'true' || x === '1' || x === 'yes') return true;
  if (x === 'false' || x === '0' || x === 'no') return false;
  return null;
};
const parseJson = (v) => {
  if (isBlank(v)) return null;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};
const toJsonb = (v) => {
  const parsed = parseJson(v);
  return parsed === null ? null : JSON.stringify(parsed);
};
const geoFrom = (v) => {
  const geo = parseJson(v) || {};
  return { lat: toNum(geo.lat), lng: toNum(geo.lng) };
};

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
  const geo = typeof r._geoloc === 'object' ? r._geoloc : geoFrom(r._geoloc);
  return [
    s(r.identifier), s(r.objectID), s(r.name), s(r.slug),
    s(r.site_name), s(r.site_slug), s(r.url), s(r.short_link),
    toNum(geo?.lat), toNum(geo?.lng),
    s(r.street), s(r.postcode), s(r.area_name), s(r.area_slug),
    toJsonb(r.city), toJsonb(r.country),
    s(r.region), s(r.region_code),
    s(r.chef), s(r.phone), s(r.website),
    toJsonb(r.distinction), toInt(r.distinction_score),
    toBool(r.green_star), toBool(r.good_menu), toBool(r.new_table),
    toInt(r.guide_year), toJsonb(r.price_category),
    s(r.currency), s(r.currency_symbol),
    toJsonb(r.cuisines), s(r.image), s(r.main_image),
    s(r.main_desc), s(r.language), s(r.status), toBool(r.online_booking),
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
  const geo = typeof h._geoloc === 'object' ? h._geoloc : geoFrom(h._geoloc);
  const address = parseJson(h.address);
  return [
    toInt(h.hotel_id), s(h.objectID), s(h.name), s(h.slug || h.original_slug),
    s(h.url), s(h.short_link), s(h.michelin_guide_url),
    toNum(geo?.lat), toNum(geo?.lng),
    Array.isArray(address) ? address.join(', ') : s(h.address),
    s(h.postal_code), s(h.neighborhood), s(h.state_province),
    toJsonb(h.city), toJsonb(h.country), toJsonb(h.region),
    s(h.phone),
    s(h.content), toNum(h.check_in_time), toNum(h.check_out_time),
    toInt(h.num_rooms), toInt(h.num_reviews), toInt(h.loved_count), toInt(h.favorite_count),
    toBool(h.is_plus), toBool(h.new_to_selection), toBool(h.sustainable_hotel), toBool(h.bookable),
    toJsonb(h.distinction), toInt(h.distinction_score),
    s(h.main_image), s(h.language),
  ];
}

// ─── Generic batch importer ──────────────────────────────────────────────────
async function insertBatch(tableName, cols, K, toValues, conflictCol, batch) {
  const placeholders = batch.map((_, i) =>
    `(${Array.from({ length: K }, (__, k) => `$${i * K + k + 1}`).join(',')})`
  );
  const values = batch.flatMap(toValues);
  await client.query(
    `INSERT INTO ${tableName} (${cols.join(',')}) VALUES ${placeholders.join(',')}
     ON CONFLICT (${conflictCol}) DO NOTHING`,
    values
  );
}

async function importJsonlFile(filePath, tableName, cols, K, toValues, conflictCol, getConflictVal) {
  console.log(`\nImporting ${tableName} from JSONL ${filePath}...`);
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
    await insertBatch(tableName, cols, K, toValues, conflictCol, batch);
    total += batch.length;
    process.stdout.write(`\r  ${total} rows inserted (${skipped} skipped)`);
    batch = [];
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { skipped++; continue; }
    const conflictVal = getConflictVal(obj);
    if (!conflictVal) { skipped++; continue; }
    batch.push(obj);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
  console.log(`\n  Done: ${total} rows.`);
}

async function importCsvFile(filePath, tableName, cols, K, toValues, conflictCol, getConflictVal) {
  console.log(`\nImporting ${tableName} from CSV ${filePath}...`);
  if (!fs.existsSync(filePath)) {
    console.warn('  File not found, skipping.');
    return;
  }

  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
  }));

  let batch = [];
  let total = 0;
  let skipped = 0;

  const flush = async () => {
    if (!batch.length) return;
    await insertBatch(tableName, cols, K, toValues, conflictCol, batch);
    total += batch.length;
    process.stdout.write(`\r  ${total} rows inserted (${skipped} skipped)`);
    batch = [];
  };

  for await (const row of parser) {
    const conflictVal = getConflictVal(row);
    if (!conflictVal) { skipped++; continue; }
    batch.push(row);
    if (batch.length >= BATCH_SIZE) await flush();
  }

  await flush();
  console.log(`\n  Done: ${total} rows.`);
}

async function importDataset({
  tableName,
  csvPath,
  jsonlPath,
  cols,
  K,
  toValues,
  conflictCol,
  getConflictVal,
}) {
  if (fs.existsSync(csvPath)) {
    await importCsvFile(csvPath, tableName, cols, K, toValues, conflictCol, getConflictVal);
    return;
  }
  if (fs.existsSync(jsonlPath)) {
    await importJsonlFile(jsonlPath, tableName, cols, K, toValues, conflictCol, getConflictVal);
    return;
  }
  console.warn(`\nNo CSV/JSONL source found for ${tableName}.`);
}

async function waitForDB(delay = 3000) {
  console.log('Waiting for DB connection...');
  while (true) {
    try {
      await client.connect();
      console.log('DB connection established.');
      return;
    } catch {
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

(async () => {
  try {
    await waitForDB();
    await importDataset({
      tableName: 'restaurants',
      csvPath: `${DATA_DIR}/restaurants.csv`,
      jsonlPath: `${DATA_DIR}/all_restaurants.jsonl`,
      cols: REST_COLS,
      K: REST_K,
      toValues: restValues,
      conflictCol: 'identifier',
      getConflictVal: (row) => s(row.identifier),
    });
    await importDataset({
      tableName: 'hotels',
      csvPath: `${DATA_DIR}/hotels.csv`,
      jsonlPath: `${DATA_DIR}/all_hotels.jsonl`,
      cols: HOTEL_COLS,
      K: HOTEL_K,
      toValues: hotelValues,
      conflictCol: 'hotel_id',
      getConflictVal: (row) => toInt(row.hotel_id),
    });
    console.log('\nImport complete.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
