const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const oldSidebarCMS = `          <!-- KATEGORI CMS -->
          <div class="mt-4 mb-1 px-4 text-[10px] font-bold text-gray-500 tracking-wider uppercase">Pengurusan CMS</div>
          
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Haircuts');" id="nav-cms-Haircuts" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-cut w-5"></i> <span>Servis Gunting</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Treatments');" id="nav-cms-Treatments" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-spa w-5"></i> <span>Rawatan</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('WalkInServices');" id="nav-cms-WalkInServices" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-walking w-5"></i> <span>Walk-In Gunting</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('WalkInTreatments');" id="nav-cms-WalkInTreatments" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-magic w-5"></i> <span>Walk-In Rawatan</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('OnCall');" id="nav-cms-OnCall" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-car w-5"></i> <span>On-Call Servis</span></a>

          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Products');" id="nav-cms-Products" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-box w-5"></i> <span>Produk E-Commerce</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Staff');" id="nav-cms-Staff" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-users-cog w-5"></i> <span>Staf & Pekerja</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Settings');" id="nav-cms-Settings" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-cog w-5"></i> <span>Tetapan Sistem</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Posters');" id="nav-cms-Posters" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-image w-5"></i> <span>Promosi (Poster)</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Branches');" id="nav-cms-Branches" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-store w-5"></i> <span>Cawangan</span></a>
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('ResetRequests');" id="nav-cms-ResetRequests" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-key w-5"></i> <span>Reset Password</span></a>`;

const newSidebarCMS = `          <!-- KATEGORI CMS (Dikumpulkan) -->
          <div class="mt-4 mb-1 px-4 text-[10px] font-bold text-gray-500 tracking-wider uppercase">Pengurusan CMS</div>
          
          <!-- Accordion: Servis & Tempahan -->
          <div class="mb-1">
            <button onclick="document.getElementById('submenu-servis').classList.toggle('hidden'); document.getElementById('icon-submenu-servis').classList.toggle('rotate-180');" class="w-full flex items-center justify-between px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-300 hover:text-white hover:bg-white/5 outline-none">
              <div class="flex items-center gap-3"><i class="fas fa-cut w-5 text-center"></i> <span>Katalog Servis</span></div>
              <i class="fas fa-chevron-down text-[10px] transition-transform duration-300" id="icon-submenu-servis"></i>
            </button>
            <div id="submenu-servis" class="hidden flex-col pl-9 pr-2 py-1 space-y-1">
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Haircuts');" id="nav-cms-Haircuts" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Gunting (Booking)</a>
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Treatments');" id="nav-cms-Treatments" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Rawatan (Booking)</a>
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('WalkInServices');" id="nav-cms-WalkInServices" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Walk-In Gunting</a>
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('WalkInTreatments');" id="nav-cms-WalkInTreatments" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Walk-In Rawatan</a>
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('OnCall');" id="nav-cms-OnCall" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">On-Call Servis</a>
            </div>
          </div>

          <!-- Standalone CMS Links -->
          <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Products');" id="nav-cms-Products" class="sidebar-nav-item flex items-center gap-3 px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"><i class="fas fa-box w-5 text-center"></i> <span>Produk E-Commerce</span></a>
          
          <!-- Accordion: Pentadbiran & Tetapan -->
          <div class="mb-1 mt-1">
            <button onclick="document.getElementById('submenu-admin').classList.toggle('hidden'); document.getElementById('icon-submenu-admin').classList.toggle('rotate-180');" class="w-full flex items-center justify-between px-4 py-2 text-sm rounded-xl font-semibold transition-all text-gray-300 hover:text-white hover:bg-white/5 outline-none">
              <div class="flex items-center gap-3"><i class="fas fa-cogs w-5 text-center"></i> <span>Pentadbiran Kedai</span></div>
              <i class="fas fa-chevron-down text-[10px] transition-transform duration-300" id="icon-submenu-admin"></i>
            </button>
            <div id="submenu-admin" class="hidden flex-col pl-9 pr-2 py-1 space-y-1">
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Staff');" id="nav-cms-Staff" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Staf & Pekerja</a>
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Branches');" id="nav-cms-Branches" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Cawangan</a>
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Settings');" id="nav-cms-Settings" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Tetapan Sistem</a>
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('Posters');" id="nav-cms-Posters" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Promosi (Poster)</a>
              <a href="#" onclick="switchTab('cms'); if(typeof initAdminCMS === 'function') initAdminCMS(); switchAdminTab('ResetRequests');" id="nav-cms-ResetRequests" class="sidebar-nav-item block px-3 py-1.5 text-[13px] rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Reset Password</a>
            </div>
          </div>`;

html = html.replace(oldSidebarCMS, newSidebarCMS);
fs.writeFileSync('public/owner/index.html', html);
