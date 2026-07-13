const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST
  ? "http://localhost:3000/api"
  : "https://dinspire-system.onrender.com/api";

let loggedInStaff = null;
let shopSettings = { walkin: [] };
let staffData = { bookings: [], reviews: [], commissionPercent: 50 };

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
  let savedUser = localStorage.getItem("din_staff_info");
  if (savedUser) {
    loggedInStaff = JSON.parse(savedUser);
    fetchServicesForWalkin();
    showDashboard();
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

  const tabs = ["dashboard", "walkin", "booking", "history", "profile"];
  tabs.forEach((tab) => {
    document.getElementById(`nav-${tab}`)?.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(tab);
      if (tab === "dashboard" || tab === "booking" || tab === "history")
        loadDashboardData();
    });
  });
}

async function loginStaffSystem() {
  const username = document.getElementById("sys-username").value.trim();
  const password = document.getElementById("sys-password").value.trim();
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
      body: JSON.stringify({
        username,
        password,
        allowed_roles: ["staff", "owner"],
      }),
    });
    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("din_staff_info", JSON.stringify(data.user));
      loggedInStaff = data.user;
      showToast(`Selamat bertugas!`);
      fetchServicesForWalkin();
      showDashboard();
    } else alert(data.message);
  } catch (err) {
    alert("Gagal menyambung ke pelayan.");
  }
  btn.innerText = "Log Masuk";
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
        loggedInStaff = null;
        location.reload();
      });
  }
}

function showDashboard() {
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
}

function switchView(id) {
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
    if (data.Haircuts) allServices = allServices.concat(data.Haircuts);
    if (data.Treatments) allServices = allServices.concat(data.Treatments);
    shopSettings.walkin = allServices;

    const wiSel = document.getElementById("wi-service");
    wiSel.innerHTML =
      `<option value="" disabled selected>Pilih Jenis Potongan / Servis</option>` +
      shopSettings.walkin
        .map(
          (s) =>
            `<option value="${s.id}" data-price="${s.price}">${s.name}</option>`,
        )
        .join("");
  } catch (err) {}
}

async function loadBranchOptions() {
  try {
    const res = await fetch(`${API_BASE_URL}/shop-data`);
    const data = await res.json();
    const select = document.getElementById("punch-branch");
    if (data.Branches) {
      select.innerHTML =
        '<option value="" disabled selected>Pilih Cawangan</option>' +
        data.Branches.map(
          (b) => `<option value="${b.name}">${b.name}</option>`,
        ).join("");
    }
  } catch (e) {
    console.error("Gagal ambil cawangan");
  }
}

function autoFillPrice() {
  const sel = document.getElementById("wi-service");
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.price)
    document.getElementById("wi-price").value = opt.dataset.price;
}
function toggleReceiptUpload() {
  const method = document.getElementById("wi-payment").value;
  document.getElementById("wi-receipt-group").style.display =
    method === "QR" ? "block" : "none";
}

async function loadDashboardData() {
  if (!loggedInStaff) return;
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
      staffData.bookings = Array.isArray(data) ? data : data.bookings || [];
      staffData.reviews = data.reviews || [];
      staffData.commissionPercent = data.commissionPercent || 50;
      calculateDashboardStats();
      renderBookingList();
      renderHistoryList();
    }
  } catch (err) {}
}

function calculateDashboardStats() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let monthlyCustomers = 0;
  let monthlySales = 0;
  let cashOnHand = 0;

  staffData.bookings.forEach((b) => {
    if (b.status === "Selesai") {
      let bDate = new Date(b.booking_date);
      if (
        bDate.getMonth() === currentMonth &&
        bDate.getFullYear() === currentYear
      ) {
        monthlyCustomers++;
        monthlySales += parseFloat(b.price) || 0;
      }
      if (b.payment_method === "Cash" || b.payment_method === "Tunai") {
        cashOnHand += parseFloat(b.price) || 0;
      }
    }
  });

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
  document.getElementById("dash-cash").innerText =
    `RM ${cashOnHand.toFixed(0)}`;
}

function renderBookingList() {
  const container = document.getElementById("booking-container");
  const activeBookings = staffData.bookings.filter((b) => b.status === "Aktif");

  if (activeBookings.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 13px;">Tiada tempahan aktif buat masa ini.</div>`;
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
      let btnAction = isEarly
        ? `<button class="btn btn-disabled" onclick="showToast('Selesai dikunci.')"><i class="fas fa-lock mr-2"></i> Belum Tiba Waktu</button>`
        : `<button class="btn btn-primary" onclick="processBookingSelesai('${escapeHTML(b.order_no)}', ${b.price})"><i class="fas fa-check-circle mr-2"></i> Selesai</button>`;

      return `<div class="list-card"><div class="list-header"><span class="cust-name">${customerName}</span><span class="badge badge-pending">Booking Aktif</span></div><div class="list-detail"><strong>Servis:</strong> ${serviceName} <br><strong>Tarikh:</strong> ${new Date(b.booking_date).toLocaleDateString("ms-MY")} <strong>Masa:</strong> ${b.booking_time} <br><strong>No. Order:</strong> <span style="font-family:monospace; color:var(--primary);">${escapeHTML(b.order_no)}</span></div><div class="btn-action-group">${btnAction}<button class="btn btn-outline" style="width:30%; color:var(--danger);" onclick="cancelBooking('${escapeHTML(b.order_no)}')">Batal</button></div></div>`;
    })
    .join("");
}

