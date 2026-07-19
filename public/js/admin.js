const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST
  ? "http://localhost:3000/api"
  : "https://api.dinspirebarbershop.com/api";

let appData = {};

// [DIBAIKI] Fungsi keselamatan XSS
function escapeHTML(str) {
  if (!str) return "";
  const charsToReplace = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  };
  return String(str).replace(/[&<>'"]/g, (tag) => charsToReplace[tag] || tag);
}

const SCHEMAS = {
  Haircuts: ["id", "name", "desc", "price"],
  Treatments: ["id", "name", "desc", "price"],
  Branches: ["id", "name", "location"],
  Barbers: ["id", "name", "branch_id"],
  OnCall: ["id", "name", "price"],
  OnCallBarbers: ["id", "name"],
  WalkInServices: ["id", "name", "price"],
  Products: ["id", "name", "price", "imageUrl"],
  Posters: ["id", "imageUrl"],
  GeneralStaff: ["id", "name"],
};

let currentTab = "Haircuts";

document.addEventListener("DOMContentLoaded", () => {
  let isLogged = localStorage.getItem("din_admin_logged");
  if (isLogged) {
    document.getElementById("login-overlay").style.display = "none";
    loadData();
  }
});

async function loginAdmin(allowedRoles) {
  const username = document.getElementById("sys-username").value.trim();
  const password = document.getElementById("sys-password").value.trim();
  const btn = document.querySelector(".login-box button");

  if (!username || !password) {
    Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Sila isi nama pengguna dan kata laluan.",
    });
    return;
  }
  btn.innerText = "Mengesahkan...";

  try {
    const res = await fetch(`${API_BASE_URL}/auth/system-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password, allowed_roles: allowedRoles }),
    });
    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("din_admin_logged", "true");
      document.getElementById("login-overlay").style.display = "none";
      loadData();
      Swal.fire({
        icon: "success",
        title: "Berjaya!",
        text: "Log masuk diluluskan.",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({ icon: "error", title: "Akses Ditolak", text: data.message });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Ralat Sistem",
      text: "Gagal menyambung ke pelayan.",
    });
  }
  btn.innerText = "Log Masuk CMS";
}

function logoutAdmin() {
  fetch(`${API_BASE_URL}/auth/logout-sys`, {
    method: "POST",
    credentials: "include",
  })
    .catch((e) => console.error(e))
    .finally(() => {
      localStorage.removeItem("din_admin_logged");
      location.reload();
    });
}

async function loadData() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/data`, {
      credentials: "include",
    });
    if (res.status === 401 || res.status === 403) {
      logoutAdmin();
      return;
    }

    const result = await res.json();
    if (result.status === "success") {
      appData = result.data;
      if (!appData.Settings)
        appData.Settings = {
          shipping_fee: 0,
          service_fee: 0,
          peratus_komisen: 50,
        };
      renderTable(currentTab);
    }
  } catch (err) {
    console.error(err);
  }
}

function switchTab(tabName, el) {
  currentTab = tabName;
  document
    .querySelectorAll(".nav-item")
    .forEach((nav) => nav.classList.remove("active"));
  if (el) el.classList.add("active");

  let titles = {
    Haircuts: "Guntingan",
    Treatments: "Rawatan",
    Branches: "Cawangan",
    Barbers: "Barbers (Staff)",
    GeneralStaff: "General Staff",
    OnCall: "Servis OnCall",
    OnCallBarbers: "Barbers OnCall",
    WalkInServices: "Harga Walk-In",
    Products: "Produk",
    Posters: "Promosi (Poster)",
    Settings: "Tetapan Sistem & Caj",
    ResetRequests: "Permohonan Reset Kata Laluan",
  };
  document.getElementById("current-section-title").innerText =
    "Pengurusan " + (titles[tabName] || tabName);

  renderTable(tabName);
}

function updateSetting(key, val) {
  if (!appData.Settings) appData.Settings = {};
  appData.Settings[key] = parseFloat(val) || 0;
}

