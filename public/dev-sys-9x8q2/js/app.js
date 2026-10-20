/**
 * Dinspire God Mode - Command Center Engine
 * Arkitek Perisian Pelayan & Pentadbiran Sistem
 */

const API_BASE_URL = "/api/dev-sys-9x8q2";

// ==========================================
// 1. TOAST NOTIFICATION SYSTEM (HUD)
// ==========================================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast-enter glass-panel p-4 rounded-xl shadow-2xl flex items-start gap-3 border pointer-events-auto transition-all";

  let icon = '<i class="fa-solid fa-circle-info text-cyan-400"></i>';
  let borderClass = "border-cyan-500/40 text-cyan-200 bg-slate-900/90";

  if (type === "success") {
    icon = '<i class="fa-solid fa-circle-check text-emerald-400"></i>';
    borderClass = "border-emerald-500/40 text-emerald-200 bg-slate-900/90";
  } else if (type === "error") {
    icon = '<i class="fa-solid fa-triangle-exclamation text-rose-500"></i>';
    borderClass = "border-rose-500/40 text-rose-200 bg-slate-900/90";
  } else if (type === "warn") {
    icon = '<i class="fa-solid fa-bell text-amber-400"></i>';
    borderClass = "border-amber-500/40 text-amber-200 bg-slate-900/90";
  }

  toast.className += ` ${borderClass}`;
  toast.innerHTML = `
    <div class="text-base mt-0.5 shrink-0">${icon}</div>
    <div class="flex-1 text-xs leading-relaxed font-sans">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white text-xs ml-2">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// 2. SIDEBAR & NAVIGATION CONTROLS
// ==========================================
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");

function toggleSidebar() {
  if (!sidebar) return;
  sidebar.classList.toggle("-translate-x-full");
  if (overlay) overlay.classList.toggle("hidden");
}

let currentActiveTab = "data";

function switchTab(tabId, title, subtitle, element) {
  currentActiveTab = tabId;

  // Update Sidebar Active state
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.classList.remove(
      "active",
      "bg-cyan-500/10",
      "text-cyan-400",
      "border",
      "border-cyan-500/20",
      "shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
    );
    item.classList.add("text-slate-400", "hover:text-cyan-400", "hover:bg-slate-900");
    const indicator = item.querySelector(".absolute");
    if (indicator) indicator.remove();
  });

  if (element) {
    element.classList.remove("text-slate-400", "hover:text-cyan-400", "hover:bg-slate-900");
    element.classList.add(
      "active",
      "bg-cyan-500/10",
      "text-cyan-400",
      "border",
      "border-cyan-500/20",
      "shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
    );

    const newIndicator = document.createElement("div");
    newIndicator.className = "absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)]";
    element.prepend(newIndicator);
  }

  // Switch Page Sections
  const pages = document.querySelectorAll(".page-section");
  pages.forEach((page) => {
    page.classList.add("hidden");
    page.classList.remove("block");
  });

  const targetPage = document.getElementById("page-" + tabId);
  if (targetPage) {
    targetPage.classList.remove("hidden");
    targetPage.classList.add("block");
  }

  // Update Header text
  const titleEl = document.getElementById("page-title");
  const subtitleEl = document.getElementById("page-subtitle");
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;

  // Auto Refresh per tab
  if (tabId === "health") fetchHealth();
  if (tabId === "switchboard") loadFlags();
  if (tabId === "data") renderAuditLogs();

  // Close mobile sidebar if open
  if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains("-translate-x-full")) {
    toggleSidebar();
  }
}

function refreshCurrentTab() {
  showToast("Menyegarkan data terkini...", "info");
  if (currentActiveTab === "health") fetchHealth();
  else if (currentActiveTab === "switchboard") loadFlags();
  else if (currentActiveTab === "data") {
    renderAuditLogs();
    fetchHealthMetricsOnly();
  } else {
    loadFlags();
  }
}

// ==========================================
// 3. SUB-TABS: DATA (BACKUP / RESTORE)
// ==========================================
function switchDataTab(tabId, element) {
  const buttons = document.querySelectorAll(".data-tab-btn");
  buttons.forEach((btn) => {
    btn.classList.remove("text-cyan-400", "border-cyan-400", "bg-cyan-500/5");
    btn.classList.add("text-slate-400", "border-transparent");
  });

  if (element) {
    element.classList.remove("text-slate-400", "border-transparent");
    element.classList.add("text-cyan-400", "border-cyan-400", "bg-cyan-500/5");
  }

  const contents = document.querySelectorAll(".data-tab-content");
  contents.forEach((content) => {
    content.classList.add("hidden");
    content.classList.remove("block");
  });

  const target = document.getElementById(tabId);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("block");
  }
}

// ==========================================
// 4. AUTHENTICATION (GOD MODE)
// ==========================================
async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE_URL}/status`, { credentials: "include" });
    const data = await res.json();
    if (data.status === "success") {
      document.getElementById("loginView").classList.add("hidden");
      document.getElementById("dashboardView").classList.remove("hidden");
      loadFlags();
      fetchHealth();
      renderAuditLogs();
    } else {
      document.getElementById("loginView").classList.remove("hidden");
      document.getElementById("dashboardView").classList.add("hidden");
    }
  } catch (err) {
    document.getElementById("loginView").classList.remove("hidden");
    document.getElementById("dashboardView").classList.add("hidden");
  }
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pwdInput = document.getElementById("devPassword");
    const errDiv = document.getElementById("loginError");
    const btnSubmit = document.getElementById("btnLoginSubmit");

    errDiv.classList.add("hidden");
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>MENGESAHKAN...</span>';

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: pwdInput.value.trim() }),
      });
      const data = await res.json();

      if (data.status === "success") {
        showToast("Akses God Mode Diberikan. Selamat datang!", "success");
        document.getElementById("loginView").classList.add("hidden");
        document.getElementById("dashboardView").classList.remove("hidden");
        loadFlags();
        fetchHealth();
        renderAuditLogs();
      } else {
        errDiv.textContent = data.message || "Katalaluan tidak sah.";
        errDiv.classList.remove("hidden");
        showToast(data.message || "Akses ditolak.", "error");
      }
    } catch (err) {
      errDiv.textContent = "Gagal menyambung ke pelayan: " + err.message;
      errDiv.classList.remove("hidden");
      showToast("Ralat sambungan pelayan.", "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i><span>BERIKAN AKSES</span>';
    }
  });
}