function renderHistoryList() {
  const container = document.getElementById("history-container");
  const historyData = staffData.bookings
    .filter((b) => b.status === "Selesai" || b.status === "Batal")
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
        b.status === "Batal"
          ? "badge-pending"
          : b.payment_method === "QR"
            ? "badge-qr"
            : "badge-cash";
      let method = b.status === "Batal" ? "Dibatalkan" : b.payment_method;

      return `<div class="list-card" style="opacity: 0.85;"><div class="list-header"><span class="cust-name">${customerName}</span><span class="badge ${badgeClass}">${method}</span></div><div class="list-detail"><strong>Servis:</strong> ${serviceName} <br><strong>Tarikh Selesai:</strong> ${new Date(b.booking_date).toLocaleDateString("ms-MY")} <br><strong>Kutipan:</strong> RM ${b.final_price || b.price}</div></div>`;
    })
    .join("");
}

function processBookingSelesai(orderNo, price) {
  if (confirm(`Sahkan pelanggan (${orderNo}) ini telah selesai?`)) {
    fetch(`${API_BASE_URL}/bookings/order/${orderNo}/complete`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ final_price: price, receipt_url: "" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          showToast("Tempahan Selesai!");
          loadDashboardData();
        } else alert("Ralat: " + data.message);
      });
  }
}

function cancelBooking(orderNo) {
  if (confirm(`Pasti mahu BATALKAN tempahan ini?`)) {
    showToast("Sistem Batal sedang diselenggara.");
  }
}

function submitWalkIn() {
  const name = document.getElementById("wi-name").value.trim();
  const service_id = document.getElementById("wi-service").value;
  const payment = document.getElementById("wi-payment").value;
  const price = document.getElementById("wi-price").value;
  const fileInput = document.getElementById("wi-receipt").files[0];

  if (!name || !service_id || !price || !payment) {
    alert("Sila isikan semua maklumat yang wajib.");
    return;
  }
  if (payment === "QR" && !fileInput) {
    alert(
      "Sila muat naik gambar resit transaksi DuitNow/QR sebelum tekan selesai!",
    );
    return;
  }

  const btn = document.getElementById("btn-submit-walkin");
  btn.innerText = "Memproses...";
  btn.disabled = true;

  compressImage(fileInput, (base64) => {
    const now = new Date();
    const payload = {
      customer_name: name,
      service_id: service_id,
      booking_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      booking_time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      price: parseFloat(price),
      payment_method: payment,
      receipt_url: base64,
    };

    fetch(`${API_BASE_URL}/bookings/walkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          showToast("Rekod Walk-In Berjaya Disimpan!");
          document.getElementById("wi-name").value = "";
          document.getElementById("wi-service").value = "";
          document.getElementById("wi-price").value = "";
          document.getElementById("wi-receipt").value = "";
          document.getElementById("wi-receipt-group").style.display = "none";
          document.getElementById("wi-payment").value = "Cash";
          switchView("dashboard");
          loadDashboardData();
        } else alert("Ralat: " + data.message);
        btn.innerText = "Sahkan Walk-In";
        btn.disabled = false;
      })
      .catch((err) => {
        alert("Gagal menyimpan rekod Walk-In.");
        btn.innerText = "Sahkan Walk-In";
        btn.disabled = false;
      });
  });
}

function compressImage(file, callback) {
  if (!file) return callback("");
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
      callback(canvas.toDataURL("image/jpeg", 0.6));
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
    fetch(`${API_BASE_URL}/staff/punch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      // Menghantar parameter baharu (lat & lon) ke laluan API
      body: JSON.stringify({
        type: type,
        location: lokasi,
        lat: latitude,
        lon: longitude,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          statusText.innerHTML = `<span style="color:var(--success);">Berjaya ${type}</span>`;
          showToast(data.message);
        } else {
          statusText.innerHTML = `<span style="color:var(--danger);">${data.message}</span>`;
        }
      })
      .catch(
        (e) =>
          (statusText.innerHTML = `<span style="color:var(--danger);">Ralat sambungan pelayan.</span>`),
      );
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
      const locLink = `https://www.google.com/maps/search/?api=1&query=$${pLat},${pLon}`;
      // Hantar bersama nombor koordinat sebenar
      hantarDataKePelayan(locLink, pLat, pLon);
    },
    (error) => {
      statusText.innerHTML = `<span style="color:var(--danger);">GPS Gagal: ${error.message}. Lokasi Default digunakan.</span>`;
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
