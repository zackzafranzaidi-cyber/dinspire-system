const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST
  ? "http://localhost:3000/api"
  : "https://api.dinspirebarbershop.com/api";


let masterData = {
  bookings: [],
  reviews: [],
  punchCard: [],
  orders: [],
  commissionPercent: 50,
};
let mapBarberBranch = {};
let salesChartObj, demoChartObj, payChartObj, staffChartObj, branchLineChartObj;
let hasAutoTriggeredAI = false;
let currentInsightAbortController = null;
let insightDebounceTimer = null;
let currentActiveTab = "dashboard";
let currentReferenceDate = new Date();

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) {
    alert(msg);
    return;
  }
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function resetDateOffset() {
  currentReferenceDate = new Date();
}

function changeDateOffset(direction) {
  const filterType = document.getElementById("timeFilter").value;
  if (filterType === "all") return; // No offset for all time
  
  let newDate = new Date(currentReferenceDate);
  if (filterType === "daily") {
    newDate.setDate(newDate.getDate() + direction);
  } else if (filterType === "weekly") {
    newDate.setDate(newDate.getDate() + (direction * 7));
  } else if (filterType === "monthly") {
    newDate.setMonth(newDate.getMonth() + direction);
  } else if (filterType === "yearly") {
    newDate.setFullYear(newDate.getFullYear() + direction);
  }
  
  // Prevent navigating to the future beyond today if desired, or let them see empty data
  currentReferenceDate = newDate;
  processData();
}

function updateDateDisplay() {
  const filterType = document.getElementById("timeFilter").value;
  const displayEl = document.getElementById("currentDateDisplay");
  if (!displayEl) return;
  
  if (filterType === "all") {
    displayEl.innerHTML = "<i class='fas fa-infinity mr-2'></i> Sepanjang Masa";
    return;
  }
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  if (filterType === "yearly") {
    displayEl.innerHTML = "<i class='fas fa-calendar-alt mr-2'></i> Tahun " + currentReferenceDate.getFullYear();
  } else if (filterType === "monthly") {
    const monthName = currentReferenceDate.toLocaleDateString("ms-MY", { month: "long" });
    displayEl.innerHTML = "<i class='fas fa-calendar-alt mr-2'></i> " + monthName + " " + currentReferenceDate.getFullYear();
  } else if (filterType === "weekly") {
    let startOfWeek = new Date(currentReferenceDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    let endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    displayEl.innerHTML = "<i class='fas fa-calendar-week mr-2'></i> " + startOfWeek.getDate() + " - " + endOfWeek.getDate() + " " + endOfWeek.toLocaleDateString("ms-MY", { month: "long" });
  } else if (filterType === "daily") {
    displayEl.innerHTML = "<i class='fas fa-calendar-day mr-2'></i> " + currentReferenceDate.toLocaleDateString("ms-MY", options);
  }
}

let currentLang = "en";

// Simpan reference animasi supaya tidak bertindih
const activeAnimations = {};
const observerMap = {};

// Fungsi Animasi Nombor (Smooth Counter)
function animateNumber(id, targetVal, prefix = "", suffix = "", decimals = 0) {
  const el = document.getElementById(id);
  if (!el) return;

  // Dapatkan nilai bermula daripada innerText sedia ada (jika ada)
  let startText = el.innerText.replace(/[^0-9.-]+/g, "");
  let startVal = parseFloat(startText) || 0;

  // Format Helper untuk koma yang tepat
  const formatVal = (val) => {
    return val.toLocaleString("en-MY", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  if (startVal === targetVal) {
    el.innerText = prefix + formatVal(targetVal) + suffix;
    return;
  }

  // Fungsi utama yang menjalankan animasi
  const runAnimation = () => {
    if (activeAnimations[id]) cancelAnimationFrame(activeAnimations[id]);

    const duration = 1500; 
    let startTime = null;

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function update(currentTime) {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easedProgress = easeOutQuart(progress);
      const currentVal = startVal + (targetVal - startVal) * easedProgress;

      el.innerText = prefix + formatVal(currentVal) + suffix;

      if (progress < 1) {
        activeAnimations[id] = requestAnimationFrame(update);
      } else {
        el.innerText = prefix + formatVal(targetVal) + suffix;
        delete activeAnimations[id];
      }
    }

    activeAnimations[id] = requestAnimationFrame(update);
  };

  if (observerMap[id]) observerMap[id].disconnect();

  el.pendingAnimation = runAnimation;
  observerMap[id] = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (el.pendingAnimation) {
          el.pendingAnimation();
          el.pendingAnimation = null;
        }
      }
    });
  }, { threshold: 0.1 });
  observerMap[id].observe(el);
}

// Fungsi Animasi Graf (Bila Scroll)
function animateChartWhenVisible(chartObj, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !chartObj) return;

  if (observerMap[canvasId]) observerMap[canvasId].disconnect();

  canvas.pendingChartUpdate = () => chartObj.update();
  observerMap[canvasId] = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (canvas.pendingChartUpdate) {
          canvas.pendingChartUpdate();
          canvas.pendingChartUpdate = null;
        }
      }
    });
  }, { threshold: 0.2 }); // Trigger bila 20% graf nampak
  observerMap[canvasId].observe(canvas);
}

const i18n = {
  en: {
    "header-subtitle": "DASHBOARD / BUSINESS ANALYSIS",
    "header-title": "Overall Performance",
    "ai-advisor": "AI Advisor",
    "filter-daily": "TODAY",
    "filter-weekly": "THIS WEEK",
    "filter-monthly": "THIS MONTH",
    "filter-yearly": "THIS YEAR",
    "filter-all": "ALL RECORDS",
    "nav-sales": "Sales Analysis",
    "nav-orders": "Orders & Flow",
    "nav-reviews": "Customer Reviews",
    "nav-gps": "GPS Attendance",
    "owner-title": "Owner",
    "ai-insights-title": "AI Quick Insights",
    "card-quotation": "Total Revenue",
    "card-commission": "Staff Commissions",
    "card-product": "Product Sales",
    "card-service": "Total Service",
    "card-rating": "Average Rating",
    "chart-demographic":
      '<i class="fas fa-chart-pie mr-2 text-gray-500"></i> Service Demographics',
    "chart-payment":
      '<i class="fas fa-credit-card mr-2 text-gray-500"></i> Payment Methods',
    "chart-staff":
      '<i class="fas fa-user-friends mr-2 text-gray-500"></i> Staff Sales',
    "table-branch":
      '<i class="fas fa-building mr-2 text-gray-500"></i> Branch Traffic',
    "table-barber":
      '<i class="fas fa-user-tie mr-2 text-gray-500"></i> Barber Performance',
    "table-cash":
      '<i class="fas fa-wallet mr-2 text-gray-500"></i> Cash On Hand List',
    "table-attendance":
      '<i class="fas fa-user-clock mr-2 text-purple-500"></i> Staff Attendance',
    "chart-sales": "Cash Flow Trend",
    "th-location": "Location",
    "th-traffic": "Traffic",
    "th-sales": "Sales (RM)",
    "th-staff": "Staff",
    "th-completed": "Completed",
    "th-cash": "Current Cash (RM)",
    "th-hours": "Total Hours",
    "table-no-record": "No Records",
    "mob-nav-sales": "Analysis",
    "mob-nav-orders": "Orders",
    "mob-nav-reviews": "Reviews",
    "mob-nav-gps": "Attend",
    "mob-nav-ai": "AI",
    "tx-service-list": "Service List",
    "tx-product-orders": "Product Orders",
    "reviews-title": "Customer Reviews",
    "th-datetime": "Date & Time",
    "th-staff-name": "Staff Name",
    "th-in-out": "In / Out",
    "th-gps": "Location",
    "ai-online": "Online",
  },
  ms: {
    "header-subtitle": "DASHBOARD / ANALISIS PERNIAGAAN",
    "header-title": "Prestasi Keseluruhan",
    "ai-advisor": "Penasihat AI",
    "filter-daily": "HARI INI",
    "filter-weekly": "MINGGU INI",
    "filter-monthly": "BULAN INI",
    "filter-yearly": "TAHUN INI",
    "filter-all": "SEMUA REKOD",
    "nav-sales": "Analisis Jualan",
    "nav-orders": "Aliran & Pesanan",
    "nav-reviews": "Ulasan Pelanggan",
    "nav-gps": "Kehadiran GPS",
    "owner-title": "Pemilik",
    "ai-insights-title": "Sekilas Pandang AI",
    "card-quotation": "Total Quotation",
    "card-commission": "Staff Commissions",
    "card-product": "Product Sales",
    "card-service": "Total Service",
    "card-rating": "Average Rating",
    "chart-demographic":
      '<i class="fas fa-chart-pie mr-2 text-gray-500"></i> Demografi Servis',
    "chart-payment":
      '<i class="fas fa-credit-card mr-2 text-gray-500"></i> Kaedah Bayaran',
    "chart-staff":
      '<i class="fas fa-user-friends mr-2 text-gray-500"></i> Jualan Staf',
    "table-branch":
      '<i class="fas fa-building mr-2 text-gray-500"></i> Trafik Cawangan',
    "table-barber":
      '<i class="fas fa-user-tie mr-2 text-gray-500"></i> Prestasi Barber',
    "table-cash":
      '<i class="fas fa-wallet mr-2 text-gray-500"></i> Senarai Cash On Hand',
    "table-attendance":
      '<i class="fas fa-user-clock mr-2 text-purple-500"></i> Prestasi Kehadiran',
    "chart-sales": "Trend Aliran Tunai",
    "th-location": "Lokasi",
    "th-traffic": "Trafik",
    "th-sales": "Jualan (RM)",
    "th-staff": "Staf",
    "th-completed": "Selesai",
    "th-cash": "Tunai Semasa (RM)",
    "th-hours": "Jumlah Jam",
    "table-no-record": "Tiada Rekod",
    "mob-nav-sales": "Analisis",
    "mob-nav-orders": "Pesanan",
    "mob-nav-reviews": "Ulasan",
    "mob-nav-gps": "Hadir",
    "mob-nav-ai": "AI",
    "tx-service-list": "Senarai Servis",
    "tx-product-orders": "Pesanan Produk",
    "reviews-title": "Maklum Balas Pelanggan",
    "th-datetime": "Tarikh & Masa",
    "th-staff-name": "Nama Staf",
    "th-in-out": "In / Out",
    "th-gps": "Lokasi GPS",
    "ai-online": "Dalam Talian",
  },
};

function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (i18n[currentLang][key]) {
      el.innerHTML = i18n[currentLang][key];
    }
  });
  document.getElementById("lang-indicator").innerText =
    currentLang.toUpperCase();
  const mobIndicator = document.getElementById("lang-indicator-mob");
  if (mobIndicator) {
    mobIndicator.innerText = `Bahasa (${currentLang.toUpperCase()})`;
  }
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "ms" : "en";
  applyLanguage();
}

function toggleAIDrawer() {
  const drawer = document.getElementById("ai-right-drawer");
  if (drawer) {
    drawer.classList.toggle("translate-x-full");
  }
}

// Fungsi untuk meneutralkan kod HTML/Javascript berbahaya
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>'"]/g, function (tag) {
    const charsToReplace = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return charsToReplace[tag] || tag;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  let isLogged = localStorage.getItem("din_owner_logged") || sessionStorage.getItem("din_owner_logged");
  if (isLogged) {
    document.getElementById("login-overlay").style.display = "none";
    try {
      initChart();
    } catch (e) {}
    fetchOwnerDashboardData();
  } else {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => { preloader.style.visibility = 'hidden'; }, 800);
    }
  }
});

async function loginSystem(allowedRoles) {
  const username = document.getElementById("sys-username").value.trim();
  const password = document.getElementById("sys-password").value.trim();
  const remember = document.getElementById("login-remember").checked;
  const btn = document.querySelector(".login-box button");

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
      body: JSON.stringify({ username, password, allowed_roles: allowedRoles, remember }),
    });
    const data = await res.json();

    if (data.status === "success") {
      if (remember) {
        localStorage.setItem("din_owner_logged", "true");
      } else {
        sessionStorage.setItem("din_owner_logged", "true");
      }
      document.getElementById("login-overlay").style.display = "none";
      try {
        initChart();
      } catch (e) {}
      fetchOwnerDashboardData();
    } else alert(data.message);
  } catch (err) {
    alert("Gagal menyambung ke pelayan.");
  }
  btn.innerText = "Log Masuk";
}

function logoutOwner() {
  fetch(`${API_BASE_URL}/auth/logout-sys`, {
    method: "POST",
    credentials: "include",
  })
    .catch((e) => console.error(e))
    .finally(() => {
      localStorage.removeItem("din_owner_logged");
      sessionStorage.removeItem("din_owner_logged");
      location.reload();
    });
}

function closeLoading() {
  document.getElementById("loading-overlay").style.display = "none";
  document.getElementById("loading-overlay").classList.remove("flex");
  
  const preloader = document.getElementById('preloader');
  if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => { preloader.style.visibility = 'hidden'; }, 800);
  }
}

