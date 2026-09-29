const fs = require('fs');
let content = fs.readFileSync('routes/owner.js', 'utf8');

const regexPromise1 = /\{\n\s*const \[\n\s*\{ data: settingData \},\n\s*\{ data: bookings \},\n\s*\{ data: walkins \},\n\s*\{ data: oncalls \},\n\s*\{ data: treatments \}\n\s*\] = await Promise\.all\(\[/;

const newPromise1 = `{
      const [
        { data: settingData },
        { data: bookings },
        { data: walkins },
        { data: oncalls },
        { data: treatments },
        { data: editRequests }
      ] = await Promise.all([`;

content = content.replace(regexPromise1, newPromise1);

const regexPromise1Array = /supabase\n\s*\.from\("treatment_records"\)\n\s*\.select\("\*, staff\(username\), treatments\(nama_rawatan\)"\)\n\s*\.order\("created_at", \{ ascending: false \}\),\n\s*\]\);/;

const newPromise1Array = `supabase
          .from("treatment_records")
          .select("*, staff(username), treatments(nama_rawatan)")
          .order("created_at", { ascending: false }),
        supabase
          .from("edit_requests")
          .select("*, staff(username)")
          .eq("status", "Pending")
      ]);`;

content = content.replace(regexPromise1Array, newPromise1Array);

const payloadRegex = /commissionPercent: commissionPercent,\n\s*partTimeCommissionPercent: partTimeCommissionPercent,\n\s*staffList: staffList,\n\s*products: productsList \|\| \[\],/;

const newPayload = `commissionPercent: commissionPercent,
          partTimeCommissionPercent: partTimeCommissionPercent,
          staffList: staffList,
          products: productsList || [],
          editRequests: editRequests || [],`;

content = content.replace(payloadRegex, newPayload);

fs.writeFileSync('routes/owner.js', content);
console.log("Added editRequests to owner dashboard API");
