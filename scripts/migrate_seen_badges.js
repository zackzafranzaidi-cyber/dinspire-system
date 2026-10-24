const supabase = require('../config/db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function runMigration() {
  console.log("=== Memulakan Migrasi Seen Badges ke Jadual Dedikasi ===");

  // 1. Dapatkan owner ID
  const { data: owners, error: ownerErr } = await supabase
    .from('owners')
    .select('id')
    .limit(1);

  if (ownerErr || !owners || owners.length === 0) {
    console.error("Gagal mendapatkan Owner ID:", ownerErr);
    process.exit(1);
  }
  const defaultOwnerId = owners[0].id;
  console.log(`Menggunakan Owner ID: ${defaultOwnerId}`);

  // 2. Ambil semua rekod seen_* dari settings
  const { data: seenSettings, error: fetchError } = await supabase
    .from('settings')
    .select('setting_key, setting_value, updated_at')
    .ilike('setting_key', 'seen_%');

  if (fetchError) {
    console.error("Ralat membaca settings:", fetchError);
    process.exit(1);
  }

  console.log(`Dijumpai ${seenSettings.length} rekod seen badge dalam jadual settings.`);

  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const row of seenSettings) {
    let user_type = null;
    let user_id = null;
    let badge_type = null;
    const count = parseInt(row.setting_value) || 0;

    if (row.setting_key.startsWith('seen_leaves_')) {
      user_type = 'staff';
      badge_type = 'leaves';
      const idCandidate = row.setting_key.replace('seen_leaves_', '');
      if (UUID_REGEX.test(idCandidate)) {
        user_id = idCandidate;
      }
    } else if (row.setting_key.endsWith('_owner')) {
      user_type = 'owner';
      user_id = defaultOwnerId;
      // Contoh: seen_tx_servis_owner -> tx_servis
      badge_type = row.setting_key.replace('seen_', '').replace('_owner', '');
    }

    if (!user_type || !user_id || !badge_type) {
      console.warn(`Langkau kunci tidak dikenali: ${row.setting_key}`);
      totalSkipped++;
      continue;
    }

    const payload = {
      user_type,
      user_id,
      badge_type,
      seen_count: count,
      updated_at: row.updated_at || new Date().toISOString()
    };

    const { error: upsertErr } = await supabase
      .from('seen_badges')
      .upsert(payload, { onConflict: 'user_type, user_id, badge_type' });

    if (upsertErr) {
      console.error(`Gagal masukkan rekod untuk ${row.setting_key}:`, upsertErr);
    } else {
      totalMigrated++;
      console.log(`[BERJAYA] Dimigrasikan: ${user_type} -> ${badge_type} (Count: ${count})`);
    }
  }

  console.log(`\n=== Migrasi Selesai! ===`);
  console.log(`Jumlah rekod berjaya dipindahkan: ${totalMigrated}`);
  console.log(`Jumlah rekod dilangkau: ${totalSkipped}`);

  // Semak baki rekod dalam seen_badges
  const { data: allBadges } = await supabase
    .from('seen_badges')
    .select('id, user_type, badge_type, seen_count');

  console.log(`Jumlah rekod dalam seen_badges: ${allBadges ? allBadges.length : 0}`);
}

runMigration().catch(console.error);
