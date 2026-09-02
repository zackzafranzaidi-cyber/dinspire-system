const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST
  ? "http://localhost:3000/api"
  : "https://api.dinspirebarbershop.com/api";



let loggedInStaff = null;
let shopSettings = { walkin: [] };
let staffData = { bookings: [], reviews: [], commissionPercent: 50 };

// ==========================================
// PENGURUSAN DATA LUAR TALIAN (OFFLINE SYNC)
// ==========================================
const OfflineSyncManager = {
  queue: JSON.parse(localStorage.getItem("din_offline_queue") || "[]"),
  
  saveToQueue(url, method, payload, successMessage) {
    this.queue.push({ url, method, payload, successMessage, timestamp: Date.now() });
    localStorage.setItem("din_offline_queue", JSON.stringify(this.queue));
  },
  
  async sync() {
    if (!navigator.onLine || this.queue.length === 0) return;
    
    showToast("Menyelaraskan data offline (Syncing)...");
    let newQueue = [];
    
    for (let item of this.queue) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(item.payload),
        });
        const data = await res.json();
        if (data.status === "success") {
           console.log("Synced:", item.successMessage);
        } else {
           console.error("Failed to sync:", data.message);
        }
      } catch (err) {
        newQueue.push(item);
      }
    }
    
    this.queue = newQueue;
    localStorage.setItem("din_offline_queue", JSON.stringify(this.queue));
    
    if (this.queue.length === 0) {
       showToast("Semua data offline berjaya dihantar!");
       if (typeof loadDashboardData === "function") loadDashboardData();
    }
  }
};

window.addEventListener('online', () => OfflineSyncManager.sync());

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

window.addEventListener("DOMContentLoaded", () => {
  let savedUser = localStorage.getItem("din_staff_info") || sessionStorage.getItem("din_staff_info");
  if (savedUser) {
    loggedInStaff = JSON.parse(savedUser);
    fetchServicesForWalkin();
    showDashboard();
    if (typeof subscribeToPush === 'function') subscribeToPush();
  }
  initStaffEventListeners();
  loadBranchOptions();
});

function initStaffEventListeners() {
  document
    .getElementById("login-btn")
    ?.addEventListener("click", loginStaffSystem);
  document.getElementById("btn-logout")?.addEventListener("click", logoutStaff);
  document
    .getElementById("wi-service")
    ?.addEventListener("change", autoFillPrice);
  document
    .getElementById("wi-payment")
    ?.addEventListener("change", toggleReceiptUpload);
  document
    .getElementById("btn-submit-walkin")
    ?.addEventListener("click", submitWalkIn);
  document
    .getElementById("btn-punch-in")
    ?.addEventListener("click", () => submitPunch("CLOCK IN"));
  document
    .getElementById("btn-punch-out")
    ?.addEventListener("click", () => submitPunch("CLOCK OUT"));

  // [DIBAIKI] Event Listeners untuk UI Kata Laluan
  document.getElementById("link-forgot-password")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("forgot-password-screen").style.display = "flex";
  });
  document.getElementById("link-back-login")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("forgot-password-screen").style.display = "none";
    document.getElementById("login-screen").style.display = "flex";
  });
  document.getElementById("btn-submit-cp")?.addEventListener("click", submitChangePassword);
  document.getElementById("btn-submit-fp")?.addEventListener("click", submitForgotPassword);

  const tabs = ["dashboard", "walkin", "booking", "history", "profile"];
  tabs.forEach((tab) => {
    document.getElementById(`nav-${tab}`)?.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(tab);
      if (tab === "dashboard" || tab === "booking" || tab === "history")
        loadDashboardData();
    });
  });

  document.getElementById("btn-save-leave")?.addEventListener("click", submitLeaves);
  document.getElementById("btn-save-emergency-leave")?.addEventListener("click", submitEmergencyLeaves);
}

async function loginStaffSystem() {
  const username = document.getElementById("sys-username").value.trim();
  const password = document.getElementById("sys-password").value.trim();
  const remember = document.getElementById("login-remember").checked;
  const btn = document.getElementById("login-btn");

  if (!username || !password) {
    alert("Sila isi nama pengguna dan kata laluan.");
    return;
  }
  btn.innerText = "Mengesahkan...";

  try {
    const res = await fetch(`${API_BASE_URL}/auth/system-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password, allowed_roles: ["staff"], remember }),
    });
    const data = await res.json();

    if (data.status === "success") {
      if (remember) {
        localStorage.setItem("din_staff_info", JSON.stringify(data.user));
      } else {
        sessionStorage.setItem("din_staff_info", JSON.stringify(data.user));
      }
      loggedInStaff = data.user;
      showToast(`Selamat bertugas!`);
      fetchServicesForWalkin();
      showDashboard();
    } else if (data.status === "REQUIRE_PASSWORD_CHANGE") {
      window.tempChangePasswordToken = data.temp_token;
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("change-password-screen").style.display = "flex";
      showToast(data.message);
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Gagal menyambung ke pelayan.");
  } finally {
    btn.innerText = "Log Masuk";
  }
}

// [DIBAIKI] Fungsi Penukaran Kata Laluan Wajib
async function submitChangePassword() {
  const newPassword = document.getElementById("cp-new-password").value;
  const btn = document.getElementById("btn-submit-cp");

  if (!newPassword || newPassword.length < 6) {
    alert("Kata laluan mestilah sekurang-kurangnya 6 aksara.");
    return;
  }
  btn.innerText = "Mengemas kini...";

  try {
    const res = await fetch(`${API_BASE_URL}/auth/staff/change-password`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${window.tempChangePasswordToken}`
      },
      body: JSON.stringify({ new_password: newPassword }),
    });
    const data = await res.json();
    if (data.status === "success") {
      alert("Kata laluan berjaya ditukar! Sila log masuk semula dengan kata laluan baharu.");
      window.tempChangePasswordToken = null;
      document.getElementById("change-password-screen").style.display = "none";
      document.getElementById("login-screen").style.display = "flex";
      document.getElementById("sys-password").value = "";
      document.getElementById("cp-new-password").value = "";
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Sesi anda telah tamat. Sila log masuk semula.");
  }
  btn.innerText = "Kemaskini Kata Laluan";
}