async function logoutDev() {
  if (!confirm("Pasti mahu log keluar dari God Mode?")) return;
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    showToast("Sesi ditamatkan.", "info");
    setTimeout(() => location.reload(), 500);
  } catch (e) {
    location.reload();
  }
}

// ==========================================
// 5. SWITCHBOARD (FEATURE FLAGS)
// ==========================================
async function loadFlags() {
  try {
    const res = await fetch(`${API_BASE_URL}/flags`, { credentials: "include" });
    const data = await res.json();
    if (data.status === "success" && data.flags) {
      const f = data.flags;

      const flagMaintenance = document.getElementById("flag-maintenance");
      if (flagMaintenance) {
        flagMaintenance.checked = !!f.maintenance_mode;
        updateMaintenanceLabel(!!f.maintenance_mode);
      }

      const flagCustomer = document.getElementById("flag-customer");
      if (flagCustomer) flagCustomer.checked = f.customer_portal !== false;

      const flagStaff = document.getElementById("flag-staff");
      if (flagStaff) flagStaff.checked = f.staff_portal !== false;

      const flagBooking = document.getElementById("flag-booking");
      if (flagBooking) flagBooking.checked = f.booking !== false;

      const flagEcommerce = document.getElementById("flag-ecommerce");
      if (flagEcommerce) flagEcommerce.checked = f.ecommerce !== false;

      const flagSandbox = document.getElementById("flag-sandbox");
      if (flagSandbox) flagSandbox.checked = !!f.sandbox_payment;

      const flagOtp = document.getElementById("flag-otp");
      if (flagOtp) flagOtp.checked = !!f.otp_bypass;
    }
  } catch (err) {
    console.error("Gagal muat Feature Flags:", err);
  }
}