function switchTab(tabName, element = null) {
  currentActiveTab = tabName;
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.remove("block"));
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.add("hidden"));

  const activeTab = document.getElementById("tab-" + tabName);
  if (activeTab) {
    activeTab.classList.remove("hidden");
    activeTab.classList.add("block");
  }

  document.querySelectorAll(".sidebar-nav-item, .nav-item").forEach((el) => {
    el.classList.remove(
      "bg-white",
      "text-black",
      "shadow-lg",
      "active",
      "bg-gray-800",
      "text-white",
    );
    if (el.classList.contains("sidebar-nav-item")) {
      el.classList.add(
        "text-gray-400",
        "hover:text-white",
        "hover:bg-gray-800",
      );
    }
  });

  const activeSide = document.getElementById("nav-" + tabName);
  if (activeSide) {
    activeSide.classList.remove(
      "text-gray-400",
      "hover:text-white",
      "hover:bg-gray-800",
    );
    activeSide.classList.add("bg-gray-800", "text-white", "shadow-lg");
  }

  const activeMob = document.getElementById("mob-nav-" + tabName);
  if (activeMob) activeMob.classList.add("active");

  const titles_i18n = {
    dashboard: "header-title",
    transactions: "nav-orders",
    reviews: "nav-reviews",
    punch: "nav-gps",
    ai: "mob-nav-ai",
  };
  const pTitle = document.getElementById("page-title");
  if (pTitle) {
    let key = titles_i18n[tabName] || "header-title";
    pTitle.setAttribute("data-i18n", key);
    pTitle.innerText = i18n[currentLang][key] || "Dashboard";
  }
}

// Logik Reka Letak Dinamik AI (Desktop vs Mobile)
function adjustAILayout() {
  const aiWidget = document.getElementById("ai-chat-widget");
  const desktopContainer = document.getElementById("desktop-ai-container");
  const mobileContainer = document.getElementById("tab-ai");

  if (!aiWidget || !desktopContainer || !mobileContainer) return;

  if (window.innerWidth >= 768) {
    // Pindahkan ke Sidebar jika Desktop
    if (aiWidget.parentElement !== desktopContainer) {
      desktopContainer.appendChild(aiWidget);
    }
  } else {
    // Pindahkan ke Tab AI jika Mobile
    if (aiWidget.parentElement !== mobileContainer) {
      mobileContainer.appendChild(aiWidget);
    }
  }
}

window.addEventListener("resize", adjustAILayout);

function toggleTxTab(type) {
  document.getElementById("tx-servis-view").classList.add("hidden");
  document.getElementById("tx-produk-view").classList.add("hidden");
  document.getElementById("tx-" + type + "-view").classList.remove("hidden");
}

function togglePunchTab(type) {
  document.getElementById("punch-hadir-view").classList.add("hidden");
  document.getElementById("punch-hadir-view").classList.remove("block");
  document.getElementById("punch-cuti-view").classList.add("hidden");
  document.getElementById("punch-cuti-view").classList.remove("block");
  document.getElementById("punch-kecemasan-view").classList.add("hidden");
  document.getElementById("punch-kecemasan-view").classList.remove("block");
  
  if (type === 'hadir') {
    document.getElementById("punch-hadir-view").classList.remove("hidden");
    document.getElementById("punch-hadir-view").classList.add("block");
  } else if (type === 'cuti') {
    document.getElementById("punch-cuti-view").classList.remove("hidden");
    document.getElementById("punch-cuti-view").classList.add("block");
  } else if (type === 'kecemasan') {
    document.getElementById("punch-kecemasan-view").classList.remove("hidden");
    document.getElementById("punch-kecemasan-view").classList.add("block");
  }
}

async function fetchOwnerDashboardData() {
  document.getElementById("loading-overlay").classList.add("flex");
  document.getElementById("loading-overlay").classList.remove("hidden");

  // [DIBAIKI] Caching Tempatan (Optimistic Load) untuk PWA
  const cachedData = localStorage.getItem("din_owner_dashboard");
  if (cachedData) {
      try {
          const data = JSON.parse(cachedData);
          masterData = data.masterData || {};
          mapBarberBranch = data.mapBarberBranch || {};
          if (!masterData.orders) masterData.orders = [];
          if (!masterData.bookings) masterData.bookings = [];
          processData();
      } catch (e) {}
  }

  try {
    const res = await fetch(`${API_BASE_URL}/owner/dashboard`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (res.status === 401 || res.status === 403) {
      alert("Sesi anda telah tamat. Sila log masuk semula.");
      logoutOwner();
      return;
    }

    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("din_owner_dashboard", JSON.stringify(data)); // Simpan ke cache tempatan
      masterData = data.masterData;
      mapBarberBranch = data.mapBarberBranch || {};
      if (!masterData.orders) masterData.orders = [];
      if (!masterData.bookings) masterData.bookings = [];
      processData();
      fetchSMSBalance();
    } else {
      alert("Ralat Sistem: " + (data.message || "Gagal mendapatkan data."));
      logoutOwner();
    }
  } catch (err) {
    console.error("Fetch err:", err);
  } finally {
    closeLoading();
  }
}

function parseGSDate(dateStr) {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d)) return d;
  let str = String(dateStr).trim();
  let parts = str.split(/[\/\-T ]/);
  if (
    parts.length >= 3 &&
    parts[0].length <= 2 &&
    parts[1].length <= 2 &&
    parts[2].length === 4
  )
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
  return null;
}

function isWithinFilter(dateData, filterType, refDate) {
  if (filterType === "all") return true;
  if (!dateData) return false;
  let dateObj = parseGSDate(dateData);
  if (!dateObj || isNaN(dateObj.getTime())) return false;
  if (filterType === "daily")
    return dateObj.toDateString() === refDate.toDateString();
  if (filterType === "weekly") {
    let startOfWeek = new Date(refDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    let endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    return dateObj >= startOfWeek && dateObj < endOfWeek;
  }
  if (filterType === "monthly")
    return (
      dateObj.getMonth() === refDate.getMonth() &&
      dateObj.getFullYear() === refDate.getFullYear()
    );
  if (filterType === "yearly")
    return dateObj.getFullYear() === refDate.getFullYear();
  return true;
}

function processData() {
  updateDateDisplay();
  const filterType = document.getElementById("timeFilter").value;
  const now = currentReferenceDate;
  let filteredBookings = masterData.bookings.filter(
    (b) =>
      b.Status === "Selesai" &&
      isWithinFilter(b.Date || b.Timestamp || b.created_at, filterType, now),
  );
  let filteredOrders = masterData.orders.filter((o) =>
    isWithinFilter(o.tarikh || o.Timestamp || o.created_at, filterType, now),
  );
  let filteredPunch = (masterData.punchCard || []).filter((p) =>
    isWithinFilter(
      p.Tarikh || p.tarikh || p.Timestamp || p.created_at,
      filterType,
      now,
    ),
  );
  const filteredReviews = (masterData.reviews || []).filter((r) =>
    isWithinFilter(r.tarikh || r.Timestamp || r.created_at, filterType, now),
  );
  
  const filteredLeaves = (masterData.staffLeaves || []).filter((l) =>
    isWithinFilter(l.tarikh, filterType, now),
  );

  let serviceRev = 0;
  let staffStats = {};
  let branchStats = {};
  let countHcBooking = 0;
  let countHcWalkin = 0;
  let countTreatments = 0;
  let countOnCall = 0;
  let payData = { cash: 0, qr: 0, fpx: 0, lain: 0 };
  let totalServiceFees = 0;

  filteredBookings.forEach((b) => {
    const price = parseFloat(b.Price) || 0;
    const fee = parseFloat(b.Fee) || 0;
    serviceRev += price;
    totalServiceFees += fee;
    if (!staffStats[b.Barber])
      staffStats[b.Barber] = { count: 0, sales: 0, cash: 0 };
    staffStats[b.Barber].count++;
    staffStats[b.Barber].sales += price;

    let bType = (b.Type || "").toLowerCase();
    if (bType.includes("cash") || bType.includes("tunai")) {
      staffStats[b.Barber].cash += price;
      payData.cash += price;
    } else if (bType.includes("qr") || bType.includes("duitnow")) {
      payData.qr += price;
    } else if (bType.includes("fpx")) {
      payData.fpx += price;
    } else {
      payData.lain += price;
    }

    let br = mapBarberBranch[b.Barber] || "In-Branch";
    if (!branchStats[br]) branchStats[br] = { count: 0, sales: 0 };
    branchStats[br].count++;
    branchStats[br].sales += price;

    let cat = (b.Category || "").toLowerCase();
    if (cat.includes("on-call")) countOnCall++;
    else if (cat.includes("treatment") || cat.includes("rawatan"))
      countTreatments++;
    else {
      if (cat.includes("walk")) countHcWalkin++;
      else countHcBooking++;
    }
  });

  const totalComm = serviceRev * (masterData.commissionPercent / 100);
  let productRev = 0;
  let productOrderCount = filteredOrders.length;
  let totalShippingFees = 0;
  filteredOrders.forEach((o) => {
    try {
      let rawItems = o.Items || o.senarai_produk;
      let items =
        typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;
      let cost = 0;
      for (let k in items) cost += items[k].qty * items[k].price;
      o._calculatedTotal = cost;
      productRev += cost;
      totalShippingFees += parseFloat(o.shipping_fee) || 0;
      
      let resit = (o.resit || "").toLowerCase();
      if (resit.includes("fpx")) {
        payData.fpx += cost;
      } else if (resit.includes("http")) {
        payData.qr += cost;
      } else {
        payData.lain += cost;
      }
    } catch (e) {
      o._calculatedTotal = 0;
    }
  });

  animateNumber("val-revenue", serviceRev + productRev, "RM ", "", 0);
  if (document.getElementById("val-service-fee")) animateNumber("val-service-fee", totalServiceFees, "RM ", "", 2);
  if (document.getElementById("val-shipping-fee")) animateNumber("val-shipping-fee", totalShippingFees, "RM ", "", 2);
  animateNumber("val-commission", totalComm, "RM ", "", 2);
  animateNumber("val-products-rm", productRev, "RM ", "", 2);
  animateNumber("val-orders-count", productOrderCount, "", "", 0);
  animateNumber("val-services-count", filteredBookings.length, "", "", 0);
  document.getElementById("val-walkin-booking").innerText =
    `${countHcWalkin} / ${countHcBooking}`;

  let tStars = 0;
  filteredReviews.forEach(
    (r) => (tStars += parseInt(r.Stars || r.bintang) || 0),
  );
  const avgRating = filteredReviews.length ? (tStars / filteredReviews.length) : 0.0;
  animateNumber("val-rating", avgRating, "", "", 1);

  let topBranch = "-";
  let highest = -1;
  for (let k in branchStats) {
    if (branchStats[k].count > highest) {
      highest = branchStats[k].count;
      topBranch = k;
    }
  }
  document.getElementById("val-top-branch").innerText = topBranch;

  function sortAndColorDonut(chartObj, labels, dataArr, chartId) {
    if (!chartObj) return;
    let total = dataArr.reduce((sum, v) => sum + v, 0);
    if (total > 0) {
      let combined = [];
      for (let i = 0; i < labels.length; i++) {
        if (dataArr[i] > 0) {
          combined.push({ label: labels[i], value: dataArr[i] });
        }
      }
      if (combined.length === 0) combined.push({ label: "Tiada Data", value: 1 });
      else combined.sort((a, b) => b.value - a.value);

      chartObj.data.labels = combined.map(c => c.label);
      chartObj.data.datasets[0].data = combined.map(c => c.value);

      const allGrays = ["#111827", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb", "#f3f4f6"];
      let count = combined.length;
      let colors = [];
      if (combined[0].label === "Tiada Data") {
        colors = ["#e5e7eb"];
      } else if (count === 1) colors = [allGrays[0]];
      else if (count === 2) colors = [allGrays[0], allGrays[6]];
      else if (count === 3) colors = [allGrays[0], allGrays[4], allGrays[6]];
      else if (count === 4) colors = [allGrays[0], allGrays[3], allGrays[5], allGrays[7]];
      else {
        for (let i = 0; i < count; i++) {
          let idx = Math.floor(i * (allGrays.length - 1) / (count - 1));
          colors.push(allGrays[idx]);
        }
      }
      chartObj.data.datasets[0].backgroundColor = colors;
    } else {
      chartObj.data.labels = ["Tiada Data"];
      chartObj.data.datasets[0].data = [1];
      chartObj.data.datasets[0].backgroundColor = ["#e5e7eb"];
    }
    animateChartWhenVisible(chartObj, chartId);
  }

  let demoLabels = ["Gunting", "Rawatan", "OnCall"];
  let demoData = [countHcBooking + countHcWalkin, countTreatments, countOnCall];
  sortAndColorDonut(demoChartObj, demoLabels, demoData, "demoChart");

  let payLabels = ["Tunai (Cash)", "DuitNow QR", "FPX", "Lain"];
  let payDataArr = [payData.cash, payData.qr, payData.fpx, payData.lain];
  sortAndColorDonut(payChartObj, payLabels, payDataArr, "payChart");

  let sNames = Object.keys(staffStats);
  let staffSalesData = sNames.map(n => staffStats[n].sales);
  sortAndColorDonut(staffChartObj, sNames, staffSalesData, "staffChart");



  renderBranchTable(branchStats);
  renderStaffTable(staffStats);
  renderCashTable(staffStats);
  renderAttendanceTable(filteredPunch);
  renderTxServisTable(filteredBookings);
  renderTxProdukTable(filteredOrders);
  renderReviewsTable(filteredReviews);
  renderPunchTable(filteredPunch);
  renderLeavesTable(filteredLeaves);
  renderEmergencyLeavesTable(filteredLeaves);
  renderReportsTab();
  
  if (salesChartObj)
    updateBarChart(filteredBookings, filteredOrders, filterType);

  fetchDashboardInsights(
    (serviceRev + productRev).toFixed(2),
    filteredBookings.length,
    countHcWalkin,
    countHcBooking,
    countTreatments,
    countOnCall,
    filterType,
  );
}

async function fetchDashboardInsights(
  totalSales,
  totalServis,
  walkin,
  booking,
  rawatan,
  oncall,
  filterType,
) {
  const container = document.getElementById("ai-quick-insights");
  if (!container) return;

  document.getElementById("ai-insights-status").innerHTML =
    '<i class="fas fa-spinner fa-spin mr-1"></i> Menganalisis...';
  document.getElementById("ai-insights-status").className =
    "text-[10px] text-purple-300 font-bold tracking-widest uppercase bg-purple-900/50 px-2 py-1 rounded-full border border-purple-500/30 whitespace-nowrap";
  document.getElementById("ai-insights-content").innerHTML = `
        <div class="w-full space-y-2">
            <div class="h-2 bg-gray-700 rounded w-full animate-pulse"></div>
            <div class="h-2 bg-gray-700 rounded w-5/6 animate-pulse"></div>
        </div>
    `;

  if (currentInsightAbortController) {
    currentInsightAbortController.abort();
  }
  currentInsightAbortController = new AbortController();

  const timeLabels = {
    daily: "Hari Ini",
    weekly: "Minggu Ini",
    monthly: "Bulan Ini",
    yearly: "Tahun Ini",
    all: "Semua Masa",
  };
  const timeframe = timeLabels[filterType] || "Semua Masa";

  const bgPrompt = `Sebagai penganalisis perniagaan Dinspire, berikan rumusan eksekutif yang sangat padat (maksimum 3 ayat pendek) berdasarkan data ${timeframe} ini: Jumlah Keseluruhan Jualan RM${totalSales}, Jumlah Pelanggan Servis ${totalServis} (Pecahan -> Walk-in: ${walkin}, Booking: ${booking}, Rawatan: ${rawatan}, OnCall: ${oncall}). Nyatakan sama ada prestasi baik/buruk secara ringkas, dan selitkan satu nasihat operasi ringkas. Terus kepada inti pati, jangan guna tajuk besar.`;

  if (insightDebounceTimer) clearTimeout(insightDebounceTimer);
  insightDebounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/ai-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ prompt: bgPrompt }),
      signal: currentInsightAbortController.signal,
    });
    const data = await res.json();

    if (data.status === "success") {
      document.getElementById("ai-insights-status").innerHTML =
        '<i class="fas fa-check-circle md:mr-1"></i><span class="hidden md:inline"> Selesai</span>';
      document.getElementById("ai-insights-status").className =
        "text-[10px] text-emerald-400 font-bold tracking-widest uppercase bg-emerald-900/50 px-2 py-0.5 md:py-1 rounded-full border border-emerald-500/30 whitespace-nowrap";

      let displayText = data.response;
      try {
        const parsed = JSON.parse(data.response);
        if (parsed.text) displayText = parsed.text;
      } catch (e) {}

      document.getElementById("ai-insights-content").innerHTML =
        marked.parse(displayText);
    } else {
      throw new Error(data.message || "Gagal mendapat analisis");
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    document.getElementById("ai-insights-status").innerHTML =
      '<i class="fas fa-exclamation-triangle mr-1"></i> Ralat';
    document.getElementById("ai-insights-status").className =
      "text-[9px] md:text-[10px] text-rose-400 font-bold tracking-widest uppercase bg-rose-900/50 px-2 py-1 rounded-full border border-rose-500/30 whitespace-nowrap";
    document.getElementById("ai-insights-content").innerHTML =
      `<p class="text-rose-400 text-xs md:text-sm font-semibold break-words whitespace-normal">Ralat: ${escapeHTML(err.message)}</p>`;
  }
  }, 1000);
}

