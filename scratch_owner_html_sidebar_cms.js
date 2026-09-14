const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

// Replace the single CMS button with the categorized links
const oldCMSBtn = `          <a
            href="#"
            onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS();"
            id="nav-cms"
            class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
            ><i class="fas fa-database w-5"></i>
            <span>Master Data (CMS)</span></a>`;

const newCmsLinks = `
          <!-- KATEGORI CMS -->
          <div class="mt-4 mb-1 px-4 text-[10px] font-bold text-gray-500 tracking-wider uppercase">Pengurusan CMS</div>
          
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Haircuts');" id="nav-cms-Haircuts" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-cut w-5"></i> <span>Servis Gunting</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Treatments');" id="nav-cms-Treatments" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-spa w-5"></i> <span>Rawatan</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Products');" id="nav-cms-Products" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-box w-5"></i> <span>Produk E-Commerce</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Staff');" id="nav-cms-Staff" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-users-cog w-5"></i> <span>Staf & Pekerja</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Settings');" id="nav-cms-Settings" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-cog w-5"></i> <span>Tetapan Sistem</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Posters');" id="nav-cms-Posters" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-image w-5"></i> <span>Promosi (Poster)</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Branches');" id="nav-cms-Branches" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-store w-5"></i> <span>Cawangan</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('ResetRequests');" id="nav-cms-ResetRequests" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-key w-5"></i> <span>Reset Password</span></a>
`;

html = html.replace(oldCMSBtn, newCmsLinks);

fs.writeFileSync('public/owner/index.html', html);