// [DIBAIKI] Fungsi Mohon Reset Kata Laluan
async function submitForgotPassword() {
  const username = document.getElementById("fp-username").value.trim();
  const btn = document.getElementById("btn-submit-fp");

  if (!username) {
    alert("Sila masukkan Username / ID Staf.");
    return;
  }
  btn.innerText = "Menghantar...";

  try {
    const res = await fetch(`${API_BASE_URL}/auth/staff/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (data.status === "success") {
      alert(data.message);
      document.getElementById("forgot-password-screen").style.display = "none";
      document.getElementById("login-screen").style.display = "flex";
      document.getElementById("fp-username").value = "";
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Gagal menyambung ke pelayan.");
  }
  btn.innerText = "Mohon Reset (Hantar Kepada Admin)";
}

async function cancelLeave(leaveId) {
  if (!confirm("Adakah anda pasti mahu membatalkan cuti ini?")) return;
  
  try {
    const res = await fetch(`${API_BASE_URL}/staff/leaves/` + leaveId, {
      method: "DELETE",
      credentials: "include"
    });
    const data = await res.json();
    if (data.status === "success") {
      alert("Cuti berjaya dibatalkan.");
      initLeaveSystem(); // Refresh table
    } else {
      alert("Ralat: " + data.message);
    }
  } catch (err) {
    console.error("Gagal batal cuti", err);
    alert("Ralat rangkaian. Sila cuba lagi.");
  }
}

function logoutStaff() {
  if (confirm("Pasti mahu log keluar dari sistem?")) {
    fetch(`${API_BASE_URL}/auth/logout-sys`, {
      method: "POST",
      credentials: "include",
    })
      .catch((e) => console.error(e))
      .finally(() => {
        localStorage.removeItem("din_staff_info");
        sessionStorage.removeItem("din_staff_info");
        loggedInStaff = null;
        location.reload();
      });
  }
}

function showDashboard() {
  if (typeof requestNotifPermission === 'function') requestNotifPermission();
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("main-header").style.display = "flex";
  document.getElementById("main-content").style.display = "block";
  document.getElementById("bottom-nav").style.display = "flex";

  let nameInitial = loggedInStaff.username.charAt(0).toUpperCase();
  document.getElementById("head-avatar").innerText = nameInitial;
  document.getElementById("prof-avatar").innerText = nameInitial;
  document.getElementById("head-greeting").innerText =
    `Hai, ${loggedInStaff.username}`;
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  document.getElementById("head-date").innerText =
    new Date().toLocaleDateString("ms-MY", options);
  document.getElementById("prof-name").innerText = loggedInStaff.username;
  document.getElementById("prof-branch").innerText = `Cawangan: Tidak Tetap`;
  loadDashboardData();
  
  // Initialize leave system whenever dashboard is shown
  initLeaveSystem();
}

let globalLoaderStartTime = Date.now();

function showGlobalLoader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
      globalLoaderStartTime = Date.now();
      preloader.style.visibility = 'visible';
      preloader.style.opacity = '1';
  }
}

function hideGlobalLoader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => {
          preloader.style.visibility = 'hidden';
      }, 300);
  }
}

let hasRequestedNotif = false;
function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'denied') {
      if (!hasRequestedNotif) {
          alert('Sila benarkan notifikasi dalam tetapan peranti anda untuk menerima makluman cuti/tugasan.');
          hasRequestedNotif = true;
      }
      return;
  }
  if (!hasRequestedNotif && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
          if (permission === 'granted' && typeof subscribeToPush === 'function') {
              subscribeToPush();
          }
      });
      hasRequestedNotif = true;
  } else if (!hasRequestedNotif && Notification.permission === 'granted' && typeof subscribeToPush === 'function') {
      subscribeToPush();
      hasRequestedNotif = true;
  }
}

function switchView(id) {
  if (typeof requestNotifPermission === 'function') requestNotifPermission();
  showGlobalLoader();
  setTimeout(hideGlobalLoader, 300); // Quick transition for normal tabs

  document
    .querySelectorAll(".view-section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("view-" + id).classList.add("active");
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("nav-" + id).classList.add("active");
  window.scrollTo(0, 0);
}

async function fetchServicesForWalkin() {
  try {
    const res = await fetch(`${API_BASE_URL}/shop-data`);
    const data = await res.json();
    let allServices = [];
    if (data.WalkInServices) allServices = allServices.concat(data.WalkInServices);
    shopSettings.walkin = allServices;

    const wiSel = document.getElementById("wi-service");
    wiSel.innerHTML =
      `<option value="" disabled selected>Pilih Jenis Potongan / Servis</option>` +
      shopSettings.walkin
        .map((s) => {
          const p = (s.price == 0) ? "" : s.price;
          return `<option value="${s.id}" data-price="${p}">${escapeHTML(s.name)}</option>`;
        })
        .join("");
  } catch (err) {}
}

async function loadBranchOptions() {
  try {
    const res = await fetch(`${API_BASE_URL}/shop-data`);
    const data = await res.json();
    const select = document.getElementById("punch-branch");
    if (!select) return; // Fix for page without punch-branch dropdown
    if (data.Branches) {
      select.innerHTML =
        '<option value="" disabled selected>Pilih Cawangan</option>' +
        data.Branches.map(
          (b) => `<option value="${b.id}">${escapeHTML(b.name)}</option>`,
        ).join("");
    }
  } catch (e) {
    console.error("Failed to load branches", e);
  } finally {
    hideGlobalLoader();
  }
}

function autoFillPrice() {
  const sel = document.getElementById("wi-service");
  const opt = sel.options[sel.selectedIndex];
  const priceInput = document.getElementById("wi-price");
  if (opt && opt.dataset.price) {
    priceInput.value = opt.dataset.price;
    priceInput.readOnly = true;
    priceInput.style.backgroundColor = "#f3f4f6";
    priceInput.style.color = "var(--text-muted)";
  } else {
    priceInput.value = "";
    priceInput.readOnly = false;
    priceInput.style.backgroundColor = "#ffffff";
    priceInput.style.color = "#111827";
  }
}
function toggleReceiptUpload() {
  const method = document.getElementById("wi-payment").value;
  document.getElementById("wi-receipt-group").style.display =
    method === "QR" ? "block" : "none";
}

async function loadDashboardData() {
  showGlobalLoader();
  if (!loggedInStaff) {
    hideGlobalLoader();
    return;
  }
  
  // [DIBAIKI] Caching Tempatan (Optimistic Load)
  const cachedData = localStorage.getItem("din_staff_dashboard");
  if (cachedData) {
      try {
         const data = JSON.parse(cachedData);
         staffData.bookings = Array.isArray(data) ? data : data.bookings || [];
         staffData.reviews = data.reviews || [];
         staffData.commissionPercent = data.commissionPercent || 50;
         staffData.monthlyCashOnHand = data.monthlyCashOnHand || 0;
         staffData.monthlySales = data.monthlySales || 0;
         staffData.monthlyCustomers = data.monthlyCustomers || 0;
         calculateDashboardStats();
         renderBookingList();
         renderHistoryList();
      } catch (e) {}
  }

  try {
    const res = await fetch(`${API_BASE_URL}/staff/dashboard`, {
      credentials: "include",
    });

    if (res.status === 401 || res.status === 403) {
      alert("Sesi log masuk telah tamat. Sila log masuk semula.");
      logoutStaff();
      return;
    }

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("din_staff_dashboard", JSON.stringify(data)); // Simpan data terkini ke dalam cache
      staffData.bookings = Array.isArray(data) ? data : data.bookings || [];
      staffData.reviews = data.reviews || [];
      staffData.commissionPercent = data.commissionPercent || 50;
      staffData.monthlyCashOnHand = data.monthlyCashOnHand || 0;
      staffData.monthlySales = data.monthlySales || 0;
      staffData.monthlyCustomers = data.monthlyCustomers || 0;
      
      if (loggedInStaff.is_general) {
         document.getElementById("general-staff-branch-container").style.display = "block";
         const select = document.getElementById("general-branch-select");
         if (data.branches && data.branches.length > 0) {
            select.innerHTML = '<option value="" disabled selected>-- Pilih Cawangan Bertugas --</option>' +
               data.branches.map(b => `<option value="${b.id}">${b.nama_cawangan.replace(/[&<>'"]/g, '')}</option>`).join("");
         }
      }
      
      calculateDashboardStats();
      renderBookingList();
      renderHistoryList();
    }
  } catch (err) {} finally {
    hideGlobalLoader();
  }
}

function calculateDashboardStats() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let monthlyCustomers = staffData.monthlyCustomers || 0;
  let monthlySales = staffData.monthlySales || 0;
  let cashOnHand = staffData.monthlyCashOnHand || 0;

  let commission = monthlySales * (staffData.commissionPercent / 100);
  let ratingPct = 100;
  if (staffData.reviews && staffData.reviews.length > 0) {
    let totalStars = staffData.reviews.reduce(
      (sum, r) => sum + (parseInt(r.stars) || 0),
      0,
    );
    ratingPct = Math.round((totalStars / staffData.reviews.length / 5) * 100);
  }

  document.getElementById("dash-rating").innerText = `${ratingPct}%`;
  document.getElementById("dash-customers").innerText = monthlyCustomers;
  document.getElementById("dash-commission").innerText =
    `RM ${commission.toFixed(0)}`;
    
  const basicSalary = staffData.basicSalary || 1800;
  let bones = commission > basicSalary ? commission - basicSalary : 0;
  const bonesElement = document.getElementById("dash-bones");
  if (bonesElement) {
    bonesElement.innerText = `RM ${bones.toFixed(0)}`;
  }
  
  const bonesSubtitleElement = document.getElementById("dash-bones-subtitle");
  if (bonesSubtitleElement) {
    bonesSubtitleElement.innerText = `Komisen melebihi RM ${basicSalary.toLocaleString()}`;
  }

  document.getElementById("dash-cash").innerText =
    `RM ${cashOnHand.toFixed(0)}`;
}