function renderTable(tabName) {
  const container = document.getElementById("dynamic-content");

  if (tabName === "ResetRequests") {
    loadResetRequests();
    return;
  }

  if (tabName === "Settings") {
    let s = appData.Settings || {};
    container.innerHTML = `
          <div style="background:var(--bg-surface); padding:30px; border-radius:12px; max-width:550px; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
              <div class="form-group" style="margin-bottom:20px;">
                  <label style="display:block; margin-bottom:8px; font-weight:bold; color:var(--text-main); font-size:14px;"><i class="fas fa-truck" style="margin-right:5px; color:var(--primary-blue);"></i> Caj Penghantaran Produk (Shipping Fee) - RM</label>
                  <input type="number" class="input-field" value="${s.shipping_fee || 0}" onchange="updateSetting('shipping_fee', this.value)" style="width:100%; padding:12px 15px; border:1px solid var(--border-color); border-radius:8px; font-size:16px; background:#FAFAFC;">
              </div>
              <div class="form-group" style="margin-bottom:20px;">
                  <label style="display:block; margin-bottom:8px; font-weight:bold; color:var(--text-main); font-size:14px;"><i class="fas fa-server" style="margin-right:5px; color:var(--primary-blue);"></i> Caj Penyelenggaraan Servis (Service Fee) - RM</label>
                  <input type="number" class="input-field" value="${s.service_fee || 0}" onchange="updateSetting('service_fee', this.value)" style="width:100%; padding:12px 15px; border:1px solid var(--border-color); border-radius:8px; font-size:16px; background:#FAFAFC;">
              </div>
              <div class="form-group" style="margin-bottom:20px; border-top:1px dashed var(--border-color); padding-top:20px;">
                  <label style="display:block; margin-bottom:8px; font-weight:bold; color:var(--text-main); font-size:14px;"><i class="fas fa-percentage" style="margin-right:5px; color:#FFC107;"></i> Peratus Komisen Staf (%)</label>
                  <input type="number" class="input-field" value="${s.peratus_komisen || 50}" onchange="updateSetting('peratus_komisen', this.value)" style="width:100%; padding:12px 15px; border:1px solid var(--border-color); border-radius:8px; font-size:16px; background:#FAFAFC;">
              </div>
              <div style="background:#F0F4FF; border-radius:8px; padding:15px; border-left:4px solid var(--primary-blue); margin-top:25px;">
                  <p style="font-size:12px; color:var(--primary-blue); margin:0;">*Tekan butang <strong>"Simpan ke Cloud"</strong> di penjuru kanan atas untuk mengemas kini sistem pelanggan serta-merta.</p>
              </div>
          </div>
      `;
    return;
  }

  let dataArr = appData[tabName] || [];
  let cols = SCHEMAS[tabName];

  let html = `<table class="data-table"><thead><tr>`;
  cols.forEach((c) => (html += `<th>${c.toUpperCase()}</th>`));
  html += `<th style="width: 60px;">TINDAKAN</th></tr></thead><tbody>`;

  dataArr.forEach((row, index) => {
    html += `<tr>`;
    cols.forEach((c) => {
      if (c === "imageUrl") {
        let currentImg = row[c] || "https://via.placeholder.com/40?text=IMG";
        html += `<td><div style="display:flex; align-items:center; gap:10px;"><img src="${currentImg}" style="width:40px; height:40px; object-fit:cover; border-radius:6px; border:1px solid #ccc;"><input type="file" accept="image/*" onchange="handleAdminImageUpload(this, '${tabName}', ${index}, '${c}')" style="font-size: 11px; width: 160px;"></div></td>`;
      } else if (c === "branch_id" && tabName === "Barbers") {
        let opts = `<option value="" disabled selected>-- Pilih Cawangan --</option>`;
        (appData["Branches"] || []).forEach((b) => {
          let sel = row[c] === b.id ? "selected" : "";
          opts += `<option value="${b.id}" ${sel}>${escapeHTML(b.name)}</option>`;
        });
        html += `<td><select onchange="updateData('${tabName}', ${index}, '${c}', this.value)" style="padding:10px; border-radius:8px; border:1px solid #E5E5EA; width:100%; outline:none; font-weight:600; font-family:inherit; background:#F4F5F8;">${opts}</select></td>`;
      } else if (tabName === "Branches" && c === "location") {
        html += `<td>
          <div class="input-row" style="display:flex; gap:10px;">
            <input type="text" value="${escapeHTML(row[c] || "")}" onchange="updateData('${tabName}', ${index}, '${c}', this.value)" style="flex:1;">
            <button class="action-btn" style="background:#4CAF50; color:white; min-width:40px; border-radius:8px;" onclick="openMapPicker(${index})" title="Tetapkan Lokasi GPS">
              <i class="fas fa-map-marker-alt"></i>
            </button>
          </div>
        </td>`;
      } else {
        html += `<td><div class="input-row"><input type="text" value="${escapeHTML(row[c] || "")}" onchange="updateData('${tabName}', ${index}, '${c}', this.value)"></div></td>`;
      }
    });
    html += `<td><button class="action-btn del" onclick="deleteRow('${tabName}', ${index})"><i class="fas fa-trash"></i></button></td></tr>`;
  });

  html += `</tbody></table>`;
  html += `<div style="margin-top:20px;"><button class="action-btn add" onclick="addRow('${tabName}')"><i class="fas fa-plus" style="margin-right:8px;"></i> Tambah Rekod Baru</button></div>`;

  container.innerHTML = html;
}