window.addEventListener("DOMContentLoaded", () => {
  applyLanguage();
  adjustAILayout();
});

function renderBranchTable(stats) {
  const tbody = document.getElementById("table-branches");
  const sorted = Object.keys(stats).sort(
    (a, b) => stats[b].sales - stats[a].sales,
  );
  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-400 italic" data-i18n="table-no-record">${i18n[currentLang]["table-no-record"] || "Tiada Rekod"}</td></tr>`;
    return;
  }
  tbody.innerHTML = sorted
    .map(
      (k) =>
        `<tr class="hover:bg-gray-50 border-b border-gray-100"><td class="py-3 px-2 font-bold text-gray-800">${escapeHTML(k)}</td><td class="py-3 px-2 text-center text-gray-600 font-semibold">${stats[k].count}</td><td class="py-3 px-2 text-right font-black text-gray-900">RM ${stats[k].sales.toFixed(2)}</td></tr>`,
    )
    .join("");
}
function renderStaffTable(stats) {
  const tbody = document.getElementById("table-staff");
  const sortedStaff = Object.keys(stats).sort(
    (a, b) => stats[b].sales - stats[a].sales,
  );
  if (sortedStaff.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-400 italic" data-i18n="table-no-record">${i18n[currentLang]["table-no-record"] || "Tiada Rekod"}</td></tr>`;
    return;
  }
  tbody.innerHTML = sortedStaff
    .map(
      (name) => {
        const comm = stats[name].sales * (masterData.commissionPercent / 100);
        return `<tr class="hover:bg-gray-50 border-b border-gray-100"><td class="py-3 px-2 font-bold text-gray-800 flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">${escapeHTML(name).charAt(0)}</div>${escapeHTML(name)}</td><td class="py-3 px-2 text-center text-gray-600 font-semibold">${stats[name].count}</td><td class="py-3 px-2 text-right font-black text-gray-900">RM ${stats[name].sales.toFixed(2)}</td><td class="py-3 px-2 text-right font-black text-blue-600">RM ${comm.toFixed(2)}</td></tr>`;
      }
    )
    .join("");
}

function renderAttendanceTable(punchList) {
  let stats = {};
  punchList.forEach((p) => {
    if (!p.waktu_in || !p.waktu_out) return;
    const name = p.nama || (p.staff ? p.staff.username : "Unknown");
    if (!stats[name]) stats[name] = 0;

    let inParts = p.waktu_in.split(":");
    let outParts = p.waktu_out.split(":");
    let dIn = new Date();
    dIn.setHours(inParts[0], inParts[1], inParts[2] || 0);
    let dOut = new Date();
    dOut.setHours(outParts[0], outParts[1], outParts[2] || 0);

    let diffHours = (dOut - dIn) / (1000 * 60 * 60);
    if (diffHours < 0) diffHours += 24; // in case overnight

    stats[name] += diffHours;
  });

  const tbody = document.getElementById("table-attendance");
  if (!tbody) return;
  const sorted = Object.keys(stats).sort((a, b) => stats[b] - stats[a]);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" class="py-4 text-center text-gray-400 italic text-xs" data-i18n="table-no-record">${i18n[currentLang]["table-no-record"] || "Tiada Rekod"}</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  sorted.forEach((name) => {
    let hrs = Math.floor(stats[name]);
    let mins = Math.round((stats[name] - hrs) * 60);
    let timeStr = `${hrs}h ${mins}m`;
    let initial = name.charAt(0).toUpperCase();
    let html = `
            <tr class="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                <td class="py-3 px-2 font-semibold text-gray-900 flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">${escapeHTML(initial)}</div>
                    ${escapeHTML(name)}
                </td>
                <td class="py-3 px-2 text-right font-bold text-gray-900">${timeStr}</td>
            </tr>
        `;
    tbody.insertAdjacentHTML("beforeend", html);
  });
}

function renderCashTable(stats) {
  const tbody = document.getElementById("table-cash");
  const sortedStaff = Object.keys(stats)
    .filter((k) => stats[k].cash > 0)
    .sort((a, b) => stats[b].cash - stats[a].cash);
  if (sortedStaff.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-gray-400 italic" data-i18n="table-no-record">${i18n[currentLang]["table-no-record"] || "Tiada Rekod"}</td></tr>`;
    return;
  }
  
  tbody.innerHTML = "";
  sortedStaff.forEach((name) => {
    let initial = name.charAt(0).toUpperCase();
    let html = `
            <tr class="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                <td class="py-3 px-2 font-semibold text-gray-900 flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">${escapeHTML(initial)}</div>
                    ${escapeHTML(name)}
                </td>
                <td class="py-3 px-2 text-right font-bold text-gray-900">RM ${stats[name].cash.toFixed(2)}</td>
            </tr>
        `;
    tbody.insertAdjacentHTML("beforeend", html);
  });
}

function renderTxServisTable(bookings) {
  const tbody = document.getElementById("table-tx-servis");
  let data = [...bookings].sort(
    (a, b) => Date.parse(b.Timestamp || b.Date) - Date.parse(a.Timestamp || a.Date),
  );
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td class="text-center py-6 text-gray-400 italic text-xs" data-i18n="table-no-record">${i18n[currentLang]["table-no-record"] || "Tiada Rekod"}</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((b, index) => {
      let d = b.Timestamp ? new Date(b.Timestamp) : new Date(b.Date);
      let tFormat = "";
      if (!isNaN(d)) {
        const months = [
          "Jan",
          "Feb",
          "Mac",
          "Apr",
          "Mei",
          "Jun",
          "Jul",
          "Ogo",
          "Sep",
          "Okt",
          "Nov",
          "Dis",
        ];
        tFormat = `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}, ${b.Time || ""}`;
      } else {
        tFormat = b.Date + " " + (b.Time || "");
      }

      let typeStr = b.Type || "Booking";
      let badge =
        typeStr.toLowerCase().includes("walk") || b.Category === "Walk-In"
          ? "bg-purple-100 text-purple-700"
          : "bg-gray-200 text-gray-700";
      let btn =
        b.ReceiptLink && b.ReceiptLink.includes("http")
          ? `<button onclick="event.stopPropagation(); openReceiptModal('${b.ReceiptLink}')" class="mt-2 bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold w-full transition shadow-sm">Lihat Resit</button>`
          : "";

      return `
        <tr class="block w-full !bg-white border border-gray-100 rounded-lg mb-1.5 shadow-sm hover:shadow-md transition">
            <td class="block w-full p-0">
                <div class="px-3 py-1.5 cursor-pointer" onclick="document.getElementById('det-s-${index}').classList.toggle('hidden')">
                    <div class="text-[9px] text-gray-400 mb-0.5 leading-none tracking-wide">${tFormat}</div>
                    <div class="flex justify-between items-center mt-0.5">
                        <div class="max-w-[70%] text-left">
                            <div class="text-[12px] text-gray-800 uppercase font-bold leading-none">${escapeHTML(b.Username || "PELANGGAN")}</div>
                            <div class="text-[10px] text-gray-400 mt-1 leading-none truncate">${escapeHTML(b.ServiceName || "-")}</div>
                        </div>
                        <div class="text-right flex flex-col justify-center">
                            <div class="text-[12px] font-semibold text-blue-600 tracking-wide leading-none">+RM ${(parseFloat(b.Price) || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div id="det-s-${index}" class="hidden bg-gray-50 px-3 py-2 text-xs text-gray-700 border-t border-gray-100 rounded-b-lg">
                    <div class="mb-2"><span class="px-2 py-0.5 rounded text-[8px] font-bold ${badge} uppercase tracking-wider">${escapeHTML(b.Category)}</span></div>
                    <div class="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">No. Order</span><span class="font-bold text-gray-900">${escapeHTML(b.OrderNo || "-")}</span></div>
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Barber</span><span class="font-bold text-gray-900">${escapeHTML(b.Barber || "-")}</span></div>
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Cara Bayaran</span><span class="font-bold text-gray-900">${escapeHTML(typeStr)}</span></div>
                    </div>
                    ${btn}
                </div>
            </td>
        </tr>`;
    })
    .join("");
}