function renderBookingList() {
  const container = document.getElementById("booking-container");
  const activeBookings = staffData.bookings.filter((b) => b.status === "Aktif" || b.status === "Pending Verification");

  if (activeBookings.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 13px;">Tiada tempahan aktif atau menunggu pengesahan buat masa ini.</div>`;
    return;
  }

  const now = new Date();
  container.innerHTML = activeBookings
    .map((b) => {
      let isEarly = false;
      let bookingDate = new Date(b.booking_date);
      if (!isNaN(bookingDate.getTime()) && b.booking_time) {
        let parts = b.booking_time.split(":");
        if (parts.length >= 2)
          bookingDate.setHours(parseInt(parts[0]), parseInt(parts[1]), 0);
        if (now < bookingDate) isEarly = true;
      }

      let customerName = escapeHTML(
        b.customer
          ? b.customer.name
          : b.customers
            ? b.customers.name
            : "Pelanggan",
      );
      let serviceName = escapeHTML(
        b.service ? b.service.name : b.services ? b.services.name : "Servis",
      );
      
      let badgeHtml = b.status === "Pending Verification" 
        ? `<span class="badge" style="background:#fff3cd; color:#856404;">Pending Verification</span>`
        : `<span class="badge badge-pending">Booking Aktif</span>`;
        
      let btnAction = "";
      let resitBtn = "";
      
      if (b.status === "Pending Verification") {
        if (b.resit) {
            resitBtn = `<button class="btn btn-outline" style="width:100%; margin-top:10px;" onclick="window.open('${b.resit}', '_blank')"><i class="fas fa-file-invoice mr-2"></i> Lihat Resit</button>`;
        }
        btnAction = `<button class="btn btn-primary" onclick="verifyPayment('${escapeHTML(b.order_no)}', 'approve')"><i class="fas fa-check mr-2"></i> Approve</button>
                     <button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="verifyPayment('${escapeHTML(b.order_no)}', 'reject')"><i class="fas fa-times mr-2"></i> Reject</button>`;
      } else {
        btnAction = isEarly
          ? `<button class="btn btn-disabled" onclick="showToast('Selesai dikunci.')"><i class="fas fa-lock mr-2"></i> Belum Tiba Waktu</button>`
          : `<button class="btn btn-primary" onclick="processBookingSelesai('${escapeHTML(b.order_no)}', ${b.price})"><i class="fas fa-check-circle mr-2"></i> Selesai</button>`;
        btnAction += `<button class="btn btn-outline" style="width:30%; color:var(--danger);" onclick="cancelBooking('${escapeHTML(b.order_no)}')">Batal</button>`;
      }

      let phone = b.customer && b.customer.phone ? String(b.customer.phone).trim() : (b.customers && b.customers.phone ? String(b.customers.phone).trim() : "");
      let callLink = "";
      let waLink = "";
      if (phone && phone !== "Tiada" && phone !== "null") {
        if (!phone.startsWith("60") && phone.startsWith("0")) phone = "60" + phone.substring(1);
        let staffName = loggedInStaff ? (loggedInStaff.nama_penuh || loggedInStaff.username) : "Staf";
        let bDate = new Date(b.booking_date).toLocaleDateString("ms-MY");
        let msg = encodeURIComponent(`Hi ${customerName}, saya ${staffName} dari Dinspire Barbershop. adakah tuan pemilik booking ini:\nno booking: ${escapeHTML(b.order_no)}\nservis: ${serviceName}\ntarikh: ${bDate}\nmasa: ${b.booking_time}\nSila reply *YA* sekiranya benar dan *TIDAK* sekiranya tidak benar.`);
        callLink = `<button class="btn btn-outline" style="flex:1; margin-right:5px; font-size:12px; padding:8px; border-color:var(--primary-blue); color:var(--primary-blue);" onclick="window.location.href='tel:+${phone}'"><i class="fas fa-phone mr-1"></i> Call</button>`;
        waLink = `<button class="btn btn-outline" style="flex:1; margin-left:5px; font-size:12px; padding:8px; border-color:#25D366; color:#25D366;" onclick="window.open('https://wa.me/${phone}?text=${msg}', '_blank')"><i class="fab fa-whatsapp mr-1"></i> WhatsApp</button>`;
      }
      let contactBtns = callLink || waLink ? `<div style="display:flex; margin-bottom:12px; margin-top:5px;">${callLink}${waLink}</div>` : "";

      return `<div class="list-card"><div class="list-header"><span class="cust-name">${customerName}</span>${badgeHtml}</div><div class="list-detail"><strong>Servis:</strong> ${serviceName} <br><strong>Tarikh:</strong> ${new Date(b.booking_date).toLocaleDateString("ms-MY")} <strong>Masa:</strong> ${b.booking_time} <br><strong>No. Order:</strong> <span style="font-family:monospace; color:var(--primary);">${escapeHTML(b.order_no)}</span>${resitBtn}</div>${contactBtns}<div class="btn-action-group">${btnAction}</div></div>`;
    })
    .join("");
}