// [DIBAIKI] Fungsi Memampat Imej Diubah ke Sistem Promise yang Stabil
function processImageCompression(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        let scaleSize = img.width > 600 ? 600 / img.width : 1;
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleAdminImageUpload(inputEl, tabName, index, col) {
  const file = inputEl.files[0];
  if (!file) return;
  const btnSave = document.getElementById("main-save-btn");
  btnSave.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Memampatkan...";
  btnSave.disabled = true;

  try {
    // Tunggu sehingga proses pemampatan siap 100%
    const compressedBase64 = await processImageCompression(file);

    // Kemas kini data terus ke dalam memori aplikasi
    updateData(tabName, index, col, compressedBase64);
    inputEl.previousElementSibling.src = compressedBase64;
  } catch (error) {
    console.error("Gagal memampat imej:", error);
    Swal.fire({
      icon: "error",
      title: "Ralat Pemampatan",
      text: "Imej anda gagal diproses. Sila cuba saiz yang lebih kecil.",
    });
  } finally {
    // Buka butang simpan semula selepas pemampatan selesai
    btnSave.innerHTML =
      "<i class='fas fa-cloud-upload-alt'></i> Simpan ke Cloud";
    btnSave.disabled = false;
  }
}

function addRow(tabName) {
  if (!appData[tabName]) appData[tabName] = [];

  if (tabName === "Posters" && appData[tabName].length >= 3) {
    Swal.fire({
      icon: "warning",
      title: "Had Maksimum",
      text: "Maksimum 3 poster sahaja dibenarkan.",
    });
    return;
  }

  let newObj = {};
  SCHEMAS[tabName].forEach((col) => (newObj[col] = ""));
  newObj.id = crypto.randomUUID ? crypto.randomUUID() : "id_" + Date.now();
  appData[tabName].push(newObj);
  renderTable(tabName);
}

function deleteRow(tabName, index) {
  Swal.fire({
    title: "Adakah anda pasti?",
    text: "Rekod ini akan dipadamkan dari jadual!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#FF3B30",
    cancelButtonColor: "#8E8E93",
    confirmButtonText: "Ya, Padam!",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
      appData[tabName].splice(index, 1);
      renderTable(tabName);
    }
  });
}

function updateData(tabName, index, col, value) {
  appData[tabName][index][col] = value;
}