function renderTxProdukTable(orders) {
  const tbody = document.getElementById("table-tx-produk");
  let data = [...orders].sort(
    (a, b) => Date.parse(b.Timestamp) - Date.parse(a.Timestamp),
  );
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td class="text-center py-6 text-gray-400 italic text-xs" data-i18n="table-no-record">${i18n[currentLang]["table-no-record"] || "Tiada Rekod"}</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((o, index) => {
      let rawItems = o.Items || o.senarai_produk;
      let pNames = [];
      try {
        let itm =
          typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;
        for (let k in itm) pNames.push(`${itm[k].name} (x${itm[k].qty})`);
      } catch (e) {}
      let timestampVal = o.Timestamp || o.created_at;
      let d = new Date(timestampVal);
      let tFormat = "";
      if (!isNaN(d)) {
        const months = [
          "Jan",
          "Feb",
          "Mac",
          "Apr",
          "Mei",
          "Jun",
          "Jul",
          "Ogo",
          "Sep",
          "Okt",
          "Nov",
          "Dis",
        ];
        tFormat = `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      } else {
        tFormat = o.Timestamp;
      }

      let rLink = o.ReceiptLink || o.resit;
      let btn =
        rLink && rLink.includes("http")
          ? `<button onclick="event.stopPropagation(); openReceiptModal('${rLink}')" class="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold w-full transition shadow-sm mt-2">Lihat Resit</button>`
          : "";

      let stat = o.Status || o.status || "Baru";
      let orderId = o.FullId || o.id;
      let badgeColor =
        stat === "Pending Verification" 
          ? "bg-yellow-100 text-yellow-800"
          : stat === "Rejected"
            ? "bg-red-100 text-red-700"
            : stat === "Preparing" || stat === "Baru" || stat === "Belum"
              ? "bg-orange-100 text-orange-700"
              : stat === "Shipped"
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700";

      let actionArea = "";
      if (stat === "Pending Verification") {
        actionArea = `<div class="mt-3 flex gap-2 w-full" onclick="event.stopPropagation()">
            <button onclick="verifyProductPayment('${orderId}', 'approve')" class="flex-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm whitespace-nowrap">Approve</button>
            <button onclick="verifyProductPayment('${orderId}', 'reject')" class="flex-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm whitespace-nowrap">Reject</button>
        </div>`;
      } else if (stat === "Rejected") {
        actionArea = `<div class="mt-3 flex w-full" onclick="event.stopPropagation()">
            <button onclick="verifyProductPayment('${orderId}', 'approve')" class="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm whitespace-nowrap">Undo Reject</button>
        </div>`;
      } else if (stat === "Preparing" || stat === "Baru" || stat === "Belum") {
        actionArea = `<div class="mt-3 flex flex-wrap gap-2 items-center" onclick="event.stopPropagation()">
                 <input type="text" id="track-${orderId}" placeholder="No Tracking" class="flex-1 border border-gray-300 px-3 py-1.5 text-xs rounded-lg min-w-[120px] outline-none focus:border-blue-500 shadow-sm">
                 <button onclick="updateTracking('${orderId}')" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 font-bold shadow-sm whitespace-nowrap">Kemas Kini</button>
               </div>`;
      }

      return `
        <tr class="block w-full !bg-white border border-gray-100 rounded-lg mb-1.5 shadow-sm hover:shadow-md transition">
            <td class="block w-full p-0">
                <div class="px-3 py-1.5 cursor-pointer" onclick="document.getElementById('det-p-${index}').classList.toggle('hidden')">
                    <div class="text-[9px] text-gray-400 mb-0.5 leading-none tracking-wide">${tFormat}</div>
                    <div class="flex justify-between items-center mt-0.5">
                        <div class="max-w-[70%] text-left">
                            <div class="text-[12px] text-gray-800 uppercase font-bold leading-none">${escapeHTML(o.User || o.nama_pembeli || "PELANGGAN")}</div>
                            <div class="text-[10px] text-gray-400 mt-1 leading-none truncate">${escapeHTML(pNames.join(", ") || "Pesanan Produk")}</div>
                        </div>
                        <div class="text-right flex flex-col justify-center">
                            <div class="text-[12px] font-semibold text-blue-600 tracking-wide leading-none">+RM ${(parseFloat(o._calculatedTotal) || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div id="det-p-${index}" class="hidden bg-gray-50 px-3 py-2 text-xs text-gray-700 border-t border-gray-100 rounded-b-lg">
                    <div class="mb-2 flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[8px] font-bold ${badgeColor} uppercase tracking-wider">Status: ${escapeHTML(stat)}</span></div>
                    <div class="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">No. Order</span><span class="font-bold text-gray-900">#${escapeHTML(o.OrderNo || String(o.id).substring(0, 8).toUpperCase() || "-")}</span></div>
                        <div class="col-span-2"><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Alamat Penghantaran</span><span class="font-bold text-gray-900 whitespace-normal leading-relaxed">${escapeHTML(o.Address || o.lokasi_penghantaran || "-")}</span></div>
                    </div>
                    ${actionArea}
                    ${btn}
                </div>
            </td>
        </tr>`;
    })
    .join("");
}

async function updateTracking(fullOrderId) {
  const inputEl = document.getElementById("track-" + fullOrderId);
  const trackingNo = inputEl ? inputEl.value.trim() : "";

  if (!trackingNo)
    return alert(
      "Sila masukkan Nombor Tracking yang sah di dalam kotak teks bersebelahan butang Kemas Kini.",
    );

  try {
    const res = await fetch(
      `${API_BASE_URL}/bookings/products/${fullOrderId}/ship`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tracking_no: trackingNo }),
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      alert(
        "Berjaya! Pesanan telah ditukar ke status 'Shipped'.\nPelanggan akan menerima notifikasi ini.",
      );
      fetchOwnerDashboardData();
    } else {
      alert("Ralat: " + data.message);
    }
  } catch (e) {
    alert("Ralat pelayan. Sila cuba lagi.");
  }
}

// ==========================================
// [BAHARU] VERIFY PRODUCT PAYMENT
// ==========================================
async function verifyProductPayment(orderId, action) {
  if (action === 'reject') {
    if (!confirm("Pasti mahu menolak resit bayaran ini?")) return;
  } else {
    if (!confirm("Sahkan resit dan luluskan tempahan produk ini?")) return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/owner/verify-product-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ order_id: orderId, action: action }),
    });

    const data = await res.json();
    if (data.status === "success") {
      alert(data.message || "Berjaya dikemaskini.");
      fetchOwnerDashboardData(); // Refresh UI
    } else {
      alert("Ralat: " + data.message);
    }
  } catch (err) {
    alert("Ralat pelayan memproses pengesahan.");
  }
}

function renderReviewsTable(reviews) {
  const container = document.getElementById("table-reviews");
  if (reviews.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-gray-400 italic text-sm" data-i18n="table-no-record">${i18n[currentLang]["table-no-record"] || "Tiada Rekod"}</div>`;
    return;
  }

  container.innerHTML =
    '<div class="space-y-4">' +
    reviews
      .map((r) => {
        let orderNo = r.OrderNo || r.no_booking;
        let bInfo = masterData.bookings.find((b) => b.OrderNo === orderNo);
        let barberName = bInfo ? bInfo.Barber : "Barber Tidak Diketahui";
        let branchName = bInfo
          ? mapBarberBranch[bInfo.Barber] || "Cawangan Utama"
          : "-";

        let stars = r.Stars || r.bintang || 5;
        let text = r.Text || r.review_text || "Tiada komen.";
        let dateVal = r.created_at ? new Date(r.created_at).toLocaleDateString("ms-MY") : "Tiada Tarikh";

        return `<div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">${escapeHTML(orderNo || "#")}</span>
                        <span class="text-xs text-gray-500 ml-2"><i class="fas fa-clock"></i> ${escapeHTML(dateVal)}</span>
                        <span class="text-amber-500 text-sm tracking-widest drop-shadow-sm">${"★".repeat(stars)}${"☆".repeat(5 - stars)}</span>
                    </div>
                    <p class="text-sm text-gray-700 mt-3 mb-4 leading-relaxed font-medium">"${escapeHTML(text)}"</p>
                    <div class="flex flex-wrap gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <span class="bg-gray-50 px-2 py-1 rounded border border-gray-100"><i class="fas fa-user-tie mr-1 text-gray-400"></i> ${escapeHTML(barberName)}</span>
                        <span class="bg-gray-50 px-2 py-1 rounded border border-gray-100"><i class="fas fa-map-marker-alt mr-1 text-gray-400"></i> ${escapeHTML(branchName)}</span>
                    </div>
                </div>`;
      })
      .join("") +
    "</div>";
}

function renderPunchTable(punchData) {
  const tbody = document.getElementById("table-punch");
  if (!tbody) return;

  // Kumpul data mengikut cawangan
  let branches = {};
  Object.keys(mapBarberBranch).forEach(name => {
    let br = mapBarberBranch[name];
    if (br === "On-Call") return; // Abaikan staf on-call untuk kehadiran
    if (!branches[br]) branches[br] = { staff: [], punches: [], absents: [] };
    if (!branches[br].staff.includes(name)) branches[br].staff.push(name);
  });

  punchData.sort((a, b) => Date.parse(b.Timestamp || b.created_at || b.tarikh) - Date.parse(a.Timestamp || a.created_at || a.tarikh));

  punchData.forEach(p => {
    let staffName = p["Nama Staf"] || p.nama || (p.staff ? p.staff.username : "") || "-";
    let br = mapBarberBranch[staffName] || "Tidak Ditetapkan";
    if (br === "On-Call") return;
    if (!branches[br]) branches[br] = { staff: [], punches: [], absents: [] };
    branches[br].punches.push(p);
  });

  // Cari staf yang tiada rekod punch
  Object.keys(branches).forEach(br => {
    let punchedStaff = branches[br].punches.map(p => p["Nama Staf"] || p.nama || (p.staff ? p.staff.username : "") || "-");
    branches[br].absents = branches[br].staff.filter(s => !punchedStaff.includes(s));
  });

  let html = "";
  let hasAnyRecord = false;

  Object.keys(branches).sort().forEach(br => {
    let bData = branches[br];
    if (bData.punches.length === 0 && bData.absents.length === 0) return;
    hasAnyRecord = true;

    // Header Cawangan
    html += `<tr class="bg-gray-100 border-y border-gray-200">
        <td colspan="6" class="py-2 px-3 text-xs font-bold text-gray-800 uppercase tracking-wider text-left">
            <i class="fas fa-map-marker-alt text-red-500 mr-1"></i> ${escapeHTML(br)}
        </td>
    </tr>`;

    // Senarai Hadir (Punches)
    bData.punches.forEach(p => {
      let staffName = p["Nama Staf"] || p.nama || (p.staff ? p.staff.username : "") || "-";
      let locStr = p["Lokasi GPS"] || p.lokasi || "";
      let isGmap = locStr.includes("http") || locStr.includes("google.com");
      let locText = locStr;
      if (locText.includes("TIDAK DIBENARKAN") || locText.includes("GAGAL")) locText = "Tiada Akses GPS";
      let gpsBtn = isGmap
        ? `<a href="${escapeHTML(locStr)}" target="_blank" class="text-blue-600 font-bold text-[10px] md:text-xs hover:underline">Lihat Peta</a>`
        : `<span class="text-[9px] text-gray-400 font-bold leading-tight truncate w-[60px] md:w-auto inline-block uppercase" title="${escapeHTML(locStr)}">${escapeHTML(locText || "N/A")}</span>`;

      let timestampVal = p.Timestamp || p.created_at || p.tarikh;
      let d = new Date(timestampVal);
      let dateFmt = isNaN(d) ? (p.Tarikh || p.tarikh || "-") : d.toLocaleDateString("ms-MY");
      
      let waktuIn = p.waktu_in || "-";
      let waktuOut = p.waktu_out || "-";
      let tempoh = "-";
      if (p.waktu_in && p.waktu_out) {
         let tIn = new Date(`1970-01-01T${p.waktu_in}Z`);
         let tOut = new Date(`1970-01-01T${p.waktu_out}Z`);
         let diff = (tOut - tIn) / 1000;
         if (diff > 0) {
            let h = Math.floor(diff / 3600);
            let m = Math.floor((diff % 3600) / 60);
            tempoh = `${h}j ${m}m`;
         }
      }

      html += `<tr class="hover:bg-gray-50 border-b border-gray-50">
            <td class="py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-600 whitespace-nowrap text-center">${escapeHTML(dateFmt)}</td>
            <td class="py-3 px-2 md:px-4 text-xs md:text-sm font-bold text-gray-900 whitespace-nowrap text-center">${escapeHTML(staffName)}</td>
            <td class="py-3 px-2 md:px-4 text-[10px] md:text-xs font-bold text-green-600 whitespace-nowrap text-center">${escapeHTML(waktuIn)}</td>
            <td class="py-3 px-2 md:px-4 text-[10px] md:text-xs font-bold text-red-600 whitespace-nowrap text-center">${escapeHTML(waktuOut)}</td>
            <td class="py-3 px-2 md:px-4 text-[10px] md:text-xs font-bold text-blue-600 whitespace-nowrap text-center">${escapeHTML(tempoh)}</td>
            <td class="py-3 px-2 md:px-4 text-center whitespace-nowrap">${gpsBtn}</td>
        </tr>`;
    });

    // Senarai Tidak Hadir (Absents)
    bData.absents.forEach(staffName => {
      html += `<tr class="bg-red-50/30 hover:bg-red-50 border-b border-red-100">
            <td class="py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-400 whitespace-nowrap text-center">-</td>
            <td class="py-3 px-2 md:px-4 text-xs md:text-sm font-bold text-red-600 whitespace-nowrap text-center">${escapeHTML(staffName)}</td>
            <td colspan="3" class="py-3 px-2 md:px-4 text-center whitespace-nowrap"><span class="badge-in-out bg-red-100 text-red-700 border border-red-200">TIDAK HADIR</span></td>
            <td class="py-3 px-2 md:px-4 text-center whitespace-nowrap text-gray-400 font-bold">-</td>
        </tr>`;
    });
  });

  if (!hasAnyRecord) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-gray-400 italic" data-i18n="table-no-record">${i18n[currentLang] && i18n[currentLang]["table-no-record"] ? i18n[currentLang]["table-no-record"] : "Tiada Rekod"}</td></tr>`;
  } else {
    tbody.innerHTML = html;
  }
}

function renderLeavesTable(leavesData) {
  const tbody = document.getElementById("table-leaves");
  if (!tbody) return;

  // Kumpul data mengikut cawangan
  let branches = {};
  leavesData.sort((a, b) => Date.parse(b.tarikh) - Date.parse(a.tarikh));

  leavesData.forEach(l => {
    let staffName = l.staff ? l.staff.username : "-";
    let br = mapBarberBranch[staffName] || "Tidak Ditetapkan";
    if (!branches[br]) branches[br] = [];
    branches[br].push(l);
  });

  let html = "";
  let hasAnyRecord = false;

  Object.keys(branches).sort().forEach(br => {
    hasAnyRecord = true;
    // Header Cawangan
    html += `<tr class="bg-gray-100 border-y border-gray-200">
        <td colspan="3" class="py-2 px-3 text-xs font-bold text-gray-800 uppercase tracking-wider text-left">
            <i class="fas fa-map-marker-alt text-red-500 mr-1"></i> ${escapeHTML(br)}
        </td>
    </tr>`;

    branches[br].forEach(l => {
      let staffName = l.staff ? l.staff.username : "-";
      let dateObj = parseGSDate(l.tarikh);
      let dateFmt = dateObj ? dateObj.toLocaleDateString("ms-MY", { day: '2-digit', month: 'short', year: 'numeric' }) : l.tarikh;
      
      html += `<tr class="hover:bg-gray-50 border-b border-gray-50">
            <td class="py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-600 whitespace-nowrap text-center">${escapeHTML(dateFmt)}</td>
            <td class="py-3 px-2 md:px-4 text-xs md:text-sm font-bold text-gray-900 whitespace-nowrap text-center">${escapeHTML(staffName)}</td>
            <td class="py-3 px-2 md:px-4 text-center whitespace-nowrap"><span class="badge-in-out badge-out">Cuti Rehat</span></td>
        </tr>`;
    });
  });

  if (!hasAnyRecord) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-gray-400 italic" data-i18n="table-no-record">${i18n[currentLang] && i18n[currentLang]["table-no-record"] ? i18n[currentLang]["table-no-record"] : "Tiada Rekod"}</td></tr>`;
  } else {
    tbody.innerHTML = html;
  }
}

function initChart() {
  const ctx1 = document.getElementById("salesChart").getContext("2d");
  salesChartObj = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Total Jualan (RM)",
          data: [],
          backgroundColor: "#111827",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#f3f4f6" },
          border: { display: false },
        },
        x: { grid: { display: false }, border: { display: false } },
      },
    },
  });

  const ctx2 = document.getElementById("demoChart").getContext("2d");
  demoChartObj = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: ["Gunting", "Rawatan", "OnCall"],
      datasets: [
        { data: [0, 0, 0], backgroundColor: ["#111827", "#6b7280", "#d1d5db"] },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      cutout: "65%",
    },
  });

  const ctx3 = document.getElementById("payChart").getContext("2d");
  payChartObj = new Chart(ctx3, {
    type: "doughnut",
    data: {
      labels: ["Tunai (Cash)", "QR/Online", "Lain"],
      datasets: [
        { data: [0, 0, 0], backgroundColor: ["#111827", "#6b7280", "#d1d5db"] },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      cutout: "65%",
    },
  });

  const ctx4 = document.getElementById("staffChart").getContext("2d");
  staffChartObj = new Chart(ctx4, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            "#111827",
            "#374151",
            "#4b5563",
            "#6b7280",
            "#9ca3af",
            "#d1d5db",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right", labels: { boxWidth: 10 } } },
      cutout: "65%",
    },
  });



  const ctx6 = document.getElementById("branchLineChart");
  if (ctx6) {
    branchLineChartObj = new Chart(ctx6.getContext("2d"), {
      type: "line",
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            position: "top", 
            labels: { boxWidth: 10 },
            onClick: (e, legendItem, legend) => {
              const idx = legendItem.datasetIndex;
              const chart = legend.chart;
              chart.data.datasets.forEach((ds, i) => {
                if (i === idx) {
                  ds.borderColor = ds.customActiveColor;
                  ds.backgroundColor = ds.customActiveGradient;
                  ds.borderWidth = 3;
                  ds.order = 0;
                } else {
                  ds.borderColor = ds.customInactiveColor;
                  ds.backgroundColor = ds.customInactiveGradient;
                  ds.borderWidth = 2;
                  ds.order = 1;
                }
              });
              chart.update();
            }
          } 
        },
        onClick: (e, activeElements, chart) => {
          if (activeElements.length > 0) {
            let idx = activeElements[0].datasetIndex;
            chart.data.datasets.forEach((ds, i) => {
              if (i === idx) {
                ds.borderColor = ds.customActiveColor;
                ds.backgroundColor = ds.customActiveGradient;
                ds.borderWidth = 3;
                ds.order = 0;
              } else {
                ds.borderColor = ds.customInactiveColor;
                ds.backgroundColor = ds.customInactiveGradient;
                ds.borderWidth = 2;
                ds.order = 1;
              }
            });
            chart.update();
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      },
    });
  }
}

