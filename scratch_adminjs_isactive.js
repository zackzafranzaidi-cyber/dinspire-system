const fs = require('fs');
let content = fs.readFileSync('routes/admin.js', 'utf8');

content = content.replace(
  'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password"),',
  'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, is_active, status_pekerja"),'
);

// Also need to map is_active back when saving
const syncDataRegex = /staff: \{\n\s*table: "staff",\n\s*mapFn: \(i\) => \(\{\n\s*id: i\.id,\n\s*username: i\.username,\n\s*jenis_staf: i\.jenis_staf,\n\s*branch_id: i\.branch_id,\n\s*status_pekerja: i\.status_pekerja \|\| "full_time"\n\s*\}\),/;

const newSyncData = `staff: {
          table: "staff",
          mapFn: (i) => ({
            id: i.id,
            username: i.username,
            jenis_staf: i.jenis_staf,
            branch_id: i.branch_id,
            status_pekerja: i.status_pekerja || "full_time",
            is_active: i.is_active !== undefined ? i.is_active : true
          }),`;
          
content = content.replace(/staff: \{\s*table: "staff",\s*mapFn: \(i\) => \(\{\s*id: i\.id,\s*username: i\.username,\s*jenis_staf: i\.jenis_staf,\s*branch_id: i\.branch_id,\s*status_pekerja: i\.status_pekerja \|\| "full_time"\s*\}\),/, newSyncData);

fs.writeFileSync('routes/admin.js', content);
console.log("Updated admin.js to handle is_active");