async function saveAllData() {
  const btn = document.getElementById("main-save-btn");
  btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Menyimpan...";
  btn.disabled = true;

  let cleanData = {};
  Object.keys(SCHEMAS).forEach((tab) => {
    cleanData[tab] = (appData[tab] || []).map((item) => {
      let cleanItem = {};
      SCHEMAS[tab].forEach((col) => {
        cleanItem[col] = item[col] || null;
      });
      return cleanItem;
    });
  });

  cleanData.Settings = appData.Settings || {};

  try {
    const res = await fetch(`${API_BASE_URL}/admin/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ data: cleanData }),
    });

    if (res.status === 401 || res.status === 403) {
      Swal.fire({
        icon: "warning",
        title: "Sesi Tamat",
        text: "Sistem akan log keluar secara automatik.",
      }).then(() => {
        logoutAdmin();
      });
      return;
    }

    const result = await res.json();
    if (result.status === "success") {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Semua data telah dikemas kini di Cloud Supabase.",
        confirmButtonText: "Selesai",
      });
      loadData();
    } else {
      Swal.fire({
        icon: "error",
        title: "Ralat Pangkalan Data",
        text: result.message,
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Ralat Pelayan",
      text: "Gagal menyambung ke pelayan Node.js.",
    });
  }

  btn.innerHTML = "<i class='fas fa-cloud-upload-alt'></i> Simpan ke Cloud";
  btn.disabled = false;
}
async function loadResetRequests() {
  const container = document.getElementById("dynamic-content");
  container.innerHTML = `<div style="text-align:center;padding:40px;color:#8e8e93;"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i><p style="margin-top:10px;">Memuatkan senarai...</p></div>`;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/staff/reset-requests`, { credentials: "include" });
    const result = await res.json();

    if (result.data && result.data.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:60px 20px; background:#F9FAFB; border-radius:16px; border:2px dashed #E5E5EA;">
          <div style="font-size:48px; margin-bottom:15px;">✅</div>
          <h3 style="font-size:18px; font-weight:700; color:#1c1c1e;">Tiada Permohonan Reset</h3>
          <p style="font-size:13px; color:#8e8e93; margin-top:8px;">Semua kata laluan staf dalam keadaan baik. Tiada permintaan reset yang menunggu kelulusan.</p>
        </div>`;
      return;
    }

    let html = `
      <div style="margin-bottom:20px; padding:15px; background:#FFF8E1; border-radius:12px; border-left:4px solid #FFC107; display:flex; align-items:center; gap:12px;">
        <i class="fas fa-exclamation-triangle" style="color:#F57F17; font-size:20px;"></i>
        <div>
          <strong style="color:#1c1c1e; font-size:14px;">Permohonan Reset Menunggu Kelulusan</strong>
          <p style="font-size:12px; color:#8e8e93; margin:4px 0 0;">Staf berikut telah memohon reset kata laluan. Klik "Luluskan" untuk set semula kata laluan mereka kepada <strong>123123</strong>.</p>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">`;

    result.data.forEach(staff => {
      html += `
        <div style="background:white; border-radius:14px; padding:20px 25px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 10px rgba(0,0,0,0.06); border:1px solid #F0F0F5;">
          <div style="display:flex; align-items:center; gap:15px;">
            <div style="width:48px; height:48px; border-radius:50%; background:#FFF3E0; color:#E65100; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800;">
              ${escapeHTML(staff.username.charAt(0).toUpperCase())}
            </div>
            <div>
              <div style="font-size:16px; font-weight:700; color:#1c1c1e;">${escapeHTML(staff.username)}</div>
              <div style="font-size:12px; color:#8e8e93; margin-top:3px;">
                <i class="fas fa-briefcase" style="margin-right:4px;"></i>${escapeHTML(staff.jenis_staf || 'Staff')}
              </div>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="background:#FFF3E0; color:#E65100; font-size:11px; font-weight:700; padding:5px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px;">
              <i class="fas fa-clock" style="margin-right:4px;"></i>Menunggu Kelulusan
            </span>
            <button onclick="approveReset('${staff.id}', '${escapeHTML(staff.username)}')" 
              style="background:#2196F3; color:white; border:none; padding:10px 20px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:7px; transition:0.2s;"
              onmouseover="this.style.background='#1976D2'" onmouseout="this.style.background='#2196F3'">
              <i class="fas fa-check-circle"></i> Luluskan
            </button>
          </div>
        </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#FF3B30;"><i class="fas fa-exclamation-circle" style="font-size:24px;"></i><p style="margin-top:10px;">Gagal memuatkan senarai. Sila refresh halaman.</p></div>`;
  }
}

async function approveReset(staffId, staffName) {
  const confirm = await Swal.fire({
    title: `Luluskan Reset untuk ${staffName}?`,
    html: `Kata laluan <strong>${staffName}</strong> akan ditetapkan semula kepada <code style="background:#F0F0F0; padding:2px 6px; border-radius:4px;">123123</code>.<br><br>Staf tersebut perlu log masuk dan menukar kata laluan baru selepas ini.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#2196F3",
    cancelButtonColor: "#8E8E93",
    confirmButtonText: "<i class='fas fa-check'></i> Ya, Luluskan!",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/staff/${staffId}/approve-reset`, {
      method: "PUT",
      credentials: "include",
    });
    const result = await res.json();
    if (result.status === "success") {
      Swal.fire({
        icon: "success",
        title: "Berjaya!",
        html: `Reset kata laluan untuk <strong>${staffName}</strong> telah diluluskan.<br>Kata laluan sementara: <code style="background:#F0F0F0; padding:2px 6px; border-radius:4px;">123123</code>`,
        confirmButtonText: "OK",
      }).then(() => loadResetRequests());
    } else {
      Swal.fire({ icon: "error", title: "Ralat", text: result.message });
    }
  } catch (err) {
    Swal.fire({ icon: "error", title: "Ralat Sistem", text: "Gagal menghubungi pelayan." });
  }
}

let mapInstance = null;
let currentMarker = null;

function openMapPicker(index) {
  const branch = appData.Branches[index];
  const initialLat = branch.lat || 3.1390; // Default: KL
  const initialLng = branch.lng || 101.6869;

  Swal.fire({
    title: `Lokasi GPS: ${escapeHTML(branch.name)}`,
    html: `
      <p style="font-size:13px; color:#666; margin-bottom:10px;">Klik pada peta untuk menetapkan koordinat (Pin Merah).</p>
      <div id="map-picker" style="height: 350px; border-radius: 8px; border: 1px solid #ccc; z-index:0;"></div>
      <div style="margin-top:15px; display:flex; gap:10px;">
        <input type="text" id="map-lat" class="input-field" value="${initialLat}" style="flex:1; background:#ffffff; border:1px solid #ccc; padding:8px; border-radius:6px;" onchange="updateMapFromInput()">
        <input type="text" id="map-lng" class="input-field" value="${initialLng}" style="flex:1; background:#ffffff; border:1px solid #ccc; padding:8px; border-radius:6px;" onchange="updateMapFromInput()">
      </div>
    `,
    width: 600,
    showCancelButton: true,
    confirmButtonText: "Simpan Koordinat",
    cancelButtonText: "Batal",
    didOpen: () => {
      // Initialize Leaflet map inside SweetAlert (Higher zoom for better shop visibility)
      mapInstance = L.map("map-picker").setView([initialLat, initialLng], 17);
      
      // Use Google Maps standard tiles for better detail
      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        attribution: "© Google Maps",
        maxZoom: 21
      }).addTo(mapInstance);
      
      window.updateMapFromInput = function() {
        const lat = parseFloat(document.getElementById("map-lat").value);
        const lng = parseFloat(document.getElementById("map-lng").value);
        if (!isNaN(lat) && !isNaN(lng)) {
           const latlng = [lat, lng];
           mapInstance.setView(latlng, 18);
           if (currentMarker) {
              currentMarker.setLatLng(latlng);
           } else {
              currentMarker = L.marker(latlng).addTo(mapInstance);
           }
        }
      };
      
      // Tambah fungsi carian lokasi (Search Bar)
      L.Control.geocoder({
        defaultMarkGeocode: false
      })
      .on('markgeocode', function(e) {
        var bbox = e.geocode.bbox;
        var poly = L.polygon([
          bbox.getSouthEast(),
          bbox.getNorthEast(),
          bbox.getNorthWest(),
          bbox.getSouthWest()
        ]);
        mapInstance.fitBounds(poly.getBounds());
      })
      .addTo(mapInstance);

      if (branch.lat && branch.lng) {
         currentMarker = L.marker([branch.lat, branch.lng]).addTo(mapInstance);
      }

      mapInstance.on("click", function(e) {
         const lat = e.latlng.lat.toFixed(6);
         const lng = e.latlng.lng.toFixed(6);
         
         if (currentMarker) {
            currentMarker.setLatLng(e.latlng);
         } else {
            currentMarker = L.marker(e.latlng).addTo(mapInstance);
         }
         
         document.getElementById("map-lat").value = lat;
         document.getElementById("map-lng").value = lng;
      });
      
      // Fix leaflet rendering bug in hidden div (sweetalert opening animation)
      setTimeout(() => { mapInstance.invalidateSize(); }, 250);
    },
    preConfirm: () => {
      const lat = parseFloat(document.getElementById("map-lat").value);
      const lng = parseFloat(document.getElementById("map-lng").value);
      if (isNaN(lat) || isNaN(lng)) {
         Swal.showValidationMessage("Sila letakkan pin di atas peta.");
         return false;
      }
      return { lat, lng };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      appData.Branches[index].lat = result.value.lat;
      appData.Branches[index].lng = result.value.lng;
      
      Swal.fire({
         icon: "success",
         title: "Tersimpan Sementara",
         text: "Koordinat berjaya ditetapkan. Sila tekan 'Simpan ke Cloud' untuk simpan sepenuhnya.",
         timer: 2000,
         showConfirmButton: false
      });
    }
    
    // Cleanup map instance
    if (mapInstance) {
       mapInstance.remove();
       mapInstance = null;
       currentMarker = null;
    }
  });
}