function updateBarChart(bookings, orders, filterType) {
  let labels = [];
  let dataPoints = [];
  let bgColors = [];
  const now = currentReferenceDate;

  // Sediakan penjejak data cawangan
  let branchDataPoints = {};
  Object.values(mapBarberBranch).forEach(br => {
    if (!branchDataPoints[br]) branchDataPoints[br] = [];
  });
  // Pastikan cawangan utama/In-Branch ada kalau tiada dalam map
  if (!branchDataPoints["In-Branch"]) branchDataPoints["In-Branch"] = [];

  if (filterType === "daily") {
    for (let i = 0; i < 24; i++) {
      labels.push(i.toString().padStart(2, "0") + ":00");
      dataPoints.push(0);
      bgColors.push(i === now.getHours() ? "#111827" : "#d1d5db");
    }
  } else if (filterType === "weekly") {
    labels = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
    dataPoints = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 7; i++) {
      bgColors.push(i === now.getDay() ? "#111827" : "#d1d5db");
    }
  } else if (filterType === "monthly") {
    let daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      labels.push(i.toString());
      dataPoints.push(0);
      bgColors.push(i === now.getDate() ? "#111827" : "#d1d5db");
    }
  } else if (filterType === "yearly") {
    labels = [
      "Jan",
      "Feb",
      "Mac",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ogo",
      "Sep",
      "Okt",
      "Nov",
      "Dis",
    ];
    dataPoints = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 12; i++) {
      bgColors.push(i === now.getMonth() ? "#111827" : "#d1d5db");
    }
  } else {
    labels = ["Semua Data"];
    dataPoints = [0];
    bgColors = ["#111827"];
  }

  // Isi data kosong untuk setiap cawangan mengikut panjang paksi X
  Object.keys(branchDataPoints).forEach(br => {
    branchDataPoints[br] = new Array(labels.length).fill(0);
  });

  const addAmount = (dateStr, timeStr, amount, branch = "In-Branch") => {
    let d;
    if (
      dateStr &&
      timeStr &&
      typeof dateStr === "string" &&
      dateStr.includes("-") &&
      timeStr.includes(":")
    ) {
      d = new Date(
        `${dateStr}T${timeStr.length === 5 ? timeStr + ":00" : timeStr}`,
      );
    } else {
      d = parseGSDate(dateStr);
    }
    if (!d || isNaN(d.getTime())) return;

    let idx = -1;
    if (filterType === "daily") {
      let hour = d.getHours();
      if (hour >= 0 && hour < 24) idx = hour;
    } else if (filterType === "weekly") {
      let day = d.getDay();
      idx = day;
    } else if (filterType === "monthly") {
      let dateNum = d.getDate();
      if (dateNum >= 1 && dateNum <= dataPoints.length) idx = dateNum - 1;
    } else if (filterType === "yearly") {
      let month = d.getMonth();
      if (month >= 0 && month < 12) idx = month;
    } else {
      idx = 0;
    }

    if (idx !== -1) {
      dataPoints[idx] += amount;
      if (branchDataPoints[branch]) {
        branchDataPoints[branch][idx] += amount;
      }
    }
  };

  bookings.forEach((b) => {
    let br = mapBarberBranch[b.Barber] || "In-Branch";
    addAmount(b.Date || b.Timestamp, b.Time, parseFloat(b.Price) || 0, br);
  });
  orders.forEach((o) => addAmount(o.Timestamp, null, o._calculatedTotal || 0, "In-Branch"));

  salesChartObj.data.labels = labels;
  salesChartObj.data.datasets[0].data = dataPoints;
  salesChartObj.data.datasets[0].backgroundColor = bgColors;
  animateChartWhenVisible(salesChartObj, "salesChart");

  if (branchLineChartObj) {
    branchLineChartObj.data.labels = labels;
    let datasets = [];
    let colorIndex = 0;
    
    const ctxChart = document.getElementById("branchLineChart").getContext("2d");
    
    // Gradients for black (active) and gray (inactive)
    let activeGradient = ctxChart.createLinearGradient(0, 0, 0, 300);
    activeGradient.addColorStop(0, `rgba(17, 24, 39, 0.5)`);
    activeGradient.addColorStop(1, `rgba(17, 24, 39, 0.0)`);
    
    let inactiveGradient = ctxChart.createLinearGradient(0, 0, 0, 300);
    inactiveGradient.addColorStop(0, `rgba(209, 213, 219, 0.5)`);
    inactiveGradient.addColorStop(1, `rgba(209, 213, 219, 0.0)`);

    Object.keys(branchDataPoints).forEach(br => {
      // Abaikan cawangan On-Call
      if (br.toLowerCase().includes("on-call") || br.toLowerCase().includes("oncall")) return;

      let isFirst = (colorIndex === 0);
      let baseColor = isFirst ? "#111827" : "#d1d5db";
      let gradient = isFirst ? activeGradient : inactiveGradient;

      datasets.push({
        label: br,
        data: branchDataPoints[br],
        borderColor: baseColor,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        borderWidth: isFirst ? 3 : 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        order: isFirst ? 0 : 1,
        customActiveColor: "#111827",
        customInactiveColor: "#d1d5db",
        customActiveGradient: activeGradient,
        customInactiveGradient: inactiveGradient
      });
      colorIndex++;
    });

    branchLineChartObj.data.datasets = datasets;
    animateChartWhenVisible(branchLineChartObj, "branchLineChart");
  }
}

function openReceiptModal(link) {
  document.getElementById("receipt-image").src = link;
  document.getElementById("receipt-drive-link").href = link;
  document.getElementById("receipt-modal").classList.remove("hidden");
  document.getElementById("receipt-modal").classList.add("flex");
}
function closeReceiptModal() {
  document.getElementById("receipt-modal").classList.add("hidden");
  document.getElementById("receipt-modal").classList.remove("flex");
  document.getElementById("receipt-image").src = "";
  document.getElementById("receipt-drive-link").href = "#";
}

