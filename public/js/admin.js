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
    OnCall: "Servis OnCall",
    OnCallBarbers: "Barbers OnCall",
    WalkInServices: "Harga Walk-In",
    Products: "Produk",
    Posters: "Promosi (Poster)",
    Settings: "Tetapan Sistem & Caj",
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
