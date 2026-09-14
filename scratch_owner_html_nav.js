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
html = html.replace(/(<span data-i18n="nav-reports">Laporan & Resit<\/span><\/a>)/, "$1" + desktopSidebarBtn);

const mobileMenuBtn = `
                 <button onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); document.getElementById('mobile-header-menu').classList.add('hidden')" class="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 font-semibold transition">
                   <i class="fas fa-database text-indigo-500 w-5 text-center"></i> <span data-i18n="mob-nav-cms">Master Data (CMS)</span>
                 </button>
`;
html = html.replace(/(<span id="lang-indicator-mob">Bahasa \(EN\)<\/span>\s*<\/button>)/, "$1\n" + mobileMenuBtn);

fs.writeFileSync('public/owner/index.html', html);