async function askAI(isHidden = false) {
  const promptInput = document.getElementById("ai-prompt");
  const prompt = promptInput.value ? promptInput.value.trim() : "";
  if (!prompt) return;

  const chatBox = document.getElementById("ai-chat-box");
  const sendBtn = document.getElementById("ai-send-btn");

  // UI: Tunjuk soalan pengguna
  if (!isHidden) {
    // [BAHARU] Sembunyikan Animasi 3D apabila mula chat
    const aiBg = document.getElementById("ai-bg-canvas");
    if (aiBg) {
      aiBg.classList.add("opacity-0");
      setTimeout(() => {
        aiBg.style.display = "none";
      }, 700);
    }

    const userMsg = document.createElement("div");
    userMsg.className = "flex gap-2 flex-row-reverse mb-4";
    userMsg.innerHTML = `
            <div class="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1"><i class="fas fa-user text-[10px] text-white"></i></div>
            <div class="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm w-fit max-w-[85%] break-words shadow-md">
                ${escapeHTML(prompt)}
            </div>
        `;
    chatBox.appendChild(userMsg);
    promptInput.value = "";
  }

  // UI: Loading bubble
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "flex gap-2 mb-4";
  loadingMsg.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1"><i class="fas fa-brain text-[10px] text-white"></i></div>
        <div class="bg-gray-800/80 border border-gray-700/50 text-gray-400 px-4 py-3 rounded-2xl rounded-tl-sm w-fit shadow-md flex items-center gap-2">
            <i class="fas fa-circle-notch fa-spin"></i> Sedang berfikir...
        </div>
    `;
  chatBox.appendChild(loadingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  promptInput.disabled = true;
  sendBtn.disabled = true;

  try {
    const timeFilter = document.getElementById("timeFilter").value;
    const res = await fetch(`${API_BASE_URL}/owner/ai-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        prompt,
        activeTab: currentActiveTab,
        timeFilter: timeFilter,
      }),
    });

    const data = await res.json();
    chatBox.removeChild(loadingMsg);

    if (data.status === "success") {
      let aiText = "";
      let aiAction = null;
      let aiTarget = null;

      try {
        // Cuba cari block JSON dari response jika AI letak markdown ```json atau ayat pelik
        let jsonStr = data.response;
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        const parsedResponse = JSON.parse(jsonStr);
        aiText = parsedResponse.text || "Siap bos.";
        aiAction = parsedResponse.action;
        aiTarget = parsedResponse.target;
      } catch (e) {
        // Jika AI tak return JSON atau gagal parse (fallback kepada teks asal)
        aiText = data.response;
      }

      const aiMsg = document.createElement("div");
      aiMsg.className = "flex gap-2 mb-4";
      aiMsg.innerHTML = `
                <div class="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1"><i class="fas fa-brain text-[10px] text-white"></i></div>
                <div class="bg-gray-800/80 border border-gray-700/50 text-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm w-fit break-words shadow-md ai-markdown-content w-full overflow-hidden">
                    ${marked.parse(aiText)}
                </div>
            `;
      chatBox.appendChild(aiMsg);

      // EXECUTE UI CONTROL
      if (aiAction === "SWITCH_TAB" && aiTarget) {
        setTimeout(() => {
          switchTab(aiTarget);
        }, 1500);
      } else if (aiAction === "CHANGE_FILTER" && aiTarget) {
        setTimeout(() => {
          const filterEl = document.getElementById("timeFilter");
          if (filterEl.querySelector(`option[value="${aiTarget}"]`)) {
            filterEl.value = aiTarget;
            processData();
          }
        }, 1000);
      } else if (aiAction === "SHOW_CHART" && aiTarget) {
        setTimeout(() => {
          let chartId = "";
          if (aiTarget === "sales") chartId = "salesChart";
          else if (aiTarget === "demo") chartId = "demoChart";
          else if (aiTarget === "pay") chartId = "payChart";
          else if (aiTarget === "staff") chartId = "staffChart";

          if (chartId) {
            const canvas = document.getElementById(chartId);
            if (canvas) {
              // Tukar background chart kepada putih sebelum clone sebab canvas asal transparent
              const tempCanvas = document.createElement("canvas");
              tempCanvas.width = canvas.width;
              tempCanvas.height = canvas.height;
              const ctx = tempCanvas.getContext("2d");
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              ctx.drawImage(canvas, 0, 0);

              const imgData = tempCanvas.toDataURL("image/png");

              const chartMsg = document.createElement("div");
              chartMsg.className = "flex gap-2 mb-4 mt-2";
              chartMsg.innerHTML = `
                                <div class="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1 opacity-0"><i class="fas fa-brain text-[10px] text-white"></i></div>
                                <div class="bg-gray-100 p-2 rounded-2xl shadow-inner border border-gray-200">
                                    <img src="${imgData}" class="w-full max-w-[250px] rounded-lg">
                                </div>
                            `;
              chatBox.appendChild(chartMsg);
              chatBox.scrollTop = chatBox.scrollHeight;
            }
          }
        }, 800);
      }
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    if (chatBox.contains(loadingMsg)) chatBox.removeChild(loadingMsg);
    const errorMsg = document.createElement("div");
    errorMsg.className = "flex gap-2 mb-4";
    errorMsg.innerHTML = `
            <div class="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center shrink-0 mt-1"><i class="fas fa-exclamation-triangle text-[10px] text-white"></i></div>
            <div class="bg-rose-900/50 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl rounded-tl-sm w-fit break-words shadow-md text-xs font-bold">
                Ralat: ${escapeHTML(err.message || "Gagal menghubungi pelayan AI.")}
            </div>
        `;
    chatBox.appendChild(errorMsg);
  } finally {
    promptInput.disabled = false;
    sendBtn.disabled = false;
    if (!isHidden) promptInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// ==========================================
// [BAHARU] LOGIK RESIZE (LARAS LEBAR) WIDGET AI
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const aiDrawer = document.getElementById("ai-right-drawer");
  const resizeHandle = document.getElementById("ai-resize-handle");
  let isResizing = false;

  if (resizeHandle && aiDrawer) {
    resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      document.body.style.cursor = "col-resize";
      e.preventDefault(); // Elak teks terserlah (highlight) semasa ditarik
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      // Lebar baru = Lebar skrin (window) tolak posisi X tetikus
      let newWidth = window.innerWidth - e.clientX;

      // Tetapkan had minima dan maksima supaya tidak terlalu kecil/besar
      if (newWidth < 300) newWidth = 300;
      if (newWidth > window.innerWidth * 0.8)
        newWidth = window.innerWidth * 0.8;
      if (newWidth > 900) newWidth = 900;

      aiDrawer.style.width = newWidth + "px";
    });

    document.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "default";
      }
    });
  }
});

// ==========================================
// PENGURUSAN CUTI KECEMASAN
// ==========================================
function renderEmergencyLeavesTable(leavesData) {
  const tbody = document.getElementById("table-emergency-leaves");
  if (!tbody) return;

  // Filter ONLY 'Pending' & 'Kecemasan'
  let emergencyLeaves = leavesData.filter(l => l.jenis_cuti === 'Kecemasan' && l.status === 'Pending');
  emergencyLeaves.sort((a, b) => Date.parse(a.tarikh) - Date.parse(b.tarikh));

  let html = "";
  if (emergencyLeaves.length === 0) {
    html = `<tr><td colspan="5" class="text-center py-6 text-gray-400 italic">Tiada permohonan Cuti Kecemasan baharu</td></tr>`;
  } else {
    const monthNames = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
    emergencyLeaves.forEach(l => {
      let staffName = l.staff ? l.staff.name || l.staff.username : "-";
      let dateObj = parseGSDate(l.tarikh);
      let dFmt = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      
      html += `<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td class="py-3 px-2 md:px-4 text-center font-medium text-gray-800">${dFmt}</td>
          <td class="py-3 px-2 md:px-4 text-center text-gray-600">${escapeHTML(staffName)}</td>
          <td class="py-3 px-2 md:px-4 text-center text-gray-600">${escapeHTML(l.sebab || '-')}</td>
          <td class="py-3 px-2 md:px-4 text-center text-yellow-600 font-bold">Menunggu</td>
          <td class="py-3 px-2 md:px-4">
            <div class="flex flex-col md:flex-row items-center justify-center gap-2">
              <button onclick="approveEmergencyLeave('${l.id}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-md text-xs font-bold w-full md:w-auto shadow-sm transition-all"><i class="fas fa-check mr-1"></i> Lulus</button>
              <button onclick="rejectEmergencyLeave('${l.id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-xs font-bold w-full md:w-auto shadow-sm transition-all"><i class="fas fa-times mr-1"></i> Tolak</button>
            </div>
          </td>
      </tr>`;
    });
  }
  tbody.innerHTML = html;
}

async function approveEmergencyLeave(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/owner/approve-emergency-leave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ leave_id: id, action: 'Approve' }),
    });
    
    const data = await res.json();
    if (res.status === 409) {
      // ADA KONFLIK BOOKING
      handleBookingConflict(data.conflicts, id);
    } else if (data.status === "success") {
      alert("Berjaya! " + data.message);
      fetchOwnerDashboardData();
    } else {
      alert("Ralat! " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Ralat! Gagal menghubungi pelayan.");
  }
}

async function rejectEmergencyLeave(id) {
  if (!confirm("Adakah anda pasti untuk TOLAK cuti kecemasan ini?")) return;

  try {
    const res = await fetch(`${API_BASE_URL}/owner/approve-emergency-leave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ leave_id: id, action: 'Reject' }),
    });
    
    const data = await res.json();
    if (data.status === "success") {
      alert("Ditolak! " + data.message);
      fetchOwnerDashboardData();
    } else {
      alert("Ralat! " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Ralat! Gagal menghubungi pelayan.");
  }
}

let currentConflicts = [];
let currentLeaveId = null;
let currentConflictIndex = 0;

function handleBookingConflict(conflicts, leave_id) {
  currentConflicts = conflicts;
  currentLeaveId = leave_id;
  currentConflictIndex = 0;
  showReassignModal();
}

function showReassignModal() {
  if (currentConflictIndex >= currentConflicts.length) {
    // All conflicts resolved! Force approve the leave.
    closeReassignModal();
    forceApproveLeave();
    return;
  }
  
  const c = currentConflicts[currentConflictIndex];
  let servis = c.type + " - " + c.service;
  
  let modalHtml = `
  <div id="reassignModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center;">
    <div style="background:white; padding:20px; border-radius:10px; width:90%; max-width:400px; text-align:left; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <h3 style="margin-top:0; color:#d32f2f; font-family:sans-serif;">⚠️ Pertembungan Tempahan (${currentConflictIndex + 1}/${currentConflicts.length})</h3>
      <p style="font-size:14px; color:#555; font-family:sans-serif;">Terdapat pertembungan jika cuti diluluskan.</p>
      
      <div style="background:#f9f9f9; padding:10px; border-radius:5px; margin-bottom:15px; border:1px solid #ddd; font-family:sans-serif;">
        <strong>No Tempahan:</strong> ${c.no_booking} <br/>
        <strong>Masa:</strong> ${c.masa} <br/>
        <strong>Servis:</strong> ${servis}
      </div>
      
      <label style="font-size:14px; font-weight:bold; font-family:sans-serif;">Pilih Staf Ganti:</label>
      <select id="reassignStaffSelect" style="width:100%; padding:10px; margin-top:5px; margin-bottom:15px; border-radius:5px; border:1px solid #ccc; font-family:sans-serif;">
  `;
  
  if (c.available_staff && c.available_staff.length > 0) {
    c.available_staff.forEach(s => {
      modalHtml += `<option value="${s.id}">${s.username}</option>`;
    });
    modalHtml += `
      </select>
      <div style="display:flex; justify-content:space-between; gap:10px; font-family:sans-serif;">
        <button onclick="closeReassignModal()" style="flex:1; padding:10px; background:#ccc; border:none; border-radius:5px; cursor:pointer;">Batal Kelulusan</button>
        <button onclick="submitReassign('${c.no_booking}', '${c.table}')" style="flex:1; padding:10px; background:#4CAF50; color:white; border:none; border-radius:5px; cursor:pointer;">Tukar Staf</button>
      </div>
    `;
  } else {
    modalHtml += `
        <option value="">-- Tiada Staf Lapang --</option>
      </select>
      <p style="font-size:13px; color:red; font-family:sans-serif; margin-top:0;">Tiada staf lain yang lapang pada masa ini. Sila batalkan tempahan untuk pelanggan ini.</p>
      <div style="display:flex; justify-content:space-between; gap:10px; font-family:sans-serif;">
        <button onclick="closeReassignModal()" style="flex:1; padding:10px; background:#ccc; border:none; border-radius:5px; cursor:pointer;">Batal Kelulusan</button>
        <button onclick="submitCancelAndWhatsApp('${c.no_booking}', '${c.table}')" style="flex:1; padding:10px; background:#d32f2f; color:white; border:none; border-radius:5px; cursor:pointer;">Batal Tempahan (WhatsApp)</button>
      </div>
    `;
  }
  
  modalHtml += `</div></div>`;
  
  let oldModal = document.getElementById('reassignModal');
  if (oldModal) oldModal.remove();
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeReassignModal() {
  let oldModal = document.getElementById('reassignModal');
  if (oldModal) oldModal.remove();
}

async function submitReassign(no_booking, table_name) {
  const new_staff_id = document.getElementById('reassignStaffSelect').value;
  if (!new_staff_id) return alert("Sila pilih staf ganti.");
  
  try {
    const res = await fetch(`${API_BASE_URL}/owner/reassign-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ no_booking, new_staff_id, table_name }),
    });
    const data = await res.json();
    if (data.status === "success") {
      let b = data.bookingDetails;
      if (b) {
        let text = `Hi ${b.customer_name || b.nama_pelanggan || 'Pelanggan'}, saya dari Dinspire Barbershop. adakah tuan pemilik booking ini:\n`;
        text += `No. Booking: ${b.no_booking}\n`;
        text += `Tarikh: ${b.tarikh}\n`;
        text += `Masa: ${b.masa}\n\n`;
        text += `Sila reply *YA* sekiranya benar dan *TIDAK* sekiranya tidak benar.\n\n`;
        text += `Pelanggan yang dihormati, barber yang anda booking terpaksa *ditukar* daripada ${data.old_barber_name} kepada ${data.new_barber_name} kerana masalah teknikal. Mohon pelanggan untuk menyemak semula details booking anda di bawah:\n`;
        text += `No Booking: ${b.no_booking}\n`;
        text += `Tarikh: ${b.tarikh}\n`;
        text += `Masa: ${b.masa}\n`;
        text += `Barber: ${data.new_barber_name}\n`;
        text += `Cawangan: ${data.cawangan}\n\n`;
        text += `Sila maklum sekiranya ada sebarang masalah :).`;

        let encodedText = encodeURIComponent(text);
        let phone = b.no_phone || "";
        if (phone.startsWith("0")) phone = "6" + phone;
        
        window.open(`https://wa.me/${phone}?text=${encodedText}`, "_blank");
      } else {
        alert("Berjaya tukar staf!");
      }

      currentConflictIndex++;
      showReassignModal();
    } else {
      alert("Ralat: " + data.message);
    }
  } catch(err) {
    alert("Gagal menghubungi pelayan.");
  }
}