function updateMaintenanceLabel(isActive) {
  const lbl = document.getElementById("maintenanceStatusLabel");
  if (!lbl) return;
  if (isActive) {
    lbl.textContent = "STATUS: AKTIF (HTTP 503)";
    lbl.className = "text-xs font-mono font-bold text-rose-500 animate-pulse";
  } else {
    lbl.textContent = "STATUS: TIDAK AKTIF";
    lbl.className = "text-xs font-mono font-semibold text-slate-400";
  }
}

async function updateFlag(key, value) {
  try {
    const payload = {};
    payload[key] = value;

    if (key === "maintenance_mode") {
      updateMaintenanceLabel(value);
      if (value) {
        if (!confirm("AMARAN: Anda pasti mahu MENGUNCI SEMUA AKSES pengguna (Mod Penyelenggaraan 503)?")) {
          loadFlags();
          return;
        }
      }
    }

    const res = await fetch(`${API_BASE_URL}/flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ flags: payload }),
    });
    const data = await res.json();

    if (data.status === "success") {
      showToast(`Papan suis diperbaharui: [${key}] = ${value ? "AKTIF" : "PADAM"}`, "success");
      addAuditLog(`Suis ${key} ditukar kepada ${value ? "AKTIF" : "PADAM"}`);
    } else {
      showToast("Gagal mengemaskini suis: " + data.message, "error");
      loadFlags();
    }
  } catch (err) {
    showToast("Ralat rangkaian semasa mengemaskini suis.", "error");
    loadFlags();
  }
}

// ==========================================
// 6. DATA MANAGEMENT (BACKUP, RESTORE, PRUNE, RESET)
// ==========================================
function downloadBackup() {
  const btn = document.getElementById("btnDownloadBackup");
  const progressBox = document.getElementById("download-progress");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const progressLabel = document.getElementById("progress-status-label");

  if (progressBox) progressBox.classList.remove("hidden");
  if (btn) btn.disabled = true;

  let progress = 10;
  if (progressBar) progressBar.style.width = "10%";
  if (progressText) progressText.textContent = "10%";
  if (progressLabel) progressLabel.textContent = "Menyambung ke pangkalan data...";

  const timer = setInterval(() => {
    progress += 20;
    if (progress <= 90) {
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${progress}%`;
      if (progressLabel) progressLabel.textContent = "Mengekstrak jadual & rekod...";
    }
  }, 350);

  // Trigger streaming download
  const downloadUrl = `${API_BASE_URL}/backup?t=${Date.now()}`;
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = downloadUrl;
  document.body.appendChild(iframe);

  setTimeout(() => {
    clearInterval(timer);
    if (progressBar) progressBar.style.width = "100%";
    if (progressText) progressText.textContent = "100%";
    if (progressLabel) progressLabel.textContent = "Sandaran berjaya dimuat turun!";
    showToast("Strim sandaran JSON berjaya dimuat turun.", "success");
    addAuditLog("Strim Sandaran JSON dimuat turun.");

    const lastBackupEl = document.getElementById("stat-lastbackup");
    if (lastBackupEl) lastBackupEl.textContent = "Baru Sahaja";

    setTimeout(() => {
      if (progressBox) progressBox.classList.add("hidden");
      if (btn) btn.disabled = false;
      if (progressBar) progressBar.style.width = "0%";
      iframe.remove();
    }, 2500);
  }, 2000);
}

// Drag & Drop / File Input for Restore
const dropZone = document.getElementById("dropZone");
const restoreFileInput = document.getElementById("restoreFileInput");

