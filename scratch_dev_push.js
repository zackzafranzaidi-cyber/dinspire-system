const fs = require('fs');
let pushJs = fs.readFileSync('utils/push.js', 'utf8');

const devPushFunctions = `
// DEV PUSH
async function addDevSubscription(subscription) {
  try {
    let { data: settingData } = await supabase.from("settings").select("setting_value").eq("setting_key", "push_sub_dev");
    let subs = [];
    if (settingData && settingData.length > 0 && settingData[0].setting_value) {
      try { subs = JSON.parse(settingData[0].setting_value); } catch(e) {}
    }
    const exists = subs.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      if (subs.length > 10) subs.shift();
      await supabase.from("settings").upsert({
        setting_key: "push_sub_dev",
        setting_value: JSON.stringify(subs),
        description: "Dev Push Subscriptions"
      });
    }
  } catch (error) {
    console.error("Gagal simpan dev push:", error);
  }
}

async function notifyDev(title, body, url = "/api/dev-sys-9x8q2/portal") {
  try {
    let { data: settingData } = await supabase.from("settings").select("setting_value").eq("setting_key", "push_sub_dev");
    if (!settingData || settingData.length === 0 || !settingData[0].setting_value) return 0;
    
    let subs = [];
    try { subs = JSON.parse(settingData[0].setting_value); } catch(e) {}
    
    const payload = JSON.stringify({ title, body, icon: "/owner/icon_owner.png", url });
    let validSubs = [];
    let updated = false;
    
    for (let sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
        validSubs.push(sub);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) updated = true;
        else validSubs.push(sub);
      }
    }
    
    if (updated) {
      await supabase.from("settings").update({ setting_value: JSON.stringify(validSubs) }).eq("setting_key", "push_sub_dev");
    }
    return validSubs.length;
  } catch (error) {
    return 0;
  }
}
`;

pushJs = pushJs.replace('module.exports = {', devPushFunctions + '\nmodule.exports = {\n  addDevSubscription,\n  notifyDev,');
fs.writeFileSync('utils/push.js', pushJs);
console.log('Added dev push functions');