async function submitCancelAndWhatsApp(no_booking, table_name) {
  try {
    const res = await fetch(`${API_BASE_URL}/owner/cancel-booking-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ no_booking, table_name }),
    });
    const data = await res.json();
    if (data.status === "success") {
      let b = data.bookingDetails;
      let text = `Hi ${b.customer_name || b.nama_pelanggan || 'Pelanggan'}, saya dari Dinspire Barbershop. adakah tuan pemilik booking ini:\n`;
      text += `No. Booking: ${b.no_booking}\n`;
      text += `Tarikh: ${b.tarikh}\n`;
      text += `Masa: ${b.masa}\n\n`;
      text += `Sila reply *YA* sekiranya benar dan *TIDAK* sekiranya tidak benar.\n\n`;
      text += `Pelanggan yang dihormati, booking anda telah *dibatalkan* kerana masalah teknikal (tiada staf ganti). Mohon pelanggan untuk menetapkan semula booking anda mengikut langkah-langkah di bawah:\n`;
      text += `1. Masuk semula ke link customer.dinspirebarbershop.com\n`;
      text += `2. Pergi ke bahagian notifikasi\n`;
      text += `3. Tekan butang Reset Booking\n`;
      text += `4. Tetapkan semula detail booking anda\n\n`;
      text += `Sila tetapkan semula booking anda dengan kadar segera, Terima Kasih.`;

      let encodedText = encodeURIComponent(text);
      let phone = b.no_phone || "";
      if (phone.startsWith("0")) phone = "6" + phone;
      
      window.open(`https://wa.me/${phone}?text=${encodedText}`, "_blank");
      
      currentConflictIndex++;
      showReassignModal();
    } else {
      alert("Ralat: " + data.message);
    }
  } catch(err) {
    alert("Gagal membatalkan tempahan.");
  }
}

