const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST
  ? "http://localhost:3000/api"
  : "https://dinspire-system.onrender.com/api";


if (
  !window.matchMedia("(display-mode: standalone)").matches &&
  !navigator.standalone
)
  setTimeout(() => {
    document.getElementById("pwa-prompt").style.display = "block";
  }, 4000);

let masterData = {
  bookings: [],
  reviews: [],
  punchCard: [],
  orders: [],
  commissionPercent: 50,
};
let mapBarberBranch = {};
let salesChartObj, demoChartObj, payChartObj, staffChartObj;
let hasAutoTriggeredAI = false;
let currentInsightAbortController = null;
let currentActiveTab = "dashboard";

let currentLang = "en";

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
  let isLogged = localStorage.getItem("din_owner_logged");
  if (isLogged) {
    document.getElementById("login-overlay").style.display = "none";
    try {
      initChart();
    } catch (e) {}
    fetchOwnerDashboardData();
  }
});

async function loginSystem(allowedRoles) {
  const username = document.getElementById("sys-username").value.trim();
  const password = document.getElementById("sys-password").value.trim();
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
      body: JSON.stringify({ username, password, allowed_roles: allowedRoles }),
    });
    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("din_owner_logged", "true");
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
      location.reload();
    });
}

function closeLoading() {
  document.getElementById("loading-overlay").style.display = "none";
  document.getElementById("loading-overlay").classList.remove("flex");
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

async function fetchOwnerDashboardData() {
  document.getElementById("loading-overlay").classList.add("flex");
  document.getElementById("loading-overlay").classList.remove("hidden");

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
      masterData = data.masterData;
      mapBarberBranch = data.mapBarberBranch || {};
      if (!masterData.orders) masterData.orders = [];
      if (!masterData.bookings) masterData.bookings = [];
      processData();
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
    return dateObj >= startOfWeek;
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
  const filterType = document.getElementById("timeFilter").value;
  const now = new Date();
  let filteredBookings = masterData.bookings.filter(
    (b) =>
      b.Status === "Selesai" &&
      isWithinFilter(b.Timestamp || b.Date || b.created_at, filterType, now),
  );
  let filteredOrders = masterData.orders.filter((o) =>
    isWithinFilter(o.Timestamp || o.created_at || o.tarikh, filterType, now),
  );
  let filteredPunch = (masterData.punchCard || []).filter((p) =>
    isWithinFilter(
      p.Timestamp || p.Tarikh || p.tarikh || p.created_at,
      filterType,
      now,
    ),
  );
  let filteredReviews = (masterData.reviews || []).filter((r) =>
    isWithinFilter(r.Timestamp || r.created_at || r.tarikh, filterType, now),
  );

  let serviceRev = 0;
  let staffStats = {};
  let branchStats = {};
  let countHcBooking = 0;
  let countHcWalkin = 0;
  let countTreatments = 0;
  let countOnCall = 0;
  let payData = { cash: 0, qr: 0, lain: 0 };
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
    } catch (e) {
      o._calculatedTotal = 0;
    }
  });

  document.getElementById("val-revenue").innerText =
    `RM ${(serviceRev + productRev).toLocaleString("en-MY", { minimumFractionDigits: 0 })}`;
  const elSvcFee = document.getElementById("val-service-fee");
  if (elSvcFee) elSvcFee.innerText = `RM ${totalServiceFees.toFixed(2)}`;
  const elShipFee = document.getElementById("val-shipping-fee");
  if (elShipFee) elShipFee.innerText = `RM ${totalShippingFees.toFixed(2)}`;
  document.getElementById("val-commission").innerText =
    `RM ${totalComm.toFixed(2)}`;
  document.getElementById("val-products-rm").innerText =
    `RM ${productRev.toFixed(2)}`;
  document.getElementById("val-orders-count").innerText = productOrderCount;
  document.getElementById("val-services-count").innerText =
    filteredBookings.length;
  document.getElementById("val-walkin-booking").innerText =
    `${countHcWalkin} / ${countHcBooking}`;

  let tStars = 0;
  filteredReviews.forEach(
    (r) => (tStars += parseInt(r.Stars || r.bintang) || 0),
  );
  document.getElementById("val-rating").innerText = filteredReviews.length
    ? (tStars / filteredReviews.length).toFixed(1)
    : "0.0";

  let topBranch = "-";
  let highest = -1;
  for (let k in branchStats) {
    if (branchStats[k].count > highest) {
      highest = branchStats[k].count;
      topBranch = k;
    }
  }
  document.getElementById("val-top-branch").innerText = topBranch;

  if (demoChartObj) {
    let totalDemo =
      countHcBooking + countHcWalkin + countTreatments + countOnCall;
    if (totalDemo > 0) {
      demoChartObj.data.labels = ["Gunting", "Rawatan", "OnCall"];
      demoChartObj.data.datasets[0].data = [
        countHcBooking + countHcWalkin,
        countTreatments,
        countOnCall,
      ];
      demoChartObj.data.datasets[0].backgroundColor = [
        "#111827",
        "#6b7280",
        "#d1d5db",
      ];
    } else {
      demoChartObj.data.labels = ["Tiada Data"];
      demoChartObj.data.datasets[0].data = [1];
      demoChartObj.data.datasets[0].backgroundColor = ["#e5e7eb"];
    }
    demoChartObj.update();
  }

  if (payChartObj) {
    let totalPay = payData.cash + payData.qr + payData.lain;
    if (totalPay > 0) {
      payChartObj.data.labels = ["Tunai (Cash)", "QR/Online", "Lain"];
      payChartObj.data.datasets[0].data = [
        payData.cash,
        payData.qr,
        payData.lain,
      ];
      payChartObj.data.datasets[0].backgroundColor = [
        "#111827",
        "#6b7280",
        "#d1d5db",
      ];
    } else {
      payChartObj.data.labels = ["Tiada Data"];
      payChartObj.data.datasets[0].data = [1];
      payChartObj.data.datasets[0].backgroundColor = ["#e5e7eb"];
    }
    payChartObj.update();
  }

  if (staffChartObj) {
    let sNames = Object.keys(staffStats);
    let totalStaffSales = sNames.reduce(
      (sum, n) => sum + staffStats[n].sales,
      0,
    );
    if (sNames.length > 0 && totalStaffSales > 0) {
      staffChartObj.data.labels = sNames;
      staffChartObj.data.datasets[0].data = sNames.map(
        (n) => staffStats[n].sales,
      );
      staffChartObj.data.datasets[0].backgroundColor = [
        "#111827",
        "#374151",
        "#4b5563",
        "#6b7280",
        "#9ca3af",
        "#d1d5db",
      ];
    } else {
      staffChartObj.data.labels = ["Tiada Jualan"];
      staffChartObj.data.datasets[0].data = [1];
      staffChartObj.data.datasets[0].backgroundColor = ["#e5e7eb"];
    }
    staffChartObj.update();
  }

  renderBranchTable(branchStats);
  renderStaffTable(staffStats);
  renderCashTable(staffStats);
  renderAttendanceTable(filteredPunch);
  renderTxServisTable(filteredBookings);
  renderTxProdukTable(filteredOrders);
  renderReviewsTable(filteredReviews);
  renderPunchTable(filteredPunch);
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
        `<tr class="hover:bg-gray-50 border-b border-gray-100"><td class="py-3 px-2 font-bold text-gray-800">${k}</td><td class="py-3 px-2 text-center text-gray-600 font-semibold">${stats[k].count}</td><td class="py-3 px-2 text-right font-black text-gray-900">RM ${stats[k].sales.toFixed(2)}</td></tr>`,
    )
    .join("");
}
function renderStaffTable(stats) {
  const tbody = document.getElementById("table-staff");
  const sortedStaff = Object.keys(stats).sort(
    (a, b) => stats[b].sales - stats[a].sales,
  );
  if (sortedStaff.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-400 italic" data-i18n="table-no-record">${i18n[currentLang]["table-no-record"] || "Tiada Rekod"}</td></tr>`;
    return;
  }
  tbody.innerHTML = sortedStaff
    .map(
      (name) =>
        `<tr class="hover:bg-gray-50 border-b border-gray-100"><td class="py-3 px-2 font-bold text-gray-800 flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">${name.charAt(0)}</div>${name}</td><td class="py-3 px-2 text-center text-gray-600 font-semibold">${stats[name].count}</td><td class="py-3 px-2 text-right font-black text-gray-900">RM ${stats[name].sales.toFixed(2)}</td></tr>`,
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
                    <div class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">${initial}</div>
                    ${name}
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
  sortedStaff.forEach((name) => {
    let initial = name.charAt(0).toUpperCase();
    let html = `
            <tr class="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                <td class="py-3 px-2 font-semibold text-gray-900 flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">${initial}</div>
                    ${name}
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
    (a, b) => new Date(b.Timestamp || b.Date) - new Date(a.Timestamp || a.Date),
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
                            <div class="text-[12px] text-gray-800 uppercase font-bold leading-none">${b.Username || "PELANGGAN"}</div>
                            <div class="text-[10px] text-gray-400 mt-1 leading-none truncate">${b.ServiceName || "-"}</div>
                        </div>
                        <div class="text-right flex flex-col justify-center">
                            <div class="text-[12px] font-semibold text-blue-600 tracking-wide leading-none">+RM ${(parseFloat(b.Price) || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div id="det-s-${index}" class="hidden bg-gray-50 px-3 py-2 text-xs text-gray-700 border-t border-gray-100 rounded-b-lg">
                    <div class="mb-2"><span class="px-2 py-0.5 rounded text-[8px] font-bold ${badge} uppercase tracking-wider">${b.Category}</span></div>
                    <div class="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">No. Order</span><span class="font-bold text-gray-900">${b.OrderNo || "-"}</span></div>
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Barber</span><span class="font-bold text-gray-900">${b.Barber || "-"}</span></div>
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Cara Bayaran</span><span class="font-bold text-gray-900">${typeStr}</span></div>
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
    (a, b) => new Date(b.Timestamp) - new Date(a.Timestamp),
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
        stat === "Preparing" || stat === "Baru" || stat === "Belum"
          ? "bg-orange-100 text-orange-700"
          : stat === "Shipped"
            ? "bg-blue-100 text-blue-700"
            : "bg-emerald-100 text-emerald-700";

      let actionArea =
        stat === "Preparing" || stat === "Baru" || stat === "Belum"
          ? `<div class="mt-3 flex flex-wrap gap-2 items-center" onclick="event.stopPropagation()">
                 <input type="text" id="track-${orderId}" placeholder="No Tracking" class="flex-1 border border-gray-300 px-3 py-1.5 text-xs rounded-lg min-w-[120px] outline-none focus:border-blue-500 shadow-sm">
                 <button onclick="updateTracking('${orderId}')" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 font-bold shadow-sm whitespace-nowrap">Kemas Kini</button>
               </div>`
          : "";

      return `
        <tr class="block w-full !bg-white border border-gray-100 rounded-lg mb-1.5 shadow-sm hover:shadow-md transition">
            <td class="block w-full p-0">
                <div class="px-3 py-1.5 cursor-pointer" onclick="document.getElementById('det-p-${index}').classList.toggle('hidden')">
                    <div class="text-[9px] text-gray-400 mb-0.5 leading-none tracking-wide">${tFormat}</div>
                    <div class="flex justify-between items-center mt-0.5">
                        <div class="max-w-[70%] text-left">
                            <div class="text-[12px] text-gray-800 uppercase font-bold leading-none">${o.User || o.nama_pembeli || "PELANGGAN"}</div>
                            <div class="text-[10px] text-gray-400 mt-1 leading-none truncate">${pNames.join(", ") || "Pesanan Produk"}</div>
                        </div>
                        <div class="text-right flex flex-col justify-center">
                            <div class="text-[12px] font-semibold text-blue-600 tracking-wide leading-none">+RM ${(parseFloat(o._calculatedTotal) || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div id="det-p-${index}" class="hidden bg-gray-50 px-3 py-2 text-xs text-gray-700 border-t border-gray-100 rounded-b-lg">
                    <div class="mb-2 flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[8px] font-bold ${badgeColor} uppercase tracking-wider">Status: ${stat}</span></div>
                    <div class="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">No. Order</span><span class="font-bold text-gray-900">#${o.OrderNo || String(o.id).substring(0, 8).toUpperCase() || "-"}</span></div>
                        <div class="col-span-2"><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Alamat Penghantaran</span><span class="font-bold text-gray-900 whitespace-normal leading-relaxed">${o.Address || o.lokasi_penghantaran || "-"}</span></div>
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

        return `<div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">${orderNo || "#"}</span>
                        <span class="text-amber-500 text-sm tracking-widest drop-shadow-sm">${"★".repeat(stars)}${"☆".repeat(5 - stars)}</span>
                    </div>
                    <p class="text-sm text-gray-700 mt-3 mb-4 leading-relaxed font-medium">"${escapeHTML(text)}"</p>
                    <div class="flex flex-wrap gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <span class="bg-gray-50 px-2 py-1 rounded border border-gray-100"><i class="fas fa-user-tie mr-1 text-gray-400"></i> ${barberName}</span>
                        <span class="bg-gray-50 px-2 py-1 rounded border border-gray-100"><i class="fas fa-map-marker-alt mr-1 text-gray-400"></i> ${branchName}</span>
                    </div>
                </div>`;
      })
      .join("") +
    "</div>";
}

function renderPunchTable(punchData) {
  const tbody = document.getElementById("table-punch");
  punchData.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

  if (punchData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-gray-400 italic" data-i18n="table-no-record">${i18n[currentLang]["table-no-record"] || "Tiada Rekod"}</td></tr>`;
    return;
  }

  tbody.innerHTML = punchData
    .map((p) => {
      let staffName =
        p["Nama Staf"] || p.nama || (p.staff ? p.staff.username : "") || "-";
      let locStr = p["Lokasi GPS"] || p.lokasi || "";
      let isGmap = locStr.includes("http") || locStr.includes("google.com");
      let locText = locStr;
      if (locText.includes("TIDAK DIBENARKAN") || locText.includes("GAGAL"))
        locText = "Tiada Akses GPS";
      let gpsBtn = isGmap
        ? `<a href="${locStr}" target="_blank" class="text-blue-600 font-bold text-[10px] md:text-xs hover:underline">Lihat Peta</a>`
        : `<span class="text-[9px] text-gray-400 font-bold leading-tight truncate w-[60px] md:w-auto inline-block uppercase" title="${escapeHTML(locStr)}">${escapeHTML(locText || "N/A")}</span>`;

      let timestampVal = p.Timestamp || p.created_at || p.tarikh;
      let d = new Date(timestampVal);
      let dateFmt = isNaN(d)
        ? p.Tarikh || p.tarikh || "-"
        : d.toLocaleDateString("ms-MY");
      let masaFmt = p.Masa || p.waktu_out || p.waktu_in || "-";

      let act = p.Aktiviti || (p.waktu_out ? "PUNCH OUT" : "PUNCH IN");
      let badgeClass = act.includes("IN") ? "badge-in" : "badge-out";

      return `<tr class="hover:bg-gray-50 border-b border-gray-50">
            <td class="py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-600 whitespace-nowrap text-center">${dateFmt} <span class="text-gray-400 ml-1 font-bold block md:inline">${masaFmt}</span></td>
            <td class="py-3 px-2 md:px-4 text-xs md:text-sm font-bold text-gray-900 whitespace-nowrap text-center">${staffName}</td>
            <td class="py-3 px-2 md:px-4 text-center whitespace-nowrap"><span class="badge-in-out ${badgeClass}">${act}</span></td>
            <td class="py-3 px-2 md:px-4 text-center whitespace-nowrap">${gpsBtn}</td>
        </tr>`;
    })
    .join("");
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
}

function updateBarChart(bookings, orders, filterType) {
  let labels = [];
  let dataPoints = [];
  let bgColors = [];
  const now = new Date();

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

  const addAmount = (dateStr, timeStr, amount) => {
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

    if (filterType === "daily") {
      let hour = d.getHours();
      if (hour >= 0 && hour < 24) dataPoints[hour] += amount;
    } else if (filterType === "weekly") {
      let day = d.getDay();
      dataPoints[day] += amount;
    } else if (filterType === "monthly") {
      let dateNum = d.getDate();
      if (dateNum >= 1 && dateNum <= dataPoints.length)
        dataPoints[dateNum - 1] += amount;
    } else if (filterType === "yearly") {
      let month = d.getMonth();
      if (month >= 0 && month < 12) dataPoints[month] += amount;
    } else {
      dataPoints[0] += amount;
    }
  };

  bookings.forEach((b) =>
    addAmount(b.Date || b.Timestamp, b.Time, parseFloat(b.Price) || 0),
  );
  orders.forEach((o) => addAmount(o.Timestamp, null, o._calculatedTotal || 0));

  salesChartObj.data.labels = labels;
  salesChartObj.data.datasets[0].data = dataPoints;
  salesChartObj.data.datasets[0].backgroundColor = bgColors;
  salesChartObj.update();
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
        <div class="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1"><i class="fas fa-robot text-[10px] text-white"></i></div>
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
                <div class="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1"><i class="fas fa-robot text-[10px] text-white"></i></div>
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
                                <div class="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1 opacity-0"><i class="fas fa-robot text-[10px] text-white"></i></div>
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
