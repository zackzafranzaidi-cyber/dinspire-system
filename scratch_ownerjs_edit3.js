const fs = require('fs');
let content = fs.readFileSync('routes/owner.js', 'utf8');

// 1. Destructuring
content = content.replace(
  /\{ data: treatments \}\n\s*\] = await Promise\.all\(\[/,
  '{ data: treatments },\n        { data: editRequests }\n      ] = await Promise.all(['
);

// 2. Promise.all array
content = content.replace(
  /supabase\s*\.from\("treatment_records"\)\s*\.select\("\*, staff\(username\), treatments\(nama_rawatan\)"\)\s*\.order\("created_at", \{ ascending: false \}\),\s*\]\);/,
  `supabase
          .from("treatment_records")
          .select("*, staff(username), treatments(nama_rawatan)")
          .order("created_at", { ascending: false }),
        supabase
          .from("edit_requests")
          .select("*, staff(username)")
          .eq("status", "Pending")
      ]);`
);

// 3. Payload
content = content.replace(
  /partTimeCommissionPercent: partTimeCommissionPercent,\s*products: productsList \|\| \[\],\s*\},\s*mapBarberBranch: mapBarberBranch/,
  `partTimeCommissionPercent: partTimeCommissionPercent,
            editRequests: editRequests || [],
            products: productsList || [],
          },
          mapBarberBranch: mapBarberBranch`
);

fs.writeFileSync('routes/owner.js', content);
console.log("Updated owner.js properly");