function renderHistoryList() {
  const container = document.getElementById("history-container");
  const historyData = staffData.bookings
    .filter((b) => b.status === "Selesai" || b.status === "Batal" || b.status === "Rejected")
    .sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));

  if (historyData.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 13px;">Belum ada sejarah transaksi.</div>`;
    return;
  }

  container.innerHTML = historyData
    .map((b) => {
      let customerName = escapeHTML(
        b.customer
          ? b.customer.name
          : b.customers
            ? b.customers.name
            : "Pelanggan Walk-In",
      );
      let serviceName = escapeHTML(
        b.service ? b.service.name : b.services ? b.services.name : "Servis",
      );
      let badgeClass =
        b.status === "Batal" || b.status === "Rejected"
          ? "badge-pending"
          : b.payment_method === "QR"
            ? "badge-qr"
            : "badge-cash";
      let method = b.status === "Batal" ? "Dibatalkan" : b.status === "Rejected" ? "Rejected" : b.payment_method;
      
      let editBtn = "";
      if (b.status === "Rejected") {
          editBtn = `<button class="btn btn-primary" style="margin-top:10px; width:100%; font-size:12px;" onclick="verifyPayment('${escapeHTML(b.order_no)}', 'approve')"><i class="fas fa-edit mr-2"></i> Undo Reject</button>`;
      }
      
      let phone = b.customer && b.customer.phone ? String(b.customer.phone).trim() : (b.customers && b.customers.phone ? String(b.customers.phone).trim() : "");
      let callLink = "";
      let waLink = "";
      if (phone && phone !== "Tiada" && phone !== "null") {
        if (!phone.startsWith("60") && phone.startsWith("0")) phone = "60" + phone.substring(1);
        let staffName = loggedInStaff ? (loggedInStaff.nama_penuh || loggedInStaff.username) : "Staf";
        let bDate = new Date(b.booking_date).toLocaleDateString("ms-MY");
        let msg = encodeURIComponent(`Hi ${customerName}, saya ${staffName} dari Dinspire Barbershop. adakah tuan pemilik booking ini:\nno booking: ${escapeHTML(b.order_no)}\nservis: ${serviceName}\ntarikh: ${bDate}\nmasa: ${b.booking_time || "Tiada"}\nSila reply *YA* sekiranya benar dan *TIDAK* sekiranya tidak benar.`);
        callLink = `<button class="btn btn-outline" style="flex:1; margin-right:5px; font-size:12px; padding:8px; border-color:var(--primary-blue); color:var(--primary-blue);" onclick="window.location.href='tel:+${phone}'"><i class="fas fa-phone mr-1"></i> Call</button>`;
        waLink = `<button class="btn btn-outline" style="flex:1; margin-left:5px; font-size:12px; padding:8px; border-color:#25D366; color:#25D366;" onclick="window.open('https://wa.me/${phone}?text=${msg}', '_blank')"><i class="fab fa-whatsapp mr-1"></i> WhatsApp</button>`;
      }
      let contactBtns = callLink || waLink ? `<div style="display:flex; margin-top:10px;">${callLink}${waLink}</div>` : "";

      return `<div class="list-card" style="opacity: 0.85;"><div class="list-header"><span class="cust-name">${customerName}</span><span class="badge ${badgeClass}">${method}</span></div><div class="list-detail"><strong>Servis:</strong> ${serviceName} <br><strong>Tarikh Selesai:</strong> ${new Date(b.booking_date).toLocaleDateString("ms-MY")} <br><strong>Kutipan:</strong> RM ${b.final_price || b.price}${editBtn}</div>${contactBtns}</div>`;
    })
    .join("");
}

