const API_BASE_URL = "/api/dev-sys-9x8q2";

// --- UI / Navigation ---
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(el => {
    el.classList.remove('bg-gray-800', 'text-white');
    el.classList.add('text-gray-400');
  });
  
  document.getElementById(tabId).classList.remove('hidden');
  document.getElementById(tabId).classList.add('block');
  
  const activeBtn = document.querySelector(`[data-target="${tabId}"]`);
  if (activeBtn) {
    activeBtn.classList.remove('text-gray-400');
    activeBtn.classList.add('bg-gray-800', 'text-white');
  }

  // Auto-refresh logic for specific tabs
  if (tabId === 'tab-health') fetchHealth();
  if (tabId === 'tab-switchboard') loadFlags();
}

// Mobile menu
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('hidden');
  navLinks.classList.toggle('flex');
});

// --- Auth ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = document.getElementById('devPassword').value;
  const errDiv = document.getElementById('loginError');
  errDiv.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    
    if (data.status === "success") {
      document.getElementById('loginView').classList.add('hidden');
      document.getElementById('dashboardView').classList.remove('hidden');
      document.getElementById('dashboardView').classList.add('flex');
      loadFlags();
    } else {
      errDiv.textContent = data.message;
      errDiv.classList.remove('hidden');
    }
  } catch (err) {
    errDiv.textContent = "Gagal menyambung ke pelayan.";
    errDiv.classList.remove('hidden');
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch(`${API_BASE_URL}/logout`, { method: "POST" });
  location.reload();
});

// Check auth on load
async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE_URL}/status`);
    const data = await res.json();
    if (data.status === "success") {
      document.getElementById('loginView').classList.add('hidden');
      document.getElementById('dashboardView').classList.remove('hidden');
      document.getElementById('dashboardView').classList.add('flex');
      loadFlags();
    }
  } catch (err) {}
}
window.addEventListener('load', checkAuth);


// --- Switchboard (Feature Flags) ---
async function loadFlags() {
  try {
    const res = await fetch(`${API_BASE_URL}/flags`);
    const data = await res.json();
    if (data.status === "success" && data.flags) {
      document.getElementById('flag-maintenance').checked = data.flags.maintenance_mode || false;
      document.getElementById('flag-customer').checked = data.flags.customer_portal !== false;
      document.getElementById('flag-staff').checked = data.flags.staff_portal !== false;
      document.getElementById('flag-booking').checked = data.flags.booking !== false;
      document.getElementById('flag-ecommerce').checked = data.flags.ecommerce !== false;
      
      // Sandbox & OTP bypass
      const sandboxEl = document.getElementById('flag-sandbox');
      if(sandboxEl) sandboxEl.checked = data.flags.sandbox_payment || false;
      
      const otpEl = document.getElementById('flag-otp');
      if(otpEl) otpEl.checked = data.flags.otp_bypass || false;
    }
  } catch(e) {}
}

async function updateFlag(key, value) {
  try {
    const payload = {};
    payload[key] = value;
    const res = await fetch(`${API_BASE_URL}/flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flags: payload })
    });
    const data = await res.json();
    if (data.status !== "success") {
      alert("Gagal update flag: " + data.message);
      loadFlags(); // revert UI
    }
  } catch(e) { alert("Ralat rangkaian"); loadFlags(); }
}


// --- Data & Backup ---
function downloadBackup() {
  window.open(`${API_BASE_URL}/backup`, "_blank");
}

document.getElementById('restoreFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      const json = JSON.parse(event.target.result);
      if(!confirm("Anda pasti mahu memulihkan (Restore) pangkalan data ini? Ia akan menggantikan data sedia ada.")) return;
      
      const res = await fetch(`${API_BASE_URL}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json)
      });
      const data = await res.json();
      alert(data.message);
    } catch(err) {
      alert("Fail JSON tidak sah atau ralat: " + err.message);
    }
    e.target.value = ""; // reset
  };
  reader.readAsText(file);
});

async function triggerPrune() {
  if(!confirm("Jalankan pemotongan arkib tahunan (Prune) sekarang?")) return;
  const res = await fetch(`${API_BASE_URL}/prune`, { method: "POST" });
  const data = await res.json();
  alert(data.message);
}

function openResetModal() { document.getElementById('resetModal').classList.remove('hidden'); }
function closeResetModal() { 
  document.getElementById('resetModal').classList.add('hidden'); 
  document.getElementById('resetPhrase').value = "";
  document.getElementById('resetOTP').value = "";
}
async function executeFactoryReset() {
  const phrase = document.getElementById('resetPhrase').value;
  const otp = document.getElementById('resetOTP').value;
  
  if (phrase !== "DELETE-ALL-DINSPIRE-DATA") { alert("Teks pengesahan salah."); return; }
  
  const res = await fetch(`${API_BASE_URL}/factory-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmation_text: phrase, otp: otp })
  });
  const data = await res.json();
  alert(data.message);
  closeResetModal();
}


// --- Server Health ---
async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    const data = await res.json();
    if(data.status === "success") {
      document.getElementById('metric-db').textContent = data.metrics.database_latency_ms + " ms";
      document.getElementById('metric-ram').textContent = data.metrics.memory_usage_mb + " MB";
      document.getElementById('metric-status').textContent = data.metrics.database_status;
      document.getElementById('metric-sms').textContent = data.metrics.sms_gateway;
    }
    
    // Fetch logs
    const resLogs = await fetch(`${API_BASE_URL}/logs`);
    const dataLogs = await resLogs.json();
    if(dataLogs.status === "success") {
      if(dataLogs.file) document.getElementById('logFileName').textContent = dataLogs.file;
      document.getElementById('terminal-logs').textContent = dataLogs.logs || "Tiada ralat.";
    }
  } catch(e) {}
}

async function flushCache() {
  const res = await fetch(`${API_BASE_URL}/flush-cache`, { method: "POST" });
  const data = await res.json();
  alert(data.message);
}


// --- Simulasi & Alat ---
async function triggerImpersonation() {
  const role = document.getElementById('impersonateRole').value;
  const id = document.getElementById('impersonateId').value;
  
  if(!id) return alert("Sila masukkan ID Pengguna");
  
  const res = await fetch(`${API_BASE_URL}/impersonate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_role: role, target_id: id })
  });
  const data = await res.json();
  if (data.status === "success") {
    alert(data.message);
    window.open(data.redirectUrl, "_blank");
  } else {
    alert(data.message);
  }
}

// Push Notification Logic
async function subscribeDevPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert("Pelayar anda tidak menyokong Push Notifications.");
    return;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return alert("Kebenaran notifikasi ditolak.");
    
    const reg = await navigator.serviceWorker.register('/dev-sys-9x8q2/sw.js', { scope: '/dev-sys-9x8q2/' });
    const res = await fetch(`${API_BASE_URL}/vapidPublicKey`);
    const vapidKey = await res.text();
    
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    });
    
    const saveRes = await fetch(`${API_BASE_URL}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub)
    });
    const saveData = await saveRes.json();
    alert(saveData.message);
  } catch (e) {
    console.error(e);
    alert("Gagal melanggan: " + e.message);
  }
}

async function testDevPush() {
  const res = await fetch(`${API_BASE_URL}/test-push`, { method: "POST" });
  const data = await res.json();
  if(data.status !== "success") alert(data.message);
}
