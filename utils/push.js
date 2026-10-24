const webpush = require("web-push");
const supabase = require("../config/db");

// Gunakan VAPID keys yang dijana
const publicVapidKey = "BD-imero9HLLeOY6sE3RJio28QaQQvGIW0il0YTNvumah0p7CksPBieyAGZJDp8Xu924G9L6hM4qmVF-anItSzA";
const privateVapidKey = "ueNdf7-tI8bZrK4tgX0zzU_-GEO4q8YzlTf1uptxp7w";

webpush.setVapidDetails(
  "mailto:admin@dinspirebarbershop.com",
  publicVapidKey,
  privateVapidKey
);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Hadkan langganan peranti aktif maksimum 10 bagi setiap pengguna/peranan (Array Bloat / Resource Protection)
 */
async function pruneUserSubscriptions(userType, userId = null) {
  try {
    let query = supabase
      .from("push_subscriptions")
      .select("id, created_at")
      .eq("user_type", userType);

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.is("user_id", null);
    }

    const { data } = await query.order("created_at", { ascending: true });
    if (data && data.length > 10) {
      const toDelete = data.slice(0, data.length - 10).map((d) => d.id);
      await supabase.from("push_subscriptions").delete().in("id", toDelete);
    }
  } catch (err) {
    console.warn("Gagal prune langganan push:", err.message);
  }
}

/**
 * Simpan atau kemas kini langganan Web-Push ke dalam jadual push_subscriptions
 */
async function saveSubscription(userType, userId, subscription) {
  try {
    if (!subscription || !subscription.endpoint) return;

    const validUserId = userId && UUID_REGEX.test(userId) ? userId : null;

    // Semak sama ada peranti / endpoint ini sudah didaftarkan
    let query = supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_type", userType);

    if (validUserId) {
      query = query.eq("user_id", validUserId);
    }

    const { data: existingRows } = await query;
    const existing = (existingRows || []).find(
      (r) => r.subscription && r.subscription.endpoint === subscription.endpoint
    );

    if (existing) {
      // Kemas kini kunci langganan terkini
      await supabase
        .from("push_subscriptions")
        .update({
          subscription: subscription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Masukkan langganan baharu
      const { error } = await supabase.from("push_subscriptions").insert({
        user_type: userType,
        user_id: validUserId,
        subscription: subscription,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    await pruneUserSubscriptions(userType, validUserId);
  } catch (error) {
    console.error(`Gagal simpan subscription push (${userType}):`, error);
    throw error;
  }
}

/**
 * Hantar notifikasi Web-Push kepada pelanggan, staf, owner, atau dev
 */
async function sendPushToSubscribers(userType, userId, payloadObj) {
  try {
    let query = supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_type", userType);

    if (userId) {
      if (UUID_REGEX.test(userId)) {
        query = query.eq("user_id", userId);
      } else {
        return 0;
      }
    }

    const { data: rows, error } = await query;
    if (error || !rows || rows.length === 0) return 0;

    const payload = JSON.stringify(payloadObj);
    let successCount = 0;

    for (const row of rows) {
      if (!row.subscription || !row.subscription.endpoint) continue;
      try {
        await webpush.sendNotification(row.subscription, payload);
        successCount++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Token / subscription telah tamat tempoh di klien: buang serta-merta
          await supabase.from("push_subscriptions").delete().eq("id", row.id);
        } else {
          console.error(`Ralat hantar push (${userType}):`, err.message);
        }
      }
    }

    return successCount;
  } catch (error) {
    console.error(`Gagal broadcast push (${userType}):`, error);
    return 0;
  }
}

// 1. OWNER
async function addOwnerSubscription(subscription, ownerId = null) {
  return saveSubscription("owner", ownerId, subscription);
}

async function notifyOwner(title, body, url = "/owner/index.html") {
  return sendPushToSubscribers("owner", null, {
    title,
    body,
    icon: "/owner/icon_owner.png",
    url,
  });
}

// 2. STAFF
async function addStaffSubscription(staffId, subscription) {
  return saveSubscription("staff", staffId, subscription);
}

async function notifyStaff(staffId, title, body, url = "/staff/index.html") {
  return sendPushToSubscribers("staff", staffId, {
    title,
    body,
    icon: "/staff/icon_staf.png",
    url,
  });
}

// 3. CUSTOMER
async function addCustomerSubscription(customerId, subscription) {
  return saveSubscription("customer", customerId, subscription);
}

async function notifyCustomer(customerId, title, body, url = "/index.html") {
  return sendPushToSubscribers("customer", customerId, {
    title,
    body,
    icon: "/icon.png",
    url,
  });
}

// 4. DEV
async function addDevSubscription(subscription) {
  return saveSubscription("dev", null, subscription);
}

async function notifyDev(title, body, url = "/dev-sys-9x8q2/") {
  return sendPushToSubscribers("dev", null, {
    title,
    body,
    icon: "/owner/icon_owner.png",
    url,
  });
}

module.exports = {
  addDevSubscription,
  notifyDev,
  addOwnerSubscription,
  notifyOwner,
  addStaffSubscription,
  notifyStaff,
  addCustomerSubscription,
  notifyCustomer,
  publicVapidKey,
};
