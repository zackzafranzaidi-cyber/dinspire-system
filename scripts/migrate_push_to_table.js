const supabase = require('../config/db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function runMigration() {
  console.log("=== Memulakan Migrasi Push Subscriptions ke Jadual Dedikasi ===");

  const { data: pushSettings, error: fetchError } = await supabase
    .from('settings')
    .select('setting_key, setting_value, updated_at')
    .ilike('setting_key', '%push%');

  if (fetchError) {
    console.error("Ralat membaca settings:", fetchError);
    process.exit(1);
  }

  console.log(`Dijumpai ${pushSettings.length} rekod push dalam jadual settings.`);

  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const row of pushSettings) {
    let user_type = 'other';
    let user_id = null;

    if (row.setting_key.startsWith('staff_push_')) {
      user_type = 'staff';
      const idCandidate = row.setting_key.replace('staff_push_', '');
      if (UUID_REGEX.test(idCandidate)) user_id = idCandidate;
    } else if (row.setting_key.startsWith('customer_push_')) {
      user_type = 'customer';
      const idCandidate = row.setting_key.replace('customer_push_', '');
      if (UUID_REGEX.test(idCandidate)) user_id = idCandidate;
    } else if (row.setting_key === 'push_sub_owner') {
      user_type = 'owner';
    } else if (row.setting_key === 'push_sub_dev') {
      user_type = 'dev';
    } else if (row.setting_key.startsWith('push_sub_staff_')) {
      user_type = 'staff';
      const idCandidate = row.setting_key.replace('push_sub_staff_', '');
      if (UUID_REGEX.test(idCandidate)) user_id = idCandidate;
    }

    let subs = [];
    try {
      const parsed = JSON.parse(row.setting_value);
      subs = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.warn(`Gagal parse JSON untuk ${row.setting_key}:`, e.message);
      continue;
    }

    for (const sub of subs) {
      if (!sub || !sub.endpoint) {
        totalSkipped++;
        continue;
      }

      // Pastikan langganan tidak diduplikasi
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_type', user_type)
        .filter('subscription->>endpoint', 'eq', sub.endpoint);

      if (existing && existing.length > 0) {
        console.log(`Langganan untuk ${user_type} (${user_id || 'global'}) sudah wujud, langkau.`);
        totalSkipped++;
        continue;
      }

      const insertPayload = {
        user_type,
        user_id,
        subscription: sub,
        device_info: sub.keys ? `p256dh:${sub.keys.p256dh ? 'ok' : 'missing'}` : null,
        created_at: row.updated_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString()
      };

      const { error: insertErr } = await supabase
        .from('push_subscriptions')
        .insert(insertPayload);

      if (insertErr) {
        console.error(`Gagal masukkan rekod untuk ${row.setting_key}:`, insertErr);
      } else {
        totalMigrated++;
        console.log(`[BERJAYA] Dimigrasikan: ${user_type} (user_id: ${user_id || 'null'})`);
      }
    }
  }

  console.log(`\n=== Migrasi Selesai! ===`);
  console.log(`Jumlah rekod berjaya dipindahkan: ${totalMigrated}`);
  console.log(`Jumlah rekod dilangkau (duplikasi/tidak sah): ${totalSkipped}`);

  // Semak baki rekod dalam push_subscriptions
  const { data: allMigrated, error: countErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_type, user_id');

  console.log(`Jumlah rekod aktif dalam push_subscriptions: ${allMigrated ? allMigrated.length : 0}`);
}

runMigration().catch(console.error);
