const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const missingLinks = `
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('WalkInServices');" id="nav-cms-WalkInServices" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-walking w-5"></i> <span>Walk-In Gunting</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('WalkInTreatments');" id="nav-cms-WalkInTreatments" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-magic w-5"></i> <span>Walk-In Rawatan</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('OnCall');" id="nav-cms-OnCall" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-car w-5"></i> <span>On-Call Servis</span></a>
`;

html = html.replace(/(<a href="#" onclick="switchTab\('cms'\).*?id="nav-cms-Treatments".*?<\/a>)/, '$1' + missingLinks);

fs.writeFileSync('public/owner/index.html', html);
