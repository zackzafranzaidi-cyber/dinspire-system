const fs = require('fs');
let js = fs.readFileSync('routes/bookings.js', 'utf8');

js = js.replace('.from("oncall_records").select("tarikh, masa").eq("barber", staff_id)',
                '.from("oncall_records").select("tarikh, masa").eq("staff_id", staff_id)');

fs.writeFileSync('routes/bookings.js', js);
console.log('Fixed staff-availability oncall_records eq staff_id');