async function forceApproveLeave() {
  try {
    const res = await fetch(`${API_BASE_URL}/owner/approve-emergency-leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ leave_id: currentLeaveId, action: 'Approve' }),
    });
    const data = await res.json();
    if (data.status === "success") {
      alert("Selesai! " + data.message);
      fetchOwnerDashboardData();
    } else {
      alert("Ralat! " + data.message);
    }
  } catch(err) {
    alert("Ralat kelulusan akhir.");
  }
}

// ==========================================
// MARKETING & REVIEWS TAB LOGIC
// ==========================================
function toggleRevTab(tab) {
  document.getElementById("rev-list-view").classList.add("hidden");
  document.getElementById("rev-marketing-view").classList.add("hidden");

  if (tab === "reviews") {
    document.getElementById("rev-list-view").classList.remove("hidden");
  } else if (tab === "marketing") {
    document.getElementById("rev-marketing-view").classList.remove("hidden");
    fetchMarketingData();
  }
}

let marketingCustomers = [];

async function fetchMarketingData() {
  try {
    const res = await fetch(`${API_BASE_URL}/owner/marketing-customers`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch marketing data");
    marketingCustomers = await res.json();
    renderMarketingTable();
  } catch (err) {
    console.error(err);
    document.getElementById("table-marketing").innerHTML = `<div class="text-center p-4 text-red-500">Gagal memuat turun data pelanggan.</div>`;
  }
}

function renderMarketingTable() {
  const container = document.getElementById("table-marketing");
  if (!marketingCustomers || marketingCustomers.length === 0) {
    container.innerHTML = `<div class="text-center p-4 text-gray-500">Tiada rekod pelanggan dijumpai.</div>`;
    return;
  }
  
  let html = `<table class="w-full text-sm text-left">
    <thead class="text-xs text-gray-500 bg-gray-200 sticky top-0 shadow-sm uppercase tracking-wider">
      <tr>
        <th class="py-3 px-4">Nama Pelanggan</th>
        <th class="py-3 px-4">No. Telefon</th>
        <th class="py-3 px-4 text-center">Tindakan</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200 bg-white">`;

  marketingCustomers.forEach((c) => {
    // create whatsapp message
    const linkGrup1 = "https://chat.whatsapp.com/EkfdpBSuTML196bdnSm0QT?s=cl&p=a&ilr=1&amv=0";
    const linkGrup2 = "https://chat.whatsapp.com/IvYFBzcpFr3IEctsrhnhq1?s=cl&p=a&ilr=1&amv=0";
    
    const waText = encodeURIComponent(`Salam sejahtera ${c.name}, kami dari Dinspire Barbershop ingin menjemput anda sertai group WhatsApp rasmi kami untuk promosi terkini!\n\nSila klik salah satu link di bawah:\nGrup 1: ${linkGrup1}\nGrup 2: ${linkGrup2}`);
    const waLink = `https://wa.me/${c.phone}?text=${waText}`;

    html += `<tr class="hover:bg-gray-50 transition border-b border-gray-100">
      <td class="py-3 px-4 font-bold text-gray-800 text-xs sm:text-sm whitespace-normal">${escapeHTML(c.name)} <br/><span class="inline-block mt-1 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-normal">${c.source}</span></td>
      <td class="py-3 px-4 font-semibold text-gray-600 text-xs sm:text-sm whitespace-nowrap">${c.phone}</td>
      <td class="py-3 px-4 text-center">
        <a href="${waLink}" target="_blank" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-sm font-bold transition inline-flex items-center justify-center">
          <i class="fab fa-whatsapp text-sm mr-1"></i> Jemput
        </a>
      </td>
    </tr>`;
  });
  
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function exportMarketingCSV() {
  if (!marketingCustomers || marketingCustomers.length === 0) return alert("Tiada data untuk dieksport.");
  
  let csv = "Nama Pelanggan,No Telefon,Sumber\n";
  marketingCustomers.forEach(c => {
    // Add quotes to escape commas in names
    csv += `"${c.name}","${c.phone}","${c.source}"\n`;
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Senarai_Pemasaran_Pelanggan.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// EXPORT TABLE TO CSV UTILITY
// ==========================================
function exportTableToCSV(tableId, filename) {
  const tbody = document.getElementById(tableId);
  if (!tbody) return alert("Tiada jadual untuk dieksport.");
  const table = tbody.tagName === "TBODY" ? tbody.closest("table") : tbody;
  if (!table) return alert("Tiada jadual untuk dieksport.");

  let csv = [];
  const rows = table.querySelectorAll("tr");
  if (rows.length <= 1) return alert("Tiada rekod untuk dieksport.");

  rows.forEach((row) => {
    let rowData = [];
    const cols = row.querySelectorAll("th, td");
    
    // Check if it's the actions column by inner text
    let skipTindakanIdx = -1;
    
    cols.forEach((col, idx) => {
      let text = (col.innerText || col.textContent).replace(/"/g, '""').replace(/\n/g, " ").trim();
      rowData.push(`"${text}"`);
    });
    if (rowData.length > 0) csv.push(rowData.join(","));
  });

  const csvContent = csv.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportReviewsCSV() {
  if (!masterData.reviews || masterData.reviews.length === 0) return alert("Tiada maklum balas untuk dieksport.");
  let csv = "Tarikh,No Booking,Pelanggan,Cawangan,Barber,Bintang,Komen\n";
  masterData.reviews.forEach(r => {
    const t = parseGSDate(r.created_at);
    const df = `${t.getDate()}/${t.getMonth()+1}/${t.getFullYear()}`;
    const pel = r.customers ? r.customers.username : "-";
    const caw = r.branches ? r.branches.nama_cawangan : "-";
    const sta = r.staff ? r.staff.username : "-";
    const komen = r.ulasan ? r.ulasan.replace(/"/g, '""').replace(/\n/g, " ").trim() : "";
    csv += `"${df}","${r.no_booking}","${pel}","${caw}","${sta}","${r.bintang}","${komen}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Senarai_Maklum_Balas.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}



async function fetchSMSBalance() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/sms-balance`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && data.balance !== undefined) {
        const el = document.getElementById("val-sms-balance");
        if (el) el.innerText = data.balance.toLocaleString();
        if (data.balance >= 0 && data.balance < 500) {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: "warning",
              title: "Baki SMS Rendah",
              text: `Baki kredit ESMS anda hanya tinggal ${data.balance}. Sila tambah nilai segera sebelum kehabisan.`,
              confirmButtonColor: "#a855f7"
            });
          } else {
            alert(`AMARAN! Baki kredit ESMS anda hanya tinggal ${data.balance}. Sila tambah nilai segera sebelum kehabisan.`);
          }
        }
      }
    }
  } catch (e) {
    console.error("Gagal mengambil baki SMS:", e);
  }
}

async function triggerEmailTest() {
  if (!confirm("Sistem akan menjana jadual laporan CSV dan arkib ZIP gambar-gambar resit dari pangkalan data.\n\nProses muat turun akan mengambil masa 1 ke 2 minit bergantung kepada kelajuan internet anda. Teruskan?")) return;
  
  const d = new Date();
  let targetMonth = d.getMonth();
  let targetYear = d.getFullYear();
  if (targetMonth === 0) {
    targetMonth = 12;
    targetYear -= 1;
  }
  
  // Buka tab baharu untuk mulakan proses muat turun arkib (CSV + Imej)
  window.open(`/owner/archive-download.html?month=${targetMonth}&year=${targetYear}`, '_blank');
}

// ==========================================
// [BAHARU] FUNGSI LAPORAN & ARKIB JUALAN
// ==========================================

async function renderReportsTab() {
  const filterType = document.getElementById("timeFilter").value;
  const container = document.getElementById("reports-dynamic-content");
  const actionContainer = document.getElementById("reports-header-action");
  
  if (!container) return;

  container.innerHTML = '<p class="text-gray-500 text-center mt-10">Sila tunggu, sedang memuat turun data laporan...</p>';
  actionContainer.innerHTML = '';

  const targetDate = currentReferenceDate;
  
  if (filterType === "daily" || filterType === "weekly" || filterType === "monthly") {
    // Generate start & end date based on filter
    let startDate, endDate;
    if (filterType === "daily") {
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (filterType === "weekly") {
      const day = targetDate.getDay();
      const diff = targetDate.getDate() - day + (day == 0 ? -6: 1); // adjust when day is sunday
      startDate = new Date(targetDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (filterType === "monthly") {
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      
      // Jika ini adalah bulan lepas atau bulan sebelum tahun semasa,
      // kita tak benarkan view detailed bulan lepas. "data tahun sebelumnya tidak akan disimpan."
      // Tapi untuk bulan tahun semasa, boleh je view.
    }

    try {
      const token = localStorage.getItem("din_token_sys");
      const res = await fetch(`${API_BASE_URL}/owner/reports-data?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&t=${Date.now()}`, {
        credentials: "include"
      });
      const data = await res.json();
      
      if (!data || !data.rawData) {
        container.innerHTML = '<p class="text-red-500 text-center mt-10">Ralat memuatkan data.</p>';
        return;
      }
      
      let tableHTML = `
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 bg-gray-100 sticky top-0 shadow-sm uppercase tracking-wider">
            <tr>
              <th class="py-3 px-4">Kategori</th>
              <th class="py-3 px-4">ID Transaksi / Pelanggan</th>
              <th class="py-3 px-4">Harga (RM)</th>
              <th class="py-3 px-4">Nama Resit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      
      let totalRows = 0;
      Object.keys(data.rawData).forEach(kategori => {
         const list = data.rawData[kategori];
         list.forEach(row => {
            totalRows++;
            tableHTML += `
              <tr class="hover:bg-gray-50 transition">
                <td class="py-3 px-4 whitespace-nowrap"><span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-bold">${kategori}</span></td>
                <td class="py-3 px-4 font-medium text-gray-800">${row.Pelanggan || row.No_Booking || row.No_Tempahan || row.ID}</td>
                <td class="py-3 px-4 font-bold text-green-600">RM ${row.Harga_RM || row.Harga || 0}</td>
                <td class="py-3 px-4 text-gray-500 text-xs">${row.Nama_Resit || '-'}</td>
              </tr>
            `;
         });
      });
      
      if (totalRows === 0) {
        tableHTML += '<tr><td colspan="4" class="text-center py-8 text-gray-400">Tiada rekod dijumpai untuk tarikh ini.</td></tr>';
      }
      
      tableHTML += `</tbody></table>`;
      container.innerHTML = tableHTML;

    } catch (err) {
      console.error(err);
      container.innerHTML = '<p class="text-red-500 text-center mt-10">Gagal menyambung ke pelayan.</p>';
    }

  } else if (filterType === "yearly") {
    // TAHUN INI
    const currentYear = targetDate.getFullYear();
    actionContainer.innerHTML = `<button onclick="downloadYearlyArchive(${currentYear})" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-md"><i class="fas fa-file-archive"></i> Muat Turun ZIP Lengkap Tahunan</button>`;
    
    let html = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
    `;
    const months = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
    months.forEach((m, i) => {
      html += `
        <div onclick="downloadMonthlyZip(${i + 1}, ${currentYear})" class="border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 hover:shadow-md transition">
          <i class="fas fa-folder-open text-3xl text-purple-400 mb-2"></i>
          <span class="font-bold text-gray-700">${m} ${currentYear}</span>
          <span class="text-xs text-purple-600 mt-1"><i class="fas fa-download"></i> Muat Turun ZIP</span>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;

  } else if (filterType === "all") {
    // SEMUA REKOD (Historical Sales)
    try {
      const token = localStorage.getItem("din_token_sys");
      const res = await fetch(`${API_BASE_URL}/owner/historical-years?t=${Date.now()}`, {
        credentials: "include"
      });
      const years = await res.json();
      
      if (!years || years.length === 0) {
         container.innerHTML = '<p class="text-gray-500 text-center mt-10">Tiada arkib tahun-tahun lepas dijumpai.</p>';
         return;
      }
      
      let html = `<div class="w-full flex flex-col gap-3 max-w-2xl mx-auto">`;
      years.forEach(yr => {
         html += `
          <div class="border border-gray-200 rounded-xl p-4 flex justify-between items-center bg-gray-50 shadow-sm hover:shadow-md transition">
            <div class="flex items-center gap-4">
              <div class="bg-blue-100 text-blue-600 p-3 rounded-full"><i class="fas fa-archive"></i></div>
              <div>
                <h4 class="font-bold text-lg text-gray-800">Arkib Mampat ${yr.tahun}</h4>
                <p class="text-xs text-gray-500">Rekod Bulanan Dikompres</p>
              </div>
            </div>
            <button onclick="downloadCompressedArchive(${yr.tahun})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2"><i class="fas fa-download"></i> Muat Turun</button>
          </div>
         `;
      });
      html += `</div>`;
      container.innerHTML = html;
      
    } catch (err) {
      console.error(err);
      container.innerHTML = '<p class="text-red-500 text-center mt-10">Gagal menyambung ke pelayan.</p>';
    }
  }
}

async function downloadMonthlyZip(month, year) {
  showToast(`Sedang menjana ZIP untuk Bulan ${month} Tahun ${year}. Sila tunggu...`);
  
  try {
    const res = await fetch(`${API_BASE_URL}/owner/monthly-archive-data?month=${month}&year=${year}&t=${Date.now()}`, {
      credentials: "include"
    });
    
    if (!res.ok) throw new Error("Gagal mengambil data");
    
    const data = await res.json();
    if (!data || !data.rawData) {
       showToast("Tiada rekod untuk bulan ini.");
       return;
    }
    
    const zip = new JSZip();
    const monthFolderName = `Bulan_${String(month).padStart(2, '0')}_${year}`;
    const wb = XLSX.utils.book_new();
    const sheetNames = Object.keys(data.rawData);
    let hasData = false;
    
    sheetNames.forEach(sheetName => {
      const sheetData = data.rawData[sheetName];
      if (sheetData && sheetData.length > 0) {
        hasData = true;
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });

    if (!hasData) {
      showToast("Tiada data wujud pada bulan tersebut.");
      return;
    }
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    zip.file(`Laporan_${monthFolderName}.xlsx`, excelBuffer);
    
    // Download receipts
    if (data.imageUrls && data.imageUrls.length > 0) {
      const receiptFolder = zip.folder("Resit");
      const fetchPromises = data.imageUrls.map(async (urlObj) => {
        try {
          const imgRes = await fetch(urlObj.url);
          const blob = await imgRes.blob();
          receiptFolder.file(urlObj.name, blob);
        } catch (e) {
          console.error("Gagal muat turun imej:", urlObj.name);
        }
      });
      await Promise.all(fetchPromises);
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Arkib_${monthFolderName}.zip`);
    showToast("Muat turun selesai!");
    
  } catch (err) {
    console.error(err);
    showToast("Ralat menjana ZIP Bulanan.");
  }
}

async function downloadYearlyArchive(year) {
  if (typeof Swal !== "undefined") {
    const result = await Swal.fire({
      title: 'Mula Muat Turun?',
      text: `Menjana fail ZIP untuk tahun ${year} mungkin mengambil masa yang lama (lebih 1 minit) kerana ia memuat turun semua laporan dan fail resit untuk kesemua 12 bulan. Teruskan?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Teruskan',
      cancelButtonText: 'Batal'
    });
    if (!result.isConfirmed) return;
  }

  showToast(`Sedang menjana ZIP Tahunan ${year}. Sila tunggu, proses ini mungkin mengambil masa lebih 1 minit...`);
  
  try {
    const token = localStorage.getItem("din_token_sys");
    const zip = new JSZip();
    
    // Create master excel workbook for yearly summary
    const masterWb = XLSX.utils.book_new();
    let hasMasterData = false;
    
    // Fetch data for all 12 months sequentially
    for (let month = 1; month <= 12; month++) {
      const res = await fetch(`${API_BASE_URL}/owner/monthly-archive-data?month=${month}&year=${year}&t=${Date.now()}`, {
        credentials: "include"
      });
      
      if (!res.ok) continue;
      
      const data = await res.json();
      if (!data || !data.rawData) continue;
      
      const monthFolderName = `Bulan_${String(month).padStart(2, '0')}_${year}`;
      const monthFolder = zip.folder(monthFolderName);
      
      // Create Month Excel
      const wb = XLSX.utils.book_new();
      const sheetNames = Object.keys(data.rawData);
      let hasData = false;
      
      let allMonthRows = []; // To combine for master compressed sheet
      
      sheetNames.forEach(sheetName => {
        const sheetData = data.rawData[sheetName];
        if (sheetData && sheetData.length > 0) {
          hasData = true;
          hasMasterData = true;
          const ws = XLSX.utils.json_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
          
          // Inject month property for master sheet
          sheetData.forEach(row => {
            allMonthRows.push({ Bulan: month, Kategori: sheetName, ...row });
          });
        }
      });

      if (!hasData) {
        const ws = XLSX.utils.json_to_sheet([{ Nota: "Tiada Rekod" }]);
        XLSX.utils.book_append_sheet(wb, ws, "Kosong");
      }
      
      // Append to Master workbook as a separate sheet for that month (e.g., "Bulan 1")
      if (allMonthRows.length > 0) {
         const masterWs = XLSX.utils.json_to_sheet(allMonthRows);
         XLSX.utils.book_append_sheet(masterWb, masterWs, `Bulan_${month}`);
      }

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      monthFolder.file(`Laporan_${monthFolderName}.xlsx`, excelBuffer);
      
      // Download receipts for this month
      if (data.imageUrls && data.imageUrls.length > 0) {
        const receiptFolder = monthFolder.folder("Resit");
        const fetchPromises = data.imageUrls.map(async (urlObj) => {
          try {
            const imgRes = await fetch(urlObj.url);
            const blob = await imgRes.blob();
            receiptFolder.file(urlObj.name, blob);
          } catch (e) {
            console.error("Gagal muat turun imej:", urlObj.name);
          }
        });
        await Promise.all(fetchPromises);
      }
    }
    
    // Add 1 extra sheet for "Compressed 12 months" summary (Weekly Sales grouped)
    // For simplicity, we just fetch from historical_sales if it exists, or generate a placeholder
    // since the raw data is already split into the 12 sheets.
    if (hasMasterData) {
       const summaryRes = await fetch(`${API_BASE_URL}/owner/historical-data?year=${year}&t=${Date.now()}`, { credentials: "include" });
       if (summaryRes.ok) {
           const summaryData = await summaryRes.json();
           if (summaryData && summaryData.length > 0) {
               const summaryWs = XLSX.utils.json_to_sheet(summaryData);
               XLSX.utils.book_append_sheet(masterWb, summaryWs, "Ringkasan_Tahunan_Mampat");
           }
       }
       const masterBuffer = XLSX.write(masterWb, { bookType: 'xlsx', type: 'array' });
       zip.file(`Laporan_Lengkap_${year}.xlsx`, masterBuffer);
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Arkib_Lengkap_${year}.zip`);
    showToast("Muat turun selesai!");
    
  } catch (err) {
    console.error(err);
    showToast("Ralat menjana ZIP Tahunan.");
  }
}

async function downloadCompressedArchive(year) {
  if (typeof Swal !== "undefined") {
    const result = await Swal.fire({
      title: 'Muat Turun Ringkasan?',
      text: `Adakah anda ingin memuat turun laporan jualan ringkas (mampat) bagi tahun ${year}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Teruskan',
      cancelButtonText: 'Batal'
    });
    if (!result.isConfirmed) return;
  }

  showToast(`Sedang menjana laporan mampat untuk tahun ${year}...`);
  try {
    const token = localStorage.getItem("din_token_sys");
    const res = await fetch(`${API_BASE_URL}/owner/historical-data?year=${year}&t=${Date.now()}`, {
      credentials: "include"
    });
    
    if (!res.ok) throw new Error("Gagal");
    const data = await res.json();
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, `Sales_${year}`);
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Laporan_Mampat_${year}.xlsx`);
    
    showToast("Muat turun selesai!");
  } catch (e) {
    console.error(e);
    showToast("Ralat menjana laporan mampat.");
  }
}

// Check for Reminders on Login/Load
function checkArchivingReminders() {
  const now = new Date();
  const date = now.getDate();
  const month = now.getMonth(); // 0 = Jan, 1 = Feb
  const year = now.getFullYear();

  // Awal bulan (Hari 1-5): Peringatan muat turun bulan lepas
  if (date >= 1 && date <= 5) {
     const lastMonth = month === 0 ? 12 : month;
     const lastMonthYear = month === 0 ? year - 1 : year;
     
     // Elakkan popup spam berulang kali dalam 1 session
     if (!sessionStorage.getItem("din_monthly_reminder_shown_v2")) {
        showReminderPopup(
          `Laporan jualan bagi bulan lepas sedia untuk dimuat turun. Sila muat turun salinan anda sekarang.`, 
          `Muat Turun Laporan Bulan ${lastMonth}/${lastMonthYear}`, 
          () => {
             downloadMonthlyZip(lastMonth, lastMonthYear);
          }
        );
        sessionStorage.setItem("din_monthly_reminder_shown_v2", "true");
     }
  }
  
  // Hujung Januari (Hari 27-31): Peringatan muat turun Laporan Lengkap Tahun Lepas
  if (month === 0 && date >= 27 && date <= 31) {
     const lastYear = year - 1;
     
     if (!sessionStorage.getItem("din_yearly_reminder_shown_v2")) {
        showReminderPopup(
          `PERHATIAN: Data laporan mentah dan resit untuk tahun ${lastYear} akan DIPADAM KEKAL pada 1 Februari. Sila muat turun Laporan Lengkap Tahunan anda dengan segera!`, 
          `Muat Turun ZIP Tahunan ${lastYear}`, 
          () => {
             downloadYearlyArchive(lastYear);
          },
          true // isDanger
        );
        sessionStorage.setItem("din_yearly_reminder_shown_v2", "true");
     }
  }
}

function showReminderPopup(message, btnText, callback, isDanger = false) {
   // Buat div overlay
   const overlay = document.createElement("div");
   overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm";
   
   const card = document.createElement("div");
   card.className = "bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center transform transition-all scale-100";
   
   const icon = document.createElement("div");
   icon.className = `text-5xl mb-4 ${isDanger ? 'text-red-500' : 'text-gray-900'}`;
   icon.innerHTML = isDanger ? '<i class="fas fa-exclamation-triangle"></i>' : '<i class="fas fa-bell"></i>';
   
   const title = document.createElement("h3");
   title.className = "font-black text-xl text-gray-800 mb-2";
   title.innerText = isDanger ? "Tindakan Diperlukan!" : "Peringatan Sistem";
   
   const text = document.createElement("p");
   text.className = "text-sm text-gray-600 mb-6";
   text.innerText = message;
   
   const btnPrimary = document.createElement("button");
   btnPrimary.className = `w-full py-3 rounded-xl font-bold text-white mb-2 shadow-md transition ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-black'}`;
   btnPrimary.innerText = btnText;
   btnPrimary.onclick = () => {
      callback();
      overlay.remove();
   };
   
   const btnSkip = document.createElement("button");
   btnSkip.className = "w-full py-2 text-gray-400 font-semibold text-sm hover:text-gray-600 transition";
   btnSkip.innerText = "Tutup";
   btnSkip.onclick = () => overlay.remove();
   
   card.appendChild(icon);
   card.appendChild(title);
   card.appendChild(text);
   card.appendChild(btnPrimary);
   card.appendChild(btnSkip);
   
   overlay.appendChild(card);
   document.body.appendChild(overlay);
}

// Invoke checkArchivingReminders() on load
setTimeout(checkArchivingReminders, 2500);


// Close 3-dots mobile menu when clicking outside
document.addEventListener('click', function(event) {
  const menu = document.getElementById('mobile-header-menu');
  if (menu && !menu.classList.contains('hidden')) {
    const button = menu.previousElementSibling;
    if (!menu.contains(event.target) && !button.contains(event.target)) {
      menu.classList.add('hidden');
    }
  }
});

