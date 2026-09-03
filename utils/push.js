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

// Simpan langganan Owner ke dalam jadual settings
async function addOwnerSubscription(subscription) {
  try {
    let { data: settingData } = await supabase
      .from("settings")
      .select("setting_value")
      .eq("setting_key", "push_sub_owner");

    let subs = [];
    if (settingData && settingData.length > 0 && settingData[0].setting_value) {
      try { subs = JSON.parse(settingData[0].setting_value); } catch(e) {}
    }

    // Check if subscription already exists
    const exists = subs.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      const { error } = await supabase.from("settings").upsert({
        setting_key: "push_sub_owner",
        setting_value: JSON.stringify(subs),
        description: "Owner Push Subscriptions"
      });
      if (error) throw error;
    }
  } catch (error) {
    console.error("Gagal simpan subscription push:", error);
    throw error;
  }
}

// Hantar Push Notification kepada semua peranti Owner
async function notifyOwner(title, body, url = "/owner/index.html") {
  try {
    let { data: settingData } = await supabase
      .from("settings")
      .select("setting_value")
      .eq("setting_key", "push_sub_owner");

    if (!settingData || settingData.length === 0 || !settingData[0].setting_value) return 0;

    let subs = [];
    try { subs = JSON.parse(settingData[0].setting_value); } catch(e) {}

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: "/owner/icon_owner.png",
      url: url
    });

    let validSubs = [];
    let updated = false;

    // Hantar kepada semua
    for (let sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
        validSubs.push(sub);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Subscription telah luput (expired) di bahagian client
          updated = true;
        } else {
          validSubs.push(sub);
          console.error("Ralat hantar push:", error);
        }
      }
    }

    // Update subs yang sah sahaja
    if (updated) {
      await supabase.from("settings").update({
        setting_value: JSON.stringify(validSubs)
      }).eq("setting_key", "push_sub_owner");
    }

    return validSubs.length;
  } catch (error) {
    console.error("Gagal broadcast push:", error);
    return 0;
  }
}

// Simpan langganan Staff ke dalam jadual settings
async function addStaffSubscription(staffId, subscription) {
  try {
    const key = 'staff_push_' + staffId;
    let { data: settingData } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', key);

    let subs = [];
    if (settingData && settingData.length > 0 && settingData[0].setting_value) {
      try { subs = JSON.parse(settingData[0].setting_value); } catch(e) {}
    }

    const exists = subs.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      const { error } = await supabase.from('settings').upsert({
        setting_key: key,
        setting_value: JSON.stringify(subs),
        description: 'Staff Push Subscriptions ' + staffId
      });
      if (error) throw error;
    }
  } catch (error) {
    console.error('Gagal simpan staff subscription push:', error);
    throw error;
  }
}

// Hantar Push Notification kepada peranti Staff tertentu
async function notifyStaff(staffId, title, body, url = '/staff/index.html') {
  try {
    const key = 'staff_push_' + staffId;
    let { data: settingData } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', key);

    if (!settingData || settingData.length === 0 || !settingData[0].setting_value) return 0;

    let subs = [];
    try { subs = JSON.parse(settingData[0].setting_value); } catch(e) {}

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: '/staff/icon_staf.png',
      url: url
    });

    let validSubs = [];
    let updated = false;

    for (let sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
        validSubs.push(sub);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          updated = true;
        } else {
          validSubs.push(sub);
          console.error('Ralat hantar staff push:', error);
        }
      }
    }

    if (updated) {
      await supabase.from('settings').update({
        setting_value: JSON.stringify(validSubs)
      }).eq('setting_key', key);
    }

    return validSubs.length;
  } catch (error) {
    console.error('Gagal broadcast staff push:', error);
    return 0;
  }
}

module.exports = {
  addOwnerSubscription,
  notifyOwner,
  addStaffSubscription,
  notifyStaff,
  publicVapidKey
};
