const fs = require('fs');
let content = fs.readFileSync('routes/staff.js', 'utf8');

content = content.replace(/allBookings\.push\(\{\s*order_no: b\.no_booking,/g, 'allBookings.push({\n          table_name: "booking_records",\n          order_no: b.no_booking,');
content = content.replace(/allBookings\.push\(\{\s*order_no: t\.no_booking,/g, 'allBookings.push({\n          table_name: "treatment_records",\n          order_no: t.no_booking,');
content = content.replace(/allBookings\.push\(\{\s*order_no: o\.no_booking,/g, 'allBookings.push({\n          table_name: "oncall_records",\n          order_no: o.no_booking,');
content = content.replace(/allBookings\.push\(\{\s*order_no:\s*"#WLK-" \+ \(w\.id \? w\.id\.substring\(0, 4\)\.toUpperCase\(\) : "000"\),/g, 'allBookings.push({\n          table_name: "walkin_records",\n          id: w.id,\n          order_no:\n            "#WLK-" + (w.id ? w.id.substring(0, 4).toUpperCase() : "000"),');
content = content.replace(/allBookings\.push\(\{\s*table_name: "booking_records",\n\s*order_no: b\.no_booking,/g, 'allBookings.push({\n          table_name: "booking_records",\n          id: b.id,\n          order_no: b.no_booking,');
content = content.replace(/allBookings\.push\(\{\s*table_name: "treatment_records",\n\s*order_no: t\.no_booking,/g, 'allBookings.push({\n          table_name: "treatment_records",\n          id: t.id,\n          order_no: t.no_booking,');
content = content.replace(/allBookings\.push\(\{\s*table_name: "oncall_records",\n\s*order_no: o\.no_booking,/g, 'allBookings.push({\n          table_name: "oncall_records",\n          id: o.id,\n          order_no: o.no_booking,');

fs.writeFileSync('routes/staff.js', content);
console.log("Updated staff.js allBookings table_name and id");