// ==========================================
// [BAHARU] VERIFY PAYMENT
// ==========================================
async function verifyPayment(orderNo, action) {
  if (action === 'reject') {
    if (!confirm("Pasti mahu menolak resit bayaran ini? Pelanggan akan diminta hubungi pihak kedai.")) return;
  } else {
    if (!confirm("Sahkan resit dan luluskan tempahan ini?")) return;
  }

  showToast("Memproses pengesahan...");
  
  try {
    const res = await fetch(`${API_BASE_URL}/staff/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ order_no: orderNo, action: action }),
    });

    const data = await res.json();
    if (data.status === "success") {
      showToast(data.message || "Berjaya dikemaskini.");
      loadDashboardData();
    } else {
      showToast(data.message || "Gagal mengemaskini status.");
    }
  } catch (err) {
    showToast("Ralat pelayan memproses pengesahan.");
  }
}

// Fungsi UI Modal
window.toggleTrReceiptUpload = function() {
  const payment = document.getElementById("tr-payment").value;
  const receiptGroup = document.getElementById("tr-receipt-group");
  if (payment === "QR") {
    receiptGroup.style.display = "block";
  } else {
    receiptGroup.style.display = "none";
  }
};

window.closeTrModal = function() {
  document.getElementById("modal-selesai-rawatan").style.display = "none";
};

window.submitTrModal = function() {
  const orderNo = document.getElementById("tr-order-no").value;
  const price = document.getElementById("tr-price").value;
  const payment = document.getElementById("tr-payment").value;
  const fileInput = document.getElementById("tr-receipt").files[0];

  const finalPrice = parseFloat(price);
  if (isNaN(finalPrice) || finalPrice <= 0) {
    alert("Sila masukkan harga yang sah.");
    return;
  }
  if (payment === "QR" && !fileInput) {
    alert("Sila muat naik gambar resit transaksi DuitNow/QR sebelum tekan selesai!");
    return;
  }

  if (fileInput) {
    compressImage(fileInput, (base64Img) => {
      executeBookingSelesai(orderNo, finalPrice, payment, base64Img);
    });
  } else {
    executeBookingSelesai(orderNo, finalPrice, payment, "");
  }
};

async function executeBookingSelesai(orderNo, finalPrice, paymentMethod, receiptBase64) {
  closeTrModal();

  // [DIBAIKI] Optimistic UI: Kemaskini skrin serta-merta
  const bookingIndex = staffData.bookings.findIndex(b => (b.order_no || b.no_booking) === orderNo);
  let originalBooking = null;
  
  if (bookingIndex > -1) {
     originalBooking = {...staffData.bookings[bookingIndex]};
     staffData.bookings[bookingIndex].status = "Selesai";
     staffData.bookings[bookingIndex].final_price = finalPrice;
     
     calculateDashboardStats();
     renderBookingList();
     renderHistoryList();
     showToast("Memproses di latar belakang...");
  }

  fetch(`${API_BASE_URL}/bookings/order/${orderNo}/complete`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ final_price: finalPrice, jenis_bayaran: paymentMethod, receipt_url: receiptBase64 }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        showToast("Servis disahkan selesai.");
      } else {
        alert("Ralat: " + data.message);
        loadDashboardData();
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Ralat pelayan memproses tempahan.");
    });
}

async function processBookingSelesai(orderNo, price) {
  // Jika pelanggan menempah rawatan, tunjuk modal
  if (orderNo.startsWith("TR")) {
    document.getElementById("tr-order-no").value = orderNo;
    document.getElementById("tr-price").value = "";
    document.getElementById("tr-payment").value = "Cash";
    document.getElementById("tr-receipt").value = "";
    toggleTrReceiptUpload();
    document.getElementById("modal-selesai-rawatan").style.display = "flex";
    return;
  }

  // Jika Guntingan biasa
  if (confirm(`Sahkan pelanggan (${orderNo}) ini telah selesai?`)) {
    executeBookingSelesai(orderNo, price, "", ""); // Kosongkan paymentMethod supaya tidak overwrite FPX di backend
  }
}

function cancelBooking(orderNo) {
  if (confirm(`Pasti mahu BATALKAN tempahan ini?`)) {
    fetch(`${API_BASE_URL}/bookings/order/${orderNo}/cancel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          showToast("Tempahan berjaya dibatalkan.");
          loadDashboardData();
        } else alert("Ralat: " + data.message);
      })
      .catch((err) => alert("Ralat pelayan memproses pembatalan."));
  }
}

