const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const desktopSidebarBtn = `
          <a
            href="#"
            onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS();"
            id="nav-cms"
            class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
            ><i class="fas fa-database w-5"></i>
            <span>Master Data (CMS)</span></a>
`;
html = html.replace(/<span data-i18n="nav-reports">Laporan & Resit<\/span><\/a\s*>/, '<span data-i18n="nav-reports">Laporan & Resit</span></a>\n' + desktopSidebarBtn);

fs.writeFileSync('public/owner/index.html', html);
