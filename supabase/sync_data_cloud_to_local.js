require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 1. Clients (Read securely from environment variables)
const cloudUrl = process.env.SUPABASE_URL || 'https://kdaslwdsjtgjggzjdegu.supabase.co';
const cloudKey = process.env.SUPABASE_KEY;

const localUrl = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const localKey = process.env.LOCAL_SUPABASE_KEY;

if (!cloudKey) {
  console.error('❌ Ralat: SUPABASE_KEY (Cloud) tidak dijumpai dalam .env');
  process.exit(1);
}
if (!localKey) {
  console.error('❌ Ralat: LOCAL_SUPABASE_KEY tidak dijumpai dalam .env');
  process.exit(1);
}

const cloudSupabase = createClient(cloudUrl, cloudKey);
const localSupabase = createClient(localUrl, localKey);

// Dependency order for insertion
const tablesInOrder = [
  'settings',
  'owners',
  'admins',
  'branches',
  'staff',
  'customers',
  'haircuts',
  'treatments',
  'products',
  'booking_records',
  'treatment_records',
  'oncall_records',
  'walkin_records',
  'punch_cards',
  'reviews',
  'edit_requests',
  'historical_sales',
  'push_subscriptions'
];

async function fetchAllRowsFromCloud(table) {
  let allRows = [];
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await cloudSupabase
      .from(table)
      .select('*')
      .range(from, from + limit - 1);

    if (error) {
      console.warn(`[CLOUD] Table ${table} query note: ${error.message}`);
      return [];
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      if (data.length < limit) {
        hasMore = false;
      } else {
        from += limit;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

async function insertRowsToLocal(table, rows) {
  if (!rows || rows.length === 0) return 0;
  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await localSupabase.from(table).insert(chunk);
    if (error) {
      console.error(`[LOCAL ERROR] Failed inserting into ${table}:`, error.message);
      throw error;
    }
    inserted += chunk.length;
  }
  return inserted;
}

async function runSync() {
  console.log('========================================================');
  console.log('🚀 MEMULAKAN PENYELARASAN DARI SUPABASE CLOUD KE LOCAL');
  console.log('========================================================\n');

  // Step 1: Extract all data from Cloud first into memory
  const cloudData = {};
  for (const table of tablesInOrder) {
    process.stdout.write(`📥 Mengambil data dari Cloud: ${table.padEnd(20)} ... `);
    const rows = await fetchAllRowsFromCloud(table);
    cloudData[table] = rows;
    console.log(`[${rows.length} rekod]`);
  }

  console.log('\n🗑️ Membersihkan data lama pada Supabase Local (Docker)...');
  // Clean local tables in reverse dependency order
  const reverseTables = [...tablesInOrder].reverse();
  for (const table of reverseTables) {
    try {
      await localSupabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (table === 'settings') {
        await localSupabase.from(table).delete().neq('setting_key', '___non_existent___');
      }
      if (table === 'booking_records') {
        await localSupabase.from(table).delete().neq('no_booking', '___non_existent___');
      }
    } catch (e) {
      // Ignore if table was already empty
    }
  }
  console.log('✅ Supabase Local sedia untuk kemasukan data bersih.\n');

  // Step 2: Insert into Local
  console.log('📤 Memasukkan data ke Supabase Local:');
  for (const table of tablesInOrder) {
    const rows = cloudData[table];
    process.stdout.write(`   Menulis ${table.padEnd(22)} (${String(rows.length).padStart(4)} rekod) ... `);
    if (rows.length > 0) {
      await insertRowsToLocal(table, rows);
    }
    console.log(`✅ SELESAI`);
  }

  // Step 3: Verification
  console.log('\n========================================================');
  console.log('🔍 PENGESAHAN INTEGRITI AKHIR (CLOUD vs LOCAL)');
  console.log('========================================================');
  let allMatched = true;

  for (const table of tablesInOrder) {
    const { count: cCount } = await cloudSupabase.from(table).select('*', { count: 'exact', head: true });
    const { count: lCount } = await localSupabase.from(table).select('*', { count: 'exact', head: true });

    const isMatch = (cCount || 0) === (lCount || 0);
    if (!isMatch) allMatched = false;

    const icon = isMatch ? '✅' : '❌';
    console.log(
      `${icon} ${table.padEnd(20)} | Cloud: ${String(cCount || 0).padEnd(6)} | Local: ${String(lCount || 0).padEnd(6)} | ${isMatch ? 'SEPADAN 100%' : 'TIDAK SEPADAN'}`
    );
  }

  console.log('========================================================');
  if (allMatched) {
    console.log('🎉 TAHNIAH! SUPABASE LOCAL KINI 100% IDENTIKAL DENGAN CLOUD!');
  } else {
    console.log('⚠️ Terdapat perbezaan kecil, sila semak log ralat di atas.');
  }
  console.log('========================================================\n');
}

runSync().catch(err => {
  console.error('\n❌ RALAT SEMASA PENYELARASAN:', err.message);
  process.exit(1);
});