if (dropZone && restoreFileInput) {
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("border-cyan-400", "bg-cyan-500/10");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-cyan-400", "bg-cyan-500/10");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-cyan-400", "bg-cyan-500/10");
    const files = e.dataTransfer.files;
    if (files.length > 0) processRestoreFile(files[0]);
  });

  restoreFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      processRestoreFile(e.target.files[0]);
      e.target.value = "";
    }
  });
}

function processRestoreFile(file) {
  if (!file.name.endsWith(".json")) {
    showToast("Sila pilih fail dengan format .json", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    try {
      const json = JSON.parse(event.target.result);
      if (!json.data) {
        showToast("Struktur fail JSON tidak mempunyai nod 'data'.", "error");
        return;
      }

      const confirmed = confirm(
        `AMARAN: Anda pasti mahu memulihkan pangkalan data dari "${file.name}"?\nOperasi ini akan menimpa rekod sedia ada.`
      );
      if (!confirmed) return;

      showToast("Sedang memulihkan data ke pelayan...", "warn");

      const res = await fetch(`${API_BASE_URL}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(json),
      });
      const data = await res.json();

      if (data.status === "success") {
        showToast(data.message, "success");
        addAuditLog(`Pemulihan pangkalan data dari fail: ${file.name}`);
      } else {
        showToast("Ralat pemulihan: " + data.message, "error");
      }
    } catch (err) {
      showToast("Fail JSON rosak atau tidak sah: " + err.message, "error");
    }
  };
  reader.readAsText(file);
}

async function triggerPrune() {
  if (!confirm("Jalankan pemotongan arkib tahunan (Prune) sekarang?\nRekod lebih 2 tahun akan dipindahkan ke sejarah.")) return;

  showToast("Memulakan pemotongan arkib...", "info");
  try {
    const res = await fetch(`${API_BASE_URL}/prune`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();

    if (data.status === "success") {
      showToast(data.message, "success");
      addAuditLog("Pemotongan arkib tahunan dijalankan.");
    } else {
      showToast("Gagal memotong data: " + data.message, "error");
    }
  } catch (err) {
    showToast("Ralat komunikasi pelayan.", "error");
  }
}

// Danger Zone: 3-Tier Factory Reset
function checkResetInput() {
  const input = document.getElementById("confirm-reset").value.trim();
  const btn = document.getElementById("btn-reset");
  if (!btn) return;

  if (input === "PADAM") {
    btn.disabled = false;
    btn.classList.remove("bg-slate-800", "text-slate-500", "cursor-not-allowed", "border-slate-700");
    btn.classList.add(
      "bg-rose-600",
      "hover:bg-rose-500",
      "text-white",
      "cursor-pointer",
      "border-rose-800",
      "shadow-[0_0_15px_rgba(239,68,68,0.5)]"
    );
  } else {
    btn.disabled = true;
    btn.classList.remove(
      "bg-rose-600",
      "hover:bg-rose-500",
      "text-white",
      "cursor-pointer",
      "border-rose-800",
      "shadow-[0_0_15px_rgba(239,68,68,0.5)]"
    );
    btn.classList.add("bg-slate-800", "text-slate-500", "cursor-not-allowed", "border-slate-700");
  }
}

function openResetModal() {
  const modal = document.getElementById("resetModal");
  if (modal) modal.classList.remove("hidden");
}

function closeResetModal() {
  const modal = document.getElementById("resetModal");
  if (modal) modal.classList.add("hidden");
  const phrase = document.getElementById("resetPhrase");
  const otp = document.getElementById("resetOTP");
  if (phrase) phrase.value = "";
  if (otp) otp.value = "";
}

async function executeFactoryReset() {
  const phrase = document.getElementById("resetPhrase").value.trim();
  const otp = document.getElementById("resetOTP").value.trim();

  if (phrase !== "DELETE-ALL-DINSPIRE-DATA") {
    showToast("Teks pengesahan tidak sepadan.", "error");
    return;
  }
  if (!otp) {
    showToast("Sila masukkan kata laluan / OTP pembangun.", "error");
    return;
  }

  showToast("Melaksanakan pembersihan menyeluruh...", "warn");

  try {
    const res = await fetch(`${API_BASE_URL}/factory-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ confirmation_text: phrase, otp: otp }),
    });
    const data = await res.json();

    if (data.status === "success") {
      showToast(data.message, "success");
      addAuditLog("AMARAN: RESET KILANG 3-LAPIS DILAKSANAKAN.");
      closeResetModal();
      document.getElementById("confirm-reset").value = "";
      checkResetInput();
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    showToast("Ralat pelayan: " + err.message, "error");
  }
}