function submitWalkIn() {
  const form = document.getElementById("walkin-form");
  const phone = document.getElementById("wi-phone").value.trim();
  const serviceId = document.getElementById("wi-service").value;
  const paymentMethod = document.getElementById("wi-payment").value;
  const fileInput = document.getElementById("wi-receipt").files[0];

  if (!phone || !serviceId || !paymentMethod) {
    return alert("Sila lengkapkan semua maklumat Walk-In.");
  }
  if (!phone.startsWith("01") || phone.length < 10) {
    return alert("Sila masukkan no telefon sah (mula 01...).");
  }
  if (paymentMethod === "QR" && !fileInput) {
    return alert("Sila muat naik gambar resit transaksi DuitNow/QR sebelum tekan selesai!");
  }

  const priceInput = parseFloat(document.getElementById("wi-price").value);
  if (isNaN(priceInput) || priceInput < 1) {
    return alert("Sila masukkan harga yang sah (minimum RM1.00).");
  }

  showGlobalLoader();
  try {
    compressImage(fileInput, (base64) => {
      const now = new Date();
      const payload = {
        customer_name: document.getElementById("wi-name").value.trim(),
        no_phone: phone,
        service_id: serviceId,
        booking_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
        booking_time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        price: parseFloat(document.getElementById("wi-price").value),
        payment_method: paymentMethod,
        receipt_url: base64,
      };

      const handleSuccess = (msg) => {
        showToast(msg);
        document.getElementById("wi-name").value = "";
        document.getElementById("wi-phone").value = "";
        document.getElementById("wi-service").value = "";
        document.getElementById("wi-price").value = "";
        document.getElementById("wi-receipt").value = "";
        document.getElementById("wi-receipt-group").style.display = "none";
        document.getElementById("wi-payment").value = "Cash";
        switchView("dashboard");
        if (typeof loadDashboardData === "function") loadDashboardData();
        hideGlobalLoader();
      };

      if (!navigator.onLine) {
        OfflineSyncManager.saveToQueue(`${API_BASE_URL}/bookings/walkin`, "POST", payload, "Rekod Walk-In Berjaya Disimpan!");
        handleSuccess("Tersimpan di Luar Talian (Offline)");
        return;
      }

      fetch(`${API_BASE_URL}/bookings/walkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            handleSuccess("Rekod Walk-In Berjaya Disimpan!");
          } else {
             alert("Ralat: " + data.message);
             hideGlobalLoader();
          }
        })
        .catch((err) => {
          OfflineSyncManager.saveToQueue(`${API_BASE_URL}/bookings/walkin`, "POST", payload, "Rekod Walk-In Berjaya Disimpan!");
          handleSuccess("Gagal berhubung. Data disimpan offline.");
        });
    });
  } catch (err) {
    hideGlobalLoader();
  }
}

function compressImage(file, callback) {
  if (!file) return callback("");
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      let scaleSize = img.width > 800 ? 800 / img.width : 1;
      canvas.width = img.width * scaleSize;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// [DIBAIKI] Fungsi menghantar Latitud & Longitud terus ke pelayan
function submitPunch(type) {
  if (!navigator.geolocation) {
    alert("Peranti ini tidak menyokong GPS.");
    return;
  }

  const statusText = document.getElementById("punch-status");
  statusText.innerText = "Mendapatkan lokasi GPS...";

  const hantarDataKePelayan = (lokasi, latitude = 0, longitude = 0) => {
    let reqBody = {
      type: type,
      location: lokasi,
      lat: latitude,
      lon: longitude,
    };
    
    if (loggedInStaff.is_general) {
      const selectedBranch = document.getElementById("general-branch-select").value;
      if (!selectedBranch && type === "CLOCK IN") {
         statusText.innerText = "";
         alert("Sila pilih cawangan bertugas terlebih dahulu!");
         return;
      }
      reqBody.branch_id = selectedBranch;
    }

    if (!navigator.onLine) {
       OfflineSyncManager.saveToQueue(`${API_BASE_URL}/staff/punch`, "POST", reqBody, `Berjaya ${type}`);
       statusText.innerHTML = `<span style="color:var(--success);">Tersimpan Offline (${type})</span>`;
       showToast("Data disimpan sementara ketiadaan internet");
       return;
    }

    fetch(`${API_BASE_URL}/staff/punch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(reqBody),
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
           alert("Sesi anda telah tamat atau terbatal. Sila log masuk semula.");
           logoutStaff();
           throw new Error("Sesi tamat");
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === "success") {
          statusText.innerHTML = `<span style="color:var(--success);">Berjaya ${type}</span>`;
          showToast(data.message);
        } else {
          statusText.innerHTML = `<span style="color:var(--danger);">${escapeHTML(data.message)}</span>`;
        }
      })
      .catch((e) => {
        if (e.message !== "Sesi tamat") {
          OfflineSyncManager.saveToQueue(`${API_BASE_URL}/staff/punch`, "POST", reqBody, `Berjaya ${type}`);
          statusText.innerHTML = `<span style="color:var(--success);">Tersimpan Offline (${type})</span>`;
        }
      });
  };

  if (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    statusText.innerHTML = `<span style="color:var(--danger);">Akses GPS Disekat (Tiada HTTPS). Ujian diaktifkan.</span>`;
    hantarDataKePelayan("Lokasi Disekat (Ujian Tempatan)", 0, 0);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pLat = position.coords.latitude;
      const pLon = position.coords.longitude;
      const locLink = `https://www.google.com/maps/search/?api=1&query=${pLat},${pLon}`;
      // Hantar bersama nombor koordinat sebenar
      hantarDataKePelayan(locLink, pLat, pLon);
    },
    (error) => {
      statusText.innerHTML = `<span style="color:var(--danger);">GPS Gagal: ${escapeHTML(error.message)}. Lokasi Default digunakan.</span>`;
      hantarDataKePelayan("GPS Tidak Dibenarkan / Gagal Dikesan", 0, 0);
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ==========================================
// 4. Sistem Pengurusan Cuti Staf (Flatpickr & SweetAlert)
// ==========================================
let leavePicker = null;

async function initLeaveSystem() {
  const today = new Date();
  
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();
  
  const minDate = new Date(nextMonthYear, nextMonth, 1);
  const maxDate = new Date(nextMonthYear, nextMonth + 1, 0); 

  try {
     const [resOthers, resMine] = await Promise.all([
        fetch(`${API_BASE_URL}/staff/leaves`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/staff/my-leaves`, { credentials: "include" })
     ]);
     
     if (resMine.status === 401 || resMine.status === 403) {
        logoutStaff();
        return;
     }
     
     const othersData = await resOthers.json();
     const myData = await resMine.json();
     
     // Peringatan Cuti setiap 25hb sehingga hujung bulan (Hanya jika belum mohon untuk bulan hadapan)
     if (today.getDate() >= 25) {
        const nextMonthStr = String(nextMonth + 1).padStart(2, "0");
        const nextYearStr = String(nextMonthYear);
        const prefix = `${nextYearStr}-${nextMonthStr}-`;
        
        const hasAppliedNextMonth = myData.leaves && myData.leaves.some(l => l.tarikh.startsWith(prefix));
        
        if (!hasAppliedNextMonth) {
           const hasReminded = sessionStorage.getItem("din_leave_reminded");
           if (!hasReminded) {
              if (typeof Swal !== "undefined") {
                Swal.fire({
                   icon: "info",
                   title: "Peringatan Cuti!",
                   text: "Sila pilih 4 hari cuti anda untuk bulan hadapan sebelum hujung bulan ini di ruangan Profil.",
                   confirmButtonColor: "#3b82f6"
                });
                sessionStorage.setItem("din_leave_reminded", "true");
              }
           }
        }
     }
     
     const takenLeaves = othersData.leaves ? othersData.leaves.map(l => l.tarikh) : [];
     const mySelectedLeaves = myData.leaves ? myData.leaves.map(l => l.tarikh) : [];
     
     // Paparkan Jadual Cuti Saya
     const leaveListContainer = document.getElementById("my-leave-list");
     if (leaveListContainer) {
       if (!myData.leaves || myData.leaves.length === 0) {
         leaveListContainer.innerHTML = "Anda belum memohon sebarang cuti.";
       } else {
         let html = `<table style="width: 100%; border-collapse: collapse; text-align: left;">`;
         html += `<tr style="border-bottom: 1px solid #eee; color: var(--primary-blue);">
                    <th style="padding: 8px 4px;">Tarikh</th>
                    <th style="padding: 8px 4px;">Jenis</th>
                    <th style="padding: 8px 4px; text-align: right;">Status</th>
                  </tr>`;
         
         // Susun ikut tarikh dari terbaru ke lama (optional, backend dah sort ASC)
         let sortedLeaves = [...myData.leaves].sort((a, b) => new Date(b.tarikh) - new Date(a.tarikh));
         
         sortedLeaves.forEach(l => {
           let statusColor = l.status === "Approved" ? "green" : (l.status === "Rejected" ? "red" : "orange");
           let statusText = l.status || "Pending";
           let jenis = l.jenis_cuti || "Biasa";
           // Format tarikh ke format tempatan
           let tParts = l.tarikh.split("-");
           let formattedDate = tParts.length === 3 ? `${tParts[2]}/${tParts[1]}/${tParts[0]}` : l.tarikh;
           
           html += `<tr style="border-bottom: 1px solid #f9f9f9;">
                      <td style="padding: 8px 4px;">${formattedDate}</td>
                      <td style="padding: 8px 4px;">${jenis}</td>
                      <td style="padding: 8px 4px; text-align: right; color: ${statusColor}; font-weight: bold;">
                        ${statusText}
                        <button onclick="cancelLeave('${l.id}')" style="margin-left: 10px; padding: 2px 6px; font-size: 10px; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Batal</button>
                      </td>
                    </tr>`;
         });
         html += `</table>`;
         leaveListContainer.innerHTML = html;
       }
     }
     
     if (typeof flatpickr !== "undefined") {
       leavePicker = flatpickr("#leave-dates", {
          mode: "multiple",
          minDate: minDate,
          maxDate: maxDate,
          defaultDate: mySelectedLeaves,
          disable: takenLeaves,
          dateFormat: "Y-m-d",
          onChange: function(selectedDates, dateStr, instance) {
             if (selectedDates.length > 4) {
                // Remove the last selected date to keep it at 4
                selectedDates.pop();
                instance.setDate(selectedDates);
                if (typeof Swal !== "undefined") {
                  Swal.fire('Had Maksimum', 'Anda hanya dibenarkan memilih tepat 4 hari cuti.', 'warning');
                }
             }
          }
       });
       
       // Init Emergency Leave
       try {
           const resBalance = await fetch(`${API_BASE_URL}/staff/leave-balance`, { credentials: "include" });
           const balData = await resBalance.json();
           const maxDays = balData.balance !== undefined ? balData.balance : 4;
           window.emergencyLeaveMaxDays = maxDays;
           
           const today = new Date();
           const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0); // hujung bulan semasa
           
           window.emergencyLeavePicker = flatpickr("#emergency-leave-date", {
               mode: "multiple",
               minDate: "today",
               maxDate: lastDay,
               disable: mySelectedLeaves, // Jangan benarkan pilih hari yang dah lulus
               dateFormat: "Y-m-d",
               onChange: function(selectedDates, dateStr, instance) {
                   if (selectedDates.length > maxDays) {
                       selectedDates.pop();
                       instance.setDate(selectedDates);
                       if (typeof Swal !== "undefined") {
                           Swal.fire('Had Maksimum', `Baki cuti anda bulan ini hanya tinggal ${maxDays} hari.`, 'warning');
                       }
                   }
               }
           });
       } catch(e) {
           console.error("Gagal memuatkan baki cuti", e);
       }
     }
  } catch (err) {
     console.error("Gagal load data staf", err);
  } finally {
    hideGlobalLoader();
  }
}

async function submitLeaves() {
   if (!leavePicker) return;
   const selectedDates = leavePicker.selectedDates.map(d => {
       return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
   });
   
   if (selectedDates.length !== 4) {
      if (typeof Swal !== "undefined") Swal.fire('Ralat', 'Sila pilih TEPAT 4 hari cuti.', 'error');
      else alert('Sila pilih TEPAT 4 hari cuti.');
      return;
   }
   
   const btn = document.getElementById("btn-save-leave");
   btn.innerText = "Menyimpan...";
   
   try {
      const res = await fetch(`${API_BASE_URL}/staff/leaves`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         credentials: "include",
         body: JSON.stringify({ dates: selectedDates })
      });
      const data = await res.json();
      if (data.status === "success") {
         if (typeof Swal !== "undefined") Swal.fire('Berjaya', data.message, 'success');
         else alert(data.message);
      } else {
         if (typeof Swal !== "undefined") Swal.fire('Gagal', data.message, 'error');
         else alert(data.message);
      }
   } catch(err) {
      if (typeof Swal !== "undefined") Swal.fire('Gagal', 'Sistem tidak dapat berhubung', 'error');
   }
   btn.innerHTML = '<i class="fas fa-save"></i> Simpan Cuti';
}

async function submitEmergencyLeaves() {
   if (!window.emergencyLeavePicker) return;
   
   const selectedDates = window.emergencyLeavePicker.selectedDates.map(d => {
       return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
   });
   const reasonInput = document.getElementById("emergency-leave-reason").value;

   if (selectedDates.length === 0 || !reasonInput.trim()) {
      if (typeof Swal !== "undefined") Swal.fire('Ralat', 'Sila isi tarikh dan sebab kecemasan.', 'error');
      else alert('Sila isi tarikh dan sebab kecemasan.');
      return;
   }
   
   if (selectedDates.length === 0 || selectedDates.length > window.emergencyLeaveMaxDays) {
       if (typeof Swal !== "undefined") Swal.fire('Ralat', `Anda perlu memilih antara 1 hingga ${window.emergencyLeaveMaxDays} hari cuti.`, 'error');
       else alert(`Anda perlu memilih antara 1 hingga ${window.emergencyLeaveMaxDays} hari cuti.`);
       return;
   }
   
   const btn = document.getElementById("btn-save-emergency-leave");
   const originalText = btn.innerHTML;
   btn.innerText = "Menghantar...";
   
   try {
      const res = await fetch(`${API_BASE_URL}/staff/emergency-leaves`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         credentials: "include",
         body: JSON.stringify({ dates: selectedDates, reason: reasonInput.trim() })
      });
      const data = await res.json();
      if (data.status === "success") {
         if (typeof Swal !== "undefined") Swal.fire('Berjaya', data.message, 'success');
         else alert(data.message);
         window.emergencyLeavePicker.clear();
         document.getElementById("emergency-leave-reason").value = "";
      } else {
         if (typeof Swal !== "undefined") Swal.fire('Gagal', data.message, 'error');
         else alert(data.message);
      }
   } catch(err) {
      if (typeof Swal !== "undefined") Swal.fire('Gagal', 'Sistem tidak dapat berhubung', 'error');
   }
   btn.innerHTML = originalText;
}






// ==========================================
// PUSH NOTIFICATION (WEB PUSH API)
// ==========================================
async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
        reg = await navigator.serviceWorker.register('/staff/sw.js?v=2');
    }
    const res = await fetch(`${API_BASE_URL}/staff/push/vapid-key`, {credentials: 'include'});
    if (!res.ok) throw new Error('Gagal dapatkan VAPID key');
    
    const { publicKey } = await res.json();
    
    const urlB64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    const applicationServerKey = urlB64ToUint8Array(publicKey.trim());
    
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
    }

    const subRes = await fetch(`${API_BASE_URL}/staff/push/subscribe`, {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!subRes.ok) throw new Error('Gagal simpan langganan staff');
    
    console.log('Staff Push subscribed.');
  } catch (err) {
    console.error('Staff Push sub error', err);
  }
}


document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && typeof loggedInStaff !== 'undefined' && loggedInStaff) {
        if (typeof subscribeToPush === 'function') subscribeToPush();
    }
});