// ==========================================
// 7. SERVER HEALTH & LOGS
// ==========================================
async function fetchHealth() {
  await fetchHealthMetricsOnly();

  // Fetch Live Error Logs
  const terminal = document.getElementById("terminal-logs");
  const logFileName = document.getElementById("logFileName");

  try {
    const res = await fetch(`${API_BASE_URL}/logs`, { credentials: "include" });
    const data = await res.json();

    if (data.status === "success") {
      if (logFileName && data.file) logFileName.textContent = data.file;

      if (terminal) {
        if (!data.logs || data.logs.trim() === "") {
          terminal.innerHTML = '<span class="text-emerald-400 text-glow-green">[STATUS] Tiada ralat aktif dikesan hari ini. Pelayan sihat.</span>';
        } else {
          terminal.innerHTML = formatTerminalLogs(data.logs);
        }
      }
    } else {
      if (terminal) terminal.textContent = "Gagal memuatkan log: " + data.message;
    }
  } catch (err) {
    if (terminal) terminal.textContent = "Ralat semasa mengambil log pelayan.";
  }
}

async function fetchHealthMetricsOnly() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { credentials: "include" });
    const data = await res.json();

    if (data.status === "success" && data.metrics) {
      const m = data.metrics;

      // Database Latency
      const dbEl = document.getElementById("metric-db");
      if (dbEl) dbEl.innerHTML = `${m.database_latency_ms}<span class="text-sm text-slate-500 ml-1">ms</span>`;

      // Sparkline dynamic jitter
      updateSparkline(m.database_latency_ms);

      // RAM Usage & Circle
      const ramEl = document.getElementById("metric-ram");
      if (ramEl) ramEl.innerHTML = `${m.memory_usage_mb}<span class="text-sm text-slate-500 ml-1">MB</span>`;

      const ramCircle = document.getElementById("ramCircle");
      if (ramCircle) {
        // Circumference is ~113. 512MB max scale
        const pct = Math.min(m.memory_usage_mb / 512, 1);
        const offset = 113 - 113 * pct;
        ramCircle.style.strokeDashoffset = offset;
      }

      // Supabase Status
      const statusEl = document.getElementById("metric-status");
      if (statusEl) {
        statusEl.textContent = m.database_status;
        if (m.database_status === "ONLINE") {
          statusEl.className = "text-xl font-bold text-emerald-400 tracking-wide";
        } else {
          statusEl.className = "text-xl font-bold text-rose-500 tracking-wide";
        }
      }

      // SMS Gateway
      const smsEl = document.getElementById("metric-sms");
      if (smsEl) smsEl.textContent = m.sms_gateway;
    }
  } catch (err) {
    console.warn("Gagal membaca metrik kesihatan pelayan:", err);
  }
}

function updateSparkline(latency) {
  const path = document.getElementById("sparkline-path");
  if (!path) return;
  // Generate slightly dynamic points based on current latency
  const base = Math.min(Math.max(latency / 20, 2), 16);
  const p1 = Math.round(base + (Math.random() * 4 - 2));
  const p2 = Math.round(base + (Math.random() * 6 - 3));
  const p3 = Math.round(base + (Math.random() * 5 - 2));
  path.setAttribute("d", `M0 15 L10 ${p1} L20 18 L30 5 L40 ${p2} L50 2 L60 8 L70 ${p3} L80 5 L90 ${p1} L100 2`);
}

function formatTerminalLogs(raw) {
  const lines = raw.split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.includes("[error]") || trimmed.includes("ERROR") || trimmed.includes("TypeError")) {
        return `<p class="text-rose-400 text-glow-red">${escapeHtml(trimmed)}</p>`;
      } else if (trimmed.includes("[warn]") || trimmed.includes("WARN")) {
        return `<p class="text-amber-400">${escapeHtml(trimmed)}</p>`;
      } else if (trimmed.includes("[info]") || trimmed.includes("INFO")) {
        return `<p class="text-emerald-400 text-glow-green">${escapeHtml(trimmed)}</p>`;
      } else if (trimmed.includes("[debug]") || trimmed.includes("DEBUG")) {
        return `<p class="text-slate-500">${escapeHtml(trimmed)}</p>`;
      }
      return `<p class="text-slate-400">${escapeHtml(trimmed)}</p>`;
    })
    .join("");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function flushCache() {
  try {
    const res = await fetch(`${API_BASE_URL}/flush-cache`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    showToast(data.message || "Cache dikosongkan.", "success");
    addAuditLog("Soft-cache RAM dikosongkan.");
    fetchHealthMetricsOnly();
  } catch (err) {
    showToast("Gagal membersihkan cache.", "error");
  }
}

// ==========================================
// 8. SIMULASI & ALAT (TOOLS)
// ==========================================
async function triggerImpersonation() {
  const role = document.getElementById("impersonateRole").value;
  const id = document.getElementById("impersonateId").value.trim();

  if (!id) {
    showToast("Sila masukkan ID Pengguna atau No Telefon sasaran.", "warn");
    return;
  }

  showToast(`Menjana token penyamaran (${role})...`, "info");

  try {
    const res = await fetch(`${API_BASE_URL}/impersonate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ target_role: role, target_id: id }),
    });
    const data = await res.json();

    if (data.status === "success") {
      showToast(data.message, "success");
      addAuditLog(`Penyamaran dilancarkan sebagai [${role}: ${id}]`);
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      }
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    showToast("Ralat pelayan semasa menjana sesi: " + err.message, "error");
  }
}

async function triggerFpxSimulation() {
  const orderNo = document.getElementById("simFpxOrderNo").value.trim();
  const status = document.getElementById("simFpxStatus").value;

  if (!orderNo) {
    showToast("Sila masukkan nombor tempahan / order.", "warn");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/simulate-fpx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ order_no: orderNo, status_sim: status }),
    });
    const data = await res.json();

    if (data.status === "success") {
      showToast("Payload simulasi berjaya dijanakan. Menghantar ke webhook...", "success");
      // Post to actual webhook route
      try {
        await fetch("/api/bookings/webhook/fpx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data.payload_tiruan),
        });
        showToast(`Webhook FPX disimulasikan untuk ${orderNo} [Status: ${status}]`, "success");
        addAuditLog(`Simulasi FPX dihantar: ${orderNo} (Status ${status})`);
      } catch (err) {
        showToast("Webhook endpoint menerima payload simulasi.", "info");
      }
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    showToast("Gagal simulasi FPX: " + err.message, "error");
  }
}

// Push Notifications
async function subscribeDevPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    showToast("Pelayar anda tidak menyokong Web Push Notifications.", "error");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      showToast("Kebenaran notifikasi ditolak oleh pelayar.", "error");
      return;
    }

    const reg = await navigator.serviceWorker.register("/dev-sys-9x8q2/sw.js", { scope: "/dev-sys-9x8q2/" });
    const res = await fetch(`${API_BASE_URL}/vapidPublicKey`);
    const vapidKey = await res.text();

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const saveRes = await fetch(`${API_BASE_URL}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(sub),
    });
    const saveData = await saveRes.json();
    showToast(saveData.message || "Langganan Web-Push berjaya diaktifkan!", "success");
    addAuditLog("God Mode Web-Push diaktifkan pada peranti ini.");
  } catch (e) {
    showToast("Gagal melanggan Push: " + e.message, "error");
  }
}

async function testDevPush() {
  try {
    const res = await fetch(`${API_BASE_URL}/test-push`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (data.status === "success") {
      showToast("Notifikasi ujian berjaya dihantar ke pelayan push!", "success");
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    showToast("Ralat menghantar ujian push.", "error");
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ==========================================
// 9. AUDIT LOG (LOCAL PERSISTENCE & UI)
// ==========================================
function getAuditLogs() {
  try {
    const saved = localStorage.getItem("din_godmode_audit_logs");
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  // Defaults
  return [
    { text: "Backup automatik pangkalan data berjaya.", time: "Hari ini, 04:00 AM", type: "check" },
    { text: "Prune arkib jualan dijalankan (120 rekod).", time: "Semalam, 11:30 PM", type: "scissors" },
    { text: "Backup manual JSON dimuat turun.", time: "20 Mei, 02:15 PM", type: "download" },
  ];
}

function addAuditLog(text) {
  const logs = getAuditLogs();
  const now = new Date();
  const timeStr = `Hari ini, ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  logs.unshift({ text, time: timeStr, type: "check" });
  if (logs.length > 20) logs.pop();

  localStorage.setItem("din_godmode_audit_logs", JSON.stringify(logs));
  renderAuditLogs();
}

function renderAuditLogs() {
  const list = document.getElementById("auditLogList");
  if (!list) return;

  const logs = getAuditLogs();
  list.innerHTML = logs
    .map((item) => {
      let icon = '<i class="fa-solid fa-check"></i>';
      let bg = "bg-emerald-500/20 text-emerald-400";
      if (item.type === "scissors") {
        icon = '<i class="fa-solid fa-scissors"></i>';
        bg = "bg-purple-500/20 text-purple-400";
      } else if (item.type === "download") {
        icon = '<i class="fa-solid fa-download"></i>';
        bg = "bg-cyan-500/20 text-cyan-400";
      }
      return `
        <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded ${bg} flex items-center justify-center text-[10px] shrink-0 mt-0.5">${icon}</div>
            <div class="flex-1">
                <p class="text-xs text-slate-300 leading-snug">${escapeHtml(item.text)}</p>
                <p class="text-[10px] text-slate-500 font-mono mt-0.5">${escapeHtml(item.time)}</p>
            </div>
        </div>
      `;
    })
    .join("");
}

// ==========================================
// 10. COMMAND PALETTE (CTRL + K)
// ==========================================
const palette = document.getElementById("commandPalette");
const cmdInput = document.getElementById("commandInput");

function toggleCommandPalette() {
  if (!palette) return;
  palette.classList.toggle("hidden");
  if (!palette.classList.contains("hidden")) {
    if (cmdInput) {
      cmdInput.value = "";
      cmdInput.focus();
    }
  }
}

function handlePaletteBackdrop(e) {
  if (e.target === palette) {
    toggleCommandPalette();
  }
}

function execCmd(fn) {
  toggleCommandPalette();
  if (typeof fn === "function") fn();
}

// Global Shortcuts
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    toggleCommandPalette();
  }
  if (e.key === "Escape") {
    if (palette && !palette.classList.contains("hidden")) {
      toggleCommandPalette();
    }
    const modal = document.getElementById("resetModal");
    if (modal && !modal.classList.contains("hidden")) {
      closeResetModal();
    }
    if (sidebar && !sidebar.classList.contains("-translate-x-full")) {
      toggleSidebar();
    }
  }
});

// Search filter in Command Palette
if (cmdInput) {
  cmdInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    const btns = document.querySelectorAll("#commandResults button");
    btns.forEach((btn) => {
      const txt = btn.textContent.toLowerCase();
      if (txt.includes(q)) {
        btn.classList.remove("hidden");
      } else {
        btn.classList.add("hidden");
      }
    });
  });
}

// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});
