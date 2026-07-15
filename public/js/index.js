const IS_LOCALHOST = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST ? "http://localhost:3000/api" : "https://api.dinspirebarbershop.com/api";
const VAPID_PUBLIC_KEY = "BDwYmNxy-sQG489E0z2c0-gM9i22V-7X0q4Vq-j4_9Nq8Q0O2-l5P9T4n9X0-4_4Q";

let currentLang = localStorage.getItem("user_lang") || "en";

function updateLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("user_lang", lang);
  
  // Update indicator
  const indicators = document.querySelectorAll(".lang-indicator");
  indicators.forEach(ind => {
    ind.innerText = lang.toUpperCase();
  });

  // Update static texts
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (i18n_index[lang] && i18n_index[lang][key]) {
      el.innerHTML = i18n_index[lang][key];
    }
  });

  // Update placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (i18n_index[lang] && i18n_index[lang][key]) {
      el.placeholder = i18n_index[lang][key];
    }
  });

  // Re-render dynamic sections if data exists
  if (typeof renderServices === "function") renderServices();
  if (typeof renderProducts === "function") renderProducts();
  if (typeof fetchNotifications === "function") fetchNotifications();
  if (typeof fetchBookings === "function") fetchBookings();
  updateCartUI();
}

function toggleLanguage() {
  const newLang = currentLang === "en" ? "ms" : "en";
  updateLanguage(newLang);
}

window.addEventListener("DOMContentLoaded", () => {
  updateLanguage(currentLang);
});

// [DIBAIKI] Variabel dipulihkan ke bentuk objek asal
let shopData = {};
let cartState = {};
let currentUser = null;
let pendingBooking = null;
let currentCheckoutData = { type: "", subtotal: 0, fee: 0, total: 0 };
let bankInfo = null;

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

window.addEventListener("DOMContentLoaded", async () => {
  initAppDb();
  checkLoginState();
  switchView("home");
  setupOtpInputs("log-otp-inputs", "log-otp");
  setupOtpInputs("reg-otp-inputs", "reg-otp");
  setupStarRating();
  initEventListeners();
  generateAvatarGrid();
  renderNotifications();
  await fetchShopData();
  
  // Load bank info
  try {
    const bRes = await fetch("./bank-info.json");
    if (bRes.ok) {
      bankInfo = await bRes.json();
      const bInfoEl = document.getElementById("checkout-bank-info");
      if (bInfoEl && bankInfo) {
        bInfoEl.innerHTML = `
          <div style="margin-bottom: 2px;">${bankInfo.bankName || ""}</div>
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">${bankInfo.ownerName || ""}</div>
          <div style="font-size: 15px; letter-spacing: 1px; color: var(--primary-blue); font-family: monospace; margin-top: 4px;">${bankInfo.accountNumber || ""}</div>
        `;
      }
    }
  } catch (e) {
    console.error("Failed to load bank info:", e);
  }

  renderHomeReviews();
  updateCartUI();
});

function initEventListeners() {
  document
    .getElementById("pwa-prompt-close-btn")
    ?.addEventListener("click", () => {
      document.getElementById("pwa-prompt").style.display = "none";
    });
  document
    .getElementById("avatar-modal-overlay")
    ?.addEventListener("click", () => closeModal("avatar-modal-overlay"));
  document
    .querySelector("#avatar-modal-overlay .custom-modal")
    ?.addEventListener("click", (e) => e.stopPropagation());
  document
    .getElementById("avatar-modal-close-btn")
    ?.addEventListener("click", () => closeModal("avatar-modal-overlay"));
  document
    .getElementById("tab-haircuts")
    ?.addEventListener("change", () => switchServiceTab("haircuts"));
  document
    .getElementById("tab-treatments")
    ?.addEventListener("change", () => switchServiceTab("treatments"));
  document
    .getElementById("tab-oncall")
    ?.addEventListener("change", () => switchServiceTab("oncall"));
  document
    .getElementById("btn-tab-login")
    ?.addEventListener("click", () => switchAuthTab("login"));
  document
    .getElementById("btn-tab-register")
    ?.addEventListener("click", () => switchAuthTab("register"));
  document
    .getElementById("form-login")
    ?.addEventListener("submit", handleLogin);
  document
    .getElementById("form-register")
    ?.addEventListener("submit", handleRegister);
  document
    .getElementById("open-avatar-modal-btn")
    ?.addEventListener("click", openAvatarModal);
  document
    .getElementById("logout-btn")
    ?.addEventListener("click", handleLogout);
  document
    .querySelector("#account-logged-in form")
    ?.addEventListener("submit", submitCustomerReview);
  document
    .querySelectorAll(".bottom-nav .nav-item")
    .forEach((item) =>
      item.addEventListener("click", () =>
        switchView(item.id.replace("nav-", "")),
      ),
    );
  document.getElementById("checkout-btn")?.addEventListener("click", () => {
    if (checkLoginBeforeBooking()) openCheckout("product");
  });
  
  document
    .getElementById("product-search")
    ?.addEventListener("input", (e) => renderProducts(e.target.value));

  const onCallForm = document.getElementById("form-oncall");
  if (onCallForm) {
    onCallForm.removeEventListener("submit", submitOnCall);
    onCallForm.addEventListener("submit", submitOnCall);
  }
}

function setupOtpInputs(containerId, hiddenInputId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const inputs = container.querySelectorAll(".otp-box");
  inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      if (e.target.value.length > 0 && index < inputs.length - 1)
        inputs[index + 1].focus();
      updateHiddenOtp();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && e.target.value === "" && index > 0)
        inputs[index - 1].focus();
      updateHiddenOtp();
    });
  });
  function updateHiddenOtp() {
    const otp = Array.from(inputs)
      .map((i) => i.value)
      .join("");
    document.getElementById(hiddenInputId).value = otp;
  }
}

function clearOtpInputs() {
  document.querySelectorAll(".otp-box").forEach((input) => (input.value = ""));
  if (document.getElementById("log-otp")) document.getElementById("log-otp").value = "";
  if (document.getElementById("reg-otp")) document.getElementById("reg-otp").value = "";
  if (document.getElementById("forgot-otp")) document.getElementById("forgot-otp").value = "";
}

function setupStarRating() {
  const stars = document.querySelectorAll("#review-stars-ui i");
  const hiddenInput = document.getElementById("review-stars");
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      const val = index + 1;
      hiddenInput.value = val;
      stars.forEach((s, i) => {
        if (i < val) {
          s.classList.remove("far");
          s.classList.add("fas", "active");
        } else {
          s.classList.remove("fas", "active");
          s.classList.add("far");
        }
      });
    });
  });
}

function initAppDb() {
  if (!localStorage.getItem("din_bookings"))
    localStorage.setItem("din_bookings", JSON.stringify([]));
  if (!localStorage.getItem("din_notifications"))
    localStorage.setItem("din_notifications", JSON.stringify([]));
}

function switchAuthTab(tab) {
  document.getElementById("btn-tab-login").classList.remove("active");
  document.getElementById("btn-tab-register").classList.remove("active");
  document.getElementById("form-login").style.display = "none";
  document.getElementById("form-register").style.display = "none";
  document.getElementById("btn-tab-" + tab).classList.add("active");
  document.getElementById("form-" + tab).style.display = "block";
  document.getElementById("form-login").reset();
  document.getElementById("form-register").reset();
  clearOtpInputs();
  if (document.getElementById("reg-otp-group")) document.getElementById("reg-otp-group").style.display = "none";
  if (document.getElementById("btn-reg-req-otp")) document.getElementById("btn-reg-req-otp").style.display = "block";
  if (document.getElementById("btn-register-submit")) document.getElementById("btn-register-submit").style.display = "none";
}

function requestOtp(type) {
  const phoneInput =
    type === "login"
      ? document.getElementById("log-phone")
      : document.getElementById("reg-phone");
  const phone = phoneInput.value.trim();
  const btn =
    type === "login"
      ? document.getElementById("btn-log-req-otp")
      : document.getElementById("btn-reg-req-otp");
  if (!/^01\d{8,9}$/.test(phone)) {
    alert("Sila masukkan nombor telefon yang sah.");
    phoneInput.focus();
    return;
  }
  btn.innerText = "Menghantar...";
  btn.disabled = true;

  fetch(`${API_BASE_URL}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        showToast("OTP dihantar! (Lihat Terminal)");
        btn.style.display = "none";
        if (type === "login") {
          document.getElementById("log-otp-group").style.display = "block";
          document.getElementById("btn-login-submit").style.display = "block";
        } else {
          document.getElementById("reg-otp-group").style.display = "block";
          document.getElementById("btn-register-submit").style.display =
            "block";
        }
      } else alert("Ralat: " + data.message);
      btn.innerText = "Minta Kod OTP";
      btn.disabled = false;
    })
    .catch((err) => {
      alert("Ralat pelayan.");
      btn.innerText = "Minta Kod OTP";
      btn.disabled = false;
    });
}

function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("reg-user").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const address = document.getElementById("reg-address").value.trim();
  const avatar = document.getElementById("reg-avatar-val").value;
  const password = document.getElementById("reg-password").value.trim();
  const otp = document.getElementById("reg-otp").value.trim();
  
  if (!password || password.length < 6) return alert("Kata laluan mestilah sekurang-kurangnya 6 aksara.");
  if (!otp || otp.length < 6) return alert("Sila lengkapkan 6 digit OTP!");
  
  const btn = document.getElementById("btn-register-submit");
  btn.innerText = "Mengesahkan...";
  btn.disabled = true;
  fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, phone, address, avatar_url: avatar, otp, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        showToast(i18n_index[currentLang]["alert-register-success"]);
        switchAuthTab("login");
        document.getElementById("log-phone").value = phone;
      } else alert("Ralat: " + data.message);
      btn.innerText = "Sahkan & Daftar";
      btn.disabled = false;
    })
    .catch((err) => {
      alert("Ralat pelayan.");
      btn.innerText = "Sahkan & Daftar";
      btn.disabled = false;
    });
}

function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById("log-phone").value.trim();
  const password = document.getElementById("log-password").value.trim();
  
  if (!password) return alert("Sila masukkan kata laluan!");
  
  const btn = document.getElementById("btn-login-submit");
  btn.innerText = "Mengesahkan...";
  btn.disabled = true;
  fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ phone, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        localStorage.setItem("din_logged_user", JSON.stringify(data.user));
        showToast(i18n_index[currentLang]["alert-login-success"]);
        checkLoginState();
        switchView("home");
      } else alert(data.message);
      btn.innerText = "Login";
      btn.disabled = false;
    })
    .catch((err) => {
      alert("Gagal menyambung ke pangkalan data.");
      btn.innerText = "Login";
      btn.disabled = false;
    });
}

function openForgotPasswordModal() {
  document.getElementById("forgot-password-modal").style.display = "flex";
  setupOtpInputs("forgot-otp-inputs", "forgot-otp");
}

function handleForgotRequest(e) {
  e.preventDefault();
  const phone = document.getElementById("forgot-phone").value.trim();
  const btn = document.getElementById("btn-forgot-request");
  btn.innerText = "Menghantar...";
  btn.disabled = true;
  
  fetch(`${API_BASE_URL}/auth/forgot-password/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  }).then(res => res.json()).then(data => {
    if (data.status === "success") {
      alert("Kod OTP telah dihantar (Sila lihat Terminal).");
      document.getElementById("form-forgot-request").style.display = "none";
      document.getElementById("form-forgot-reset").style.display = "block";
    } else {
      alert(data.message);
    }
    btn.innerText = "Hantar Kod OTP";
    btn.disabled = false;
  }).catch(err => {
    alert("Ralat pelayan.");
    btn.innerText = "Hantar Kod OTP";
    btn.disabled = false;
  });
}

function handleForgotReset(e) {
  e.preventDefault();
  const phone = document.getElementById("forgot-phone").value.trim();
  const otp = document.getElementById("forgot-otp").value.trim();
  const new_password = document.getElementById("forgot-new-password").value.trim();
  const btn = document.getElementById("btn-forgot-reset");
  
  if (!otp || otp.length < 6) return alert("Sila masukkan kod OTP yang lengkap.");
  if (new_password.length < 6) return alert("Kata laluan mestilah sekurang-kurangnya 6 aksara.");
  
  btn.innerText = "Menetapkan...";
  btn.disabled = true;
  
  fetch(`${API_BASE_URL}/auth/forgot-password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp, new_password })
  }).then(res => res.json()).then(data => {
    if (data.status === "success") {
      alert("Kata laluan anda telah berjaya ditetapkan semula. Sila log masuk.");
      closeModal("forgot-password-modal");
      document.getElementById("form-forgot-request").style.display = "block";
      document.getElementById("form-forgot-reset").style.display = "none";
      document.getElementById("forgot-phone").value = "";
      document.getElementById("forgot-new-password").value = "";
    } else {
      alert(data.message);
    }
    btn.innerText = "Tetapkan Semula Kata Laluan";
    btn.disabled = false;
  }).catch(err => {
    alert("Ralat pelayan.");
    btn.innerText = "Tetapkan Semula Kata Laluan";
    btn.disabled = false;
  });
}

async function fetchWithAuth(url, options = {}) {
  let headers = { "Content-Type": "application/json" };
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
  if (response.status === 401 || response.status === 403) {
    handleLogout(false);
    alert("Sesi anda telah tamat. Sila log masuk semula.");
    return null;
  }
  return response;
}

function handleLogout(askConfirm = true) {
  if (!askConfirm || confirm("Pasti mahu log keluar?")) {
    fetch(`${API_BASE_URL}/auth/logout-client`, {
      method: "POST",
      credentials: "include",
    }).then(() => {
      localStorage.removeItem("din_logged_user");
      checkLoginState();
      if (askConfirm) showToast("Telah log keluar.");
    });
  }
}

function checkLoginState() {
  let session = localStorage.getItem("din_logged_user");
  if (session) {
    currentUser = JSON.parse(session);
    document.getElementById("account-logged-out").style.display = "none";
    document.getElementById("account-logged-in").style.display = "block";
    document.getElementById("profile-name").innerText = escapeHTML(
      currentUser.name || currentUser.username,
    );
    document.getElementById("profile-phone").innerText = escapeHTML(
      currentUser.phone,
    );
    document.getElementById("profile-avatar").src = escapeHTML(
      currentUser.avatar_url || "./Profile/1.png",
    );
    document.getElementById("home-welcome-name").innerText = escapeHTML(
      currentUser.name || currentUser.username,
    );
  } else {
    currentUser = null;
    document.getElementById("account-logged-out").style.display = "block";
    document.getElementById("account-logged-in").style.display = "none";
    document.getElementById("home-welcome-name").innerText = "Tetamu";
  }
}

function openAvatarModal() {
  document.getElementById("avatar-modal-overlay").classList.add("active");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}
function generateAvatarGrid() {
  let html = "";
  for (let i = 1; i <= 24; i++)
    html += `<img src="./Profile/${i}.png" onclick="selectAvatar(this, './Profile/${i}.png')">`;
  document.getElementById("avatar-grid-container").innerHTML = html;
}
function selectAvatar(imgEl, path) {
  document
    .querySelectorAll(".avatar-grid img")
    .forEach((el) => el.classList.remove("selected"));
  imgEl.classList.add("selected");
  document.getElementById("reg-avatar-val").value = path;
  document.getElementById("reg-avatar-preview").src = path;
}
function checkLoginBeforeBooking() {
  if (!currentUser) {
    alert("Sila Log Masuk sebelum meneruskan transaksi.");
    switchView("account");
    return false;
  }
  return true;
}

let activeScheduleFormId = null;
let scheduleMonthOffset = 0;
let scheduleSelectedDate = null;
let scheduleSelectedTime = null;

function openScheduleModal(formId) {
  activeScheduleFormId = formId;
  scheduleMonthOffset = 0;

  let tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  scheduleSelectedDate = tmr;
  scheduleSelectedTime = null;

  document.getElementById("schedule-modal").style.display = "flex";
  setTimeout(() => {
    renderScheduleDate();
    renderScheduleTime();
    document.getElementById("schedule-modal").classList.add("active");
  }, 10);
}

function closeScheduleModal() {
  document.getElementById("schedule-modal").classList.remove("active");
  setTimeout(() => {
    document.getElementById("schedule-modal").style.display = "none";
  }, 400);
}

function changeScheduleMonth(offset) {
  scheduleMonthOffset += offset;
  renderScheduleDate();
}

function selectScheduleDate(dateStr) {
  scheduleSelectedDate = new Date(dateStr);
  scheduleSelectedTime = null;
  renderScheduleDate();
  renderScheduleTime();
}

function selectScheduleTime(timeStr) {
  scheduleSelectedTime = timeStr;

  let dateFmt = `${scheduleSelectedDate.getFullYear()}-${String(scheduleSelectedDate.getMonth() + 1).padStart(2, "0")}-${String(scheduleSelectedDate.getDate()).padStart(2, "0")}`;
  document.getElementById(`input-date-${activeScheduleFormId}`).value = dateFmt;
  document.getElementById(`input-time-${activeScheduleFormId}`).value = timeStr;

  let [h, m] = timeStr.split(":");
  h = parseInt(h);
  let ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  document.getElementById(`btn-jadual-${activeScheduleFormId}`).innerText =
    `${dateFmt} | ${h}:${m} ${ampm}`;
  document
    .getElementById(`btn-jadual-${activeScheduleFormId}`)
    .classList.add("has-value");

  closeScheduleModal();
}

function renderScheduleDate() {
  const container = document.getElementById("schedule-date-panel");
  let viewDate = new Date(scheduleSelectedDate);
  viewDate.setMonth(viewDate.getMonth() + scheduleMonthOffset);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let html = `
        <div class="cal-header-dark">
            <button type="button" onclick="changeScheduleMonth(-1); event.stopPropagation();"><i class="fas fa-chevron-left"></i></button>
            <span>${monthNames[month]} ${year}</span>
            <button type="button" onclick="changeScheduleMonth(1); event.stopPropagation();"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="cal-days-dark"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
        <div class="cal-grid-dark">
    `;

  for (let i = 0; i < firstDay; i++) html += `<div></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    let cellDate = new Date(year, month, d);
    let dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    let isPastOrToday = cellDate <= today;
    let isSelected = cellDate.getTime() === scheduleSelectedDate.getTime();

    let classes = ["cal-date-dark"];
    if (isPastOrToday) classes.push("disabled");
    if (isSelected && !isPastOrToday) classes.push("selected");

    html += `<div class="${classes.join(" ")}" onclick="selectScheduleDate('${dateString}'); event.stopPropagation();">${d}</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

function renderScheduleTime() {
  const container = document.getElementById("schedule-time-panel");
  const timeSlots = [
    "11:00",
    "13:00",
    "15:00",
    "17:00",
    "19:00",
    "21:00",
    "23:00",
  ];

  let bookedTimes = [];
  let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="font-size:16px; font-weight:700; color:#111827;">Pilih Masa</h3>
            <button type="button" onclick="closeScheduleModal(); event.stopPropagation();" style="background:none; border:none; font-size:22px; color:#8E8E93; cursor:pointer;">&times;</button>
        </div>
        <div class="time-grid-light">
    `;

  timeSlots.forEach((t) => {
    let isSel = scheduleSelectedTime === t ? "selected" : "";
    let isDisabled = bookedTimes.includes(t);
    let [h, m] = t.split(":");
    h = parseInt(h);
    let ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    let format12 = `${h}:${m} ${ampm}`;

    html += `<button type="button" class="time-slot-light ${isSel} ${isDisabled ? "disabled" : ""}" onclick="selectScheduleTime('${t}'); event.stopPropagation();">${format12}</button>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

async function fetchShopData() {
  try {
    const timestamp = new Date().getTime();
    const res = await fetch(`${API_BASE_URL}/shop-data?t=${timestamp}`);
    shopData = await res.json();
    let bOpts =
      `<option value="" disabled selected>Pilih Cawangan</option>` +
      (shopData.Branches || [])
        .map((b) => `<option value="${b.id}">${b.name}</option>`)
        .join("");

    const buildCard = (arr, prefix, tab, category) =>
      arr
        .map(
          (x, i) => `
      <div class="service-card-wrapper rgb-border-container" id="card-${prefix}${i}">
        <div class="card-inner rgb-border-inner service-card-inner">
          <div class="card-header"><div><h3>${x.name}</h3><p style="font-weight:500; font-size:11px; margin-top:3px;">${x.desc || "Tiada diskripsi"}</p></div><div class="price">RM${parseFloat(x.price).toFixed(2)}</div></div>
          <div class="card-body">
            <form data-service-id="${x.id}" data-price="${x.price}" data-category="${category}">
              <div class="form-group"><label>Cawangan</label><select class="input-field" name="branch" onchange="updBarber(this,'${prefix}${i}')" required>${bOpts}</select></div>
              <div class="form-group"><label>Barber</label><select class="input-field" name="barber" id="barber-${prefix}${i}" required><option value="" disabled selected>Sila Pilih</option></select></div>
              
              <div class="form-group" style="margin-top:6px;">
                <button type="button" class="btn-pilih-jadual" id="btn-jadual-${prefix}${i}" onclick="openScheduleModal('${prefix}${i}')">${i18n_index[currentLang]["services-btn-schedule"]}</button>
                <input type="hidden" id="input-date-${prefix}${i}" name="date" required>
                <input type="hidden" id="input-time-${prefix}${i}" name="time" required>
              </div>
              
              <button type="submit" class="submit-btn" style="margin-top:4px;">${i18n_index[currentLang]["services-btn-pay"]}</button>
            </form>
          </div>
        </div>
      </div>`,
        )
        .join("");

    document.getElementById("services-haircuts").innerHTML =
      `<div class="section-title">Guntingan Rambut</div>` +
      buildCard(shopData.Haircuts || [], "hc", "Pelantikan", "Haircuts");
    document.getElementById("services-treatments").innerHTML =
      `<div class="section-title">Rawatan & Terapi</div>` +
      buildCard(shopData.Treatments || [], "tr", "Rawatan", "Treatments");

    let oncallSvc = document.getElementById("oncall-service-dropdown");
    if (oncallSvc)
      oncallSvc.innerHTML =
        `<option value="" disabled selected>Pilih Servis</option>` +
        (shopData.OnCall || [])
          .map(
            (s) => `<option value="${s.id}">${s.name} - RM${s.price}</option>`,
          )
          .join("");

    let oncallBarber = document.getElementById("oncall-barber-dropdown");
    if (oncallBarber)
      oncallBarber.innerHTML =
        `<option value="" disabled selected>Pilih Barber</option>` +
        (shopData.OnCallBarbers || [])
          .map((b) => `<option value="${b.id}">${b.name}</option>`).join("");

    const posterTrack = document.getElementById("dynamic-slider-track");
    const paginationContainer = document.querySelector(".pagination");
    if (shopData.Posters && shopData.Posters.length > 0) {
      posterTrack.innerHTML = shopData.Posters.map(
        (p) =>
          `<div class="slide"><div class="poster-card"><img src="${p.imageUrl}" alt="Promosi"></div></div>`,
      ).join("");
      
      // Update pagination dots
      if (paginationContainer) {
        paginationContainer.innerHTML = shopData.Posters.map((_, i) => 
          `<div class="dot ${i === 0 ? 'active' : ''}"></div>`
        ).join("");
      }
      
      const viewport = document.querySelector(".slider-viewport");
      
      // Sync dots on manual scroll
      if (viewport && paginationContainer) {
        viewport.addEventListener('scroll', () => {
          const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
          const dots = paginationContainer.querySelectorAll('.dot');
          dots.forEach((dot, i) => {
            if (i === index) dot.classList.add('active');
            else dot.classList.remove('active');
          });
        }, { passive: true });
      }

      if (window.sliderInterval) clearInterval(window.sliderInterval);
      if (shopData.Posters.length > 1) {
        window.sliderInterval = setInterval(() => {
          if (!viewport) return;
          const maxScroll = viewport.scrollWidth - viewport.clientWidth;
          
          if (viewport.scrollLeft >= maxScroll - 10) {
            viewport.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            viewport.scrollBy({ left: viewport.clientWidth, behavior: 'smooth' });
          }
        }, 4000);
      }
    } else {
      posterTrack.innerHTML = `<div class="slide"><div class="poster-card"><div style="color:gray; font-size:12px; font-weight:bold;">Tiada Promosi Dijalankan</div></div></div>`;
      if (paginationContainer) paginationContainer.innerHTML = '';
    }

    renderProducts();

    document.querySelectorAll(".service-card-inner").forEach((card) =>
      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-body")) return;
        toggleAccordion(card.parentElement.id.replace("card-", ""));
      }),
    );
    document.querySelectorAll(".service-card-inner form").forEach((form) =>
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        submitBooking(
          e,
          e.target.dataset.serviceId,
          parseFloat(e.target.dataset.price),
          e.target.dataset.category,
        );
      }),
    );
    document
      .querySelectorAll('.service-card-inner select[name="branch"]')
      .forEach((sel) =>
        sel.addEventListener("change", (e) => {
          updBarber(
            e.target,
            e.target.closest(".service-card-wrapper").id.replace("card-", ""),
          );
        }),
      );
  } catch (err) {
    console.error("Gagal muat data kedai");
  }
}

function updBarber(sel, id) {
  let bSelect = document.getElementById("barber-" + id);
  let selectedBranch = String(sel.value).trim();
  let arr = (shopData.Barbers || []).filter(
    (b) => String(b.branch_id).trim() === selectedBranch,
  );
  bSelect.innerHTML =
    arr.length > 0
      ? `<option value="" disabled selected>Pilih Barber</option>` +
        arr.map((b) => `<option value="${b.id}">${b.name}</option>`).join("")
      : `<option value="" disabled selected>Tiada Staff di Cawangan Ini</option>`;
}

let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let isSwiping = false;
let isMouseDown = false;
function getClientX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX;
}
function getClientY(e) {
  return e.touches ? e.touches[0].clientY : e.clientY;
}

function handleTouchStart(e, id) {
  touchStartX = getClientX(e);
  touchStartY = getClientY(e);
  const el = document.getElementById("swipe-content-" + id);
  if (el) el.style.transition = "none";
  isSwiping = false;
  if (e.type === "mousedown") isMouseDown = true;
}
function handleTouchMove(e, id) {
  if ((e.type === "mousemove" && !isMouseDown) || !touchStartX) return;
  touchCurrentX = getClientX(e);
  let currentY = getClientY(e);
  const diffX = touchStartX - touchCurrentX;
  const diffY = Math.abs(touchStartY - currentY);
  if (diffY > Math.abs(diffX) && !isSwiping) return;
  isSwiping = true;
  const el = document.getElementById("swipe-content-" + id);
  if (!el) return;
  if (diffX > 0 && diffX <= 90) {
    el.style.transform = `translateX(-${diffX}px)`;
  } else if (diffX > 90) {
    el.style.transform = `translateX(-80px)`;
  } else if (diffX < 0) {
    el.style.transform = `translateX(0px)`;
  }
}
function handleTouchEnd(e, id) {
  if (e.type === "mouseup" || e.type === "mouseleave") isMouseDown = false;
  const el = document.getElementById("swipe-content-" + id);
  if (!el) return;
  el.style.transition = "transform 0.3s ease";
  if (!touchCurrentX) {
    touchStartX = 0;
    return;
  }
  const diffX = touchStartX - touchCurrentX;
  if (diffX > 40) {
    el.style.transform = `translateX(-80px)`;
  } else {
    el.style.transform = `translateX(0px)`;
  }
  touchStartX = 0;
  touchCurrentX = 0;
  isSwiping = false;
}

function renderProducts(searchQuery = "") {
  const prodGrid = document.getElementById("dynamic-product-grid");
  if (!prodGrid) return;
  
  if (shopData.Products && shopData.Products.length > 0) {
    let filtered = shopData.Products;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => (p.name || "").toLowerCase().includes(q));
    }
    
    if (filtered.length > 0) {
      prodGrid.innerHTML = filtered.map(
        (p) => `
            <div class="product-card">
                <img src="${p.imageUrl || "https://via.placeholder.com/150"}" class="product-img" alt="${p.name}" onerror="this.src='https://via.placeholder.com/150'">
                <div class="product-info">
                    <div class="product-title">${p.name}</div>
                    <div class="product-price">RM ${parseFloat(p.price).toFixed(2)}</div>
                    <div class="card-actions mt-auto pt-2">
                        <div class="qty-control flex items-center justify-between bg-gray-100 rounded-lg p-1 flex-1">
                            <button class="qty-btn w-6 h-6 rounded bg-white font-bold" onclick="changeTempQty('${p.id}', -1)">-</button>
                            <span class="qty-num text-xs font-bold text-center w-5" id="temp-qty-${p.id}">1</span>
                            <button class="qty-btn w-6 h-6 rounded bg-white font-bold" onclick="changeTempQty('${p.id}', 1)">+</button>
                        </div>
                        <button class="add-btn bg-gray-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold ml-2" onclick="addToCart('${p.id}', '${(p.name || "").replace(/'/g, "\\'")}', ${parseFloat(p.price)}, '${p.imageUrl}')">${i18n_index[currentLang]["products-btn-add"]}</button>
                    </div>
                </div>
            </div>
        `,
      ).join("");
    } else {
      prodGrid.innerHTML = `<div style="grid-column: span 2; text-align:center; padding: 40px 20px; color:var(--text-muted); font-size:13px;">Produk tidak dijumpai.</div>`;
    }
  } else {
    prodGrid.innerHTML = `<div style="grid-column: span 2; text-align:center; padding: 40px 20px; color:var(--text-muted); font-size:13px;">Tiada produk ditawarkan buat masa ini.</div>`;
  }
}

function submitBooking(e, serviceId, price, category) {
  if (!checkLoginBeforeBooking()) return;
  const f = e.target;
  if (!f.date.value || !f.time.value)
    return alert(
      i18n_index[currentLang]["alert-select-schedule"],
    );
  let bType = category === "Treatments" ? "treatment" : "normal";
  pendingBooking = {
    type: bType,
    service_id: serviceId,
    price: price,
    barber: f.barber.value,
    branch_id: f.branch.value,
    date: f.date.value,
    time: f.time.value,
  };
  openCheckout("booking");
}

function submitOnCall(event) {
  event.preventDefault();
  if (!checkLoginBeforeBooking()) return;
  const form = event.target;
  const service_id =
    form.service?.value ||
    document.getElementById("oncall-service-dropdown")?.value;
  const barber =
    form.barber?.value ||
    document.getElementById("oncall-barber-dropdown")?.value;
  const date = form.date?.value;
  const time = form.time?.value;
  const address = form.address?.value;

  if (!service_id || !barber || !date || !time || !address)
    return alert(
      i18n_index[currentLang]["alert-incomplete-address"],
    );

  let price = 0;
  let selectedSvc = (shopData.OnCall || []).find((s) => s.id == service_id);
  if (selectedSvc) price = selectedSvc.price;

  pendingBooking = {
    type: "oncall",
    service_id: service_id,
    price: price,
    barber: barber,
    date: date,
    time: time,
    address: address,
  };
  openCheckout("oncall");
}

function editCheckoutAddress() {
  let newAddress = prompt(
    "Kemas Kini Alamat Penghantaran/Rumah:",
    currentUser?.address || "",
  );
  if (newAddress !== null && newAddress.trim() !== "") {
    if (currentUser) {
      currentUser.address = newAddress;
      localStorage.setItem("din_logged_user", JSON.stringify(currentUser));
    }
    document.getElementById("checkout-address-text").innerText = newAddress;
  }
}

function openEditCartPopup() {
  if (Object.keys(cartState).length === 0) return alert(i18n_index[currentLang]["alert-cart-empty"]);

  const listContainer = document.getElementById("edit-cart-items-list");
  let html = "";

  for (let id in cartState) {
    let item = cartState[id];
    html += `
        <div style="position: relative; border-bottom:1px solid #E5E5EA; overflow: hidden; min-height: 56px; margin: 0 -16px;">
            <div style="position: absolute; right: 0; top: 0; height: 100%; width: 80px; background: #FF3B30; color: white; display: flex; justify-content: center; align-items: center; font-weight: normal; font-size: 13px; cursor: pointer;" onclick="deleteEditCartItem('${id}')">${i18n_index[currentLang]["cart-delete-btn"]}</div>
            <div id="swipe-content-${id}" 
                 ontouchstart="handleTouchStart(event, '${id}')" ontouchmove="handleTouchMove(event, '${id}')" ontouchend="handleTouchEnd(event, '${id}')"
                 onmousedown="handleTouchStart(event, '${id}')" onmousemove="handleTouchMove(event, '${id}')" onmouseup="handleTouchEnd(event, '${id}')" onmouseleave="handleTouchEnd(event, '${id}')"
                 style="position: relative; background: #fff; z-index: 1; display:flex; justify-content:space-between; align-items:center; padding:8px 16px; width: 100%; box-sizing: border-box; transition: transform 0.3s ease; cursor: grab;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <img src="${item.imgUrl || "https://via.placeholder.com/40"}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; pointer-events: none;">
                    <div>
                        <div style="font-weight:600; font-size:13px; color:#111827;">${item.name}</div>
                        <div style="color:#1877F2; font-size:11px; margin-top:2px;">RM ${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                </div>
                <div class="qty-control flex items-center justify-between bg-gray-100 rounded-lg p-1" style="width:70px; flex:none;">
                    <button type="button" class="qty-btn w-6 h-6 rounded bg-white font-bold" onclick="updateEditCartQty('${id}', -1)">-</button>
                    <span class="qty-num text-xs font-bold text-center w-5">${item.qty}</span>
                    <button type="button" class="qty-btn w-6 h-6 rounded bg-white font-bold" onclick="updateEditCartQty('${id}', 1)">+</button>
                </div>
            </div>
        </div>`;
  }
  listContainer.innerHTML = html;
  document.getElementById("edit-cart-modal").classList.add("active");
}

function updateEditCartQty(id, delta) {
  if (!cartState[id]) return;
  cartState[id].qty += delta;
  if (cartState[id].qty <= 0) {
    delete cartState[id];
  }
  updateCartUI();
  if (Object.keys(cartState).length === 0) {
    closeModal("edit-cart-modal");
  } else {
    openEditCartPopup();
  }
}

function deleteEditCartItem(id) {
  delete cartState[id];
  updateCartUI();
  if (Object.keys(cartState).length === 0) {
    closeModal("edit-cart-modal");
  } else {
    openEditCartPopup();
  }
}

function openCheckout(type) {
  if (type === "product" && Object.keys(cartState).length === 0)
    return alert(i18n_index[currentLang]["alert-cart-empty"]);

  currentCheckoutData.type = type;
  const modal = document.getElementById("unified-checkout-modal");
  const shippingCard = document.getElementById("checkout-shipping-card");
  const itemsContainer = document.getElementById("checkout-items");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const feeLabelEl = document.getElementById("checkout-fee-label");
  const feeEl = document.getElementById("checkout-fee");
  const totalEl = document.getElementById("checkout-total-price");
  const titleEl = document.getElementById("checkout-shipping-title");

  document
    .getElementById("btn-confirm-unified")
    .classList.remove("btn-loading");

  let subtotal = 0;
  let fee = 0;
  let itemsHtml = "";

  if (type === "product") {
    shippingCard.style.display = "block";
    if (titleEl) titleEl.innerText = "Shipping Information";
    feeLabelEl.innerText = "Shipping Fee";
    fee = shopData.Settings?.shippingFee || 0;

    for (let id in cartState) {
      let item = cartState[id];
      subtotal += item.price * item.qty;
      itemsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:10px;"><div><div style="font-weight:600; font-size:13px; color:#111827;">${item.name}</div><div style="font-size:11px; color:#6B7280; margin-top:2px;">Qty: ${item.qty}</div></div><div style="font-weight:600; font-size:13px; color:#111827;">RM ${(item.price * item.qty).toFixed(2)}</div></div>`;
    }
  } else {
    shippingCard.style.display = type === "oncall" ? "block" : "none";
    if (type === "oncall" && titleEl)
      titleEl.innerText = "Location Information";

    feeLabelEl.innerText = "Service Fee";
    fee = shopData.Settings?.serviceFee || 0;
    subtotal = parseFloat(pendingBooking.price) || 0;

    let svcName = type === "oncall" ? "On-Call Service" : "In-Branch Service";
    let svcDetail =
      shopData.Haircuts?.find((h) => h.id == pendingBooking.service_id)?.name ||
      shopData.Treatments?.find((t) => t.id == pendingBooking.service_id)
        ?.name ||
      shopData.OnCall?.find((o) => o.id == pendingBooking.service_id)?.name ||
      "Servis";
    itemsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:10px;"><div><div style="font-weight:600; font-size:13px; color:#111827;">${svcName}</div><div style="font-size:11px; color:#6B7280; margin-top:2px;">${svcDetail} (${pendingBooking.date})</div></div><div style="font-weight:600; font-size:13px; color:#111827;">RM ${subtotal.toFixed(2)}</div></div>`;
  }

  let total = subtotal + fee;
  currentCheckoutData.subtotal = subtotal;
  currentCheckoutData.fee = fee;
  currentCheckoutData.total = total;

  itemsContainer.innerHTML = itemsHtml;
  subtotalEl.innerText = `RM ${subtotal.toFixed(2)}`;
  feeEl.innerText = `RM ${fee.toFixed(2)}`;
  totalEl.innerText = `RM ${total.toFixed(2)}`;

  let userAddr =
    type === "oncall" ? pendingBooking.address : currentUser?.address;
  document.getElementById("checkout-address-text").innerText =
    userAddr || "Sila klik pensel untuk tetapkan alamat.";

  if (window.renderDynamicQR) {
    window.renderDynamicQR(total);
  }

  modal.classList.add("active");
}

function showSuccessScreen() {
  const successScreen = document.getElementById("success-screen");
  successScreen.classList.add("active");
  setTimeout(() => {
    document
      .getElementById("unified-checkout-modal")
      .classList.remove("active");
  }, 400);
}

function closeSuccessScreen() {
  const successScreen = document.getElementById("success-screen");
  successScreen.classList.remove("active");
  setTimeout(() => {
    document.querySelectorAll("form").forEach((f) => f.reset());
    switchView("notifications");
  }, 500);
}

async function confirmUnifiedPayment() {
  const addrText = document.getElementById("checkout-address-text").innerText;

  if (
    (currentCheckoutData.type === "product" ||
      currentCheckoutData.type === "oncall") &&
    (addrText.includes("Sila") || addrText.trim() === "")
  )
    return alert("Sila kemas kini alamat penghantaran anda.");

  const paymentMethod = document.getElementById("radio-fpx").checked ? "fpx" : "qr";
  let receiptBase64 = null;

  if (paymentMethod === "qr") {
    const fileInput = document.getElementById("checkout-receipt-upload");
    if (!fileInput.files || fileInput.files.length === 0) {
      return alert("Sila muat naik resit transaksi anda untuk bayaran QR.");
    }
    try {
      receiptBase64 = await readFileAsBase64(fileInput.files[0]);
    } catch (e) {
      return alert("Gagal membaca fail resit. Sila cuba lagi.");
    }
  }

  const btn = document.getElementById("btn-confirm-unified");
  btn.classList.add("btn-loading");

  let payload = {};
  let endpoint = "";

  if (currentCheckoutData.type === "product") {
    payload = {
      cart_items: cartState,
      address: addrText,
      total_price: currentCheckoutData.total,
      payment_method: paymentMethod,
      receipt_url: receiptBase64,
    };
    endpoint = "/bookings/products";
  } else if (currentCheckoutData.type === "oncall") {
    payload = {
      address: addrText,
      date: pendingBooking.date,
      time: pendingBooking.time,
      service_id: pendingBooking.service_id,
      barber: pendingBooking.barber,
      payment_method: paymentMethod,
      receipt_url: receiptBase64,
    };
    endpoint = "/bookings/oncall";
  } else {
    // Normal Booking
    payload = {
      booking_type: pendingBooking.type,
      service_id: pendingBooking.service_id,
      staff_id: pendingBooking.barber,
      branch_id: pendingBooking.branch_id,
      booking_date: pendingBooking.date,
      booking_time: pendingBooking.time,
      payment_method: paymentMethod,
      receipt_url: receiptBase64,
    };
    endpoint = "/bookings";
  }

  fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then((res) => (res ? res.json() : null))
    .then((data) => {
      if (data && data.status === "success") {
        if (paymentMethod === "fpx" && data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          showSuccessScreen();
        }
      } else {
        alert("Ralat: " + (data ? data.message : "Sila cuba lagi."));
        btn.classList.remove("btn-loading");
      }
    })
    .catch((e) => {
      alert("Ralat Server.");
      btn.classList.remove("btn-loading");
    });
}

function changeTempQty(id, delta) {
  let el = document.getElementById("temp-qty-" + id);
  if (!el) return;
  let val = parseInt(el.innerText) + delta;
  if (val < 1) val = 1;
  el.innerText = val;
}
function addToCart(id, name, price, imgUrl) {
  let qtyEl = document.getElementById("temp-qty-" + id);
  let qty = parseInt(qtyEl.innerText);
  if (cartState[id]) {
    cartState[id].qty += qty;
  } else {
    cartState[id] = { id, name, price, imgUrl, qty };
  }
  qtyEl.innerText = 1;
  updateCartUI();
  showToast(i18n_index[currentLang]["alert-cart-updated"]);
}
function updateCartUI() {
  let totalItems = 0;
  let totalPrice = 0;
  for (let id in cartState) {
    totalItems += cartState[id].qty;
    totalPrice += cartState[id].price * cartState[id].qty;
  }
  document.getElementById("cart-count").innerText = `${totalItems} items`;
  document.getElementById("checkout-total").innerText =
    `RM ${totalPrice.toFixed(2)}`;
  if (totalItems > 0) {
    document.getElementById("checkout-bar").classList.add("visible");
  } else {
    document.getElementById("checkout-bar").classList.remove("visible");
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

function renderNotifications() {
  const container = document.getElementById("notifications-list-container");
  if (!currentUser) {
    container.innerHTML =
      '<div style="text-align:center; padding: 40px 20px; color:var(--text-muted); font-size:13px;">Sila Log Masuk untuk melihat status pesanan.</div>';
    return;
  }
  container.innerHTML =
    '<div style="text-align:center; padding: 20px; color:var(--text-muted); font-size:13px;">Memuat turun notifikasi...</div>';
  fetchWithAuth(`${API_BASE_URL}/bookings/my-orders`)
    .then((res) => (res ? res.json() : null))
    .then((data) => {
      if (!data || data.status !== "success") {
        container.innerHTML =
          '<div style="text-align:center; padding: 20px; color:var(--text-muted); font-size:13px;">Gagal memuat turun.</div>';
        return;
      }
      if (data.orders.length === 0) {
        container.innerHTML =
          '<div style="text-align:center; padding: 40px 20px; color:var(--text-muted); font-size:13px;">Tiada rekod pesanan buat masa ini.</div>';
        return;
      }
      
      let servicesHtml = "";
      let productsHtml = "";

      data.orders.forEach((o) => {
        if (o.type === "product") {
          let badgeStyle =
            o.status === "Preparing"
              ? "background:#FFF3E0; color:#E65100;"
              : o.status === "Shipped"
                ? "background:#E3F2FD; color:#1565C0;"
                : "background:#E8F5E9; color:#2E7D32;";
          let trackInfo =
            (o.status === "Shipped" || o.status === "Delivered") &&
            o.tracking_no
              ? `<div style="font-size:13px; margin-top:8px; font-weight:700; color:var(--primary-blue); background:#F0F4FF; padding:8px 12px; border-radius:8px;">Tracking No: <span style="letter-spacing:1px; color:#1C1C1E;">${o.tracking_no}</span></div>`
              : "";
          let actionBtn =
            o.status === "Shipped"
              ? `<button class="submit-btn" style="margin-top:12px; padding:12px; background:#34C759;" onclick="confirmOrderReceived('${o.id}')">Pesanan Diterima (Received)</button>`
              : "";
          let itemsStr = "Pesanan Produk";
          try {
            let items =
              typeof o.senarai_produk === "string"
                ? JSON.parse(o.senarai_produk)
                : o.senarai_produk;
            let names = [];
            for (let k in items)
              names.push(`${items[k].name} (x${items[k].qty})`);
            itemsStr = names.join(", ");
          } catch (e) {}
          productsHtml += `<div style="background:var(--bg-surface); padding:18px; border-radius:16px; margin-bottom:15px; border:1px solid var(--border-color); box-shadow:0 4px 10px rgba(0,0,0,0.02);"><div style="display:flex; justify-content:space-between; align-items:flex-start;"><span style="font-size:12px; font-weight:800; color:var(--text-muted); font-family:monospace;">ID: ${o.id.substring(0, 8).toUpperCase()}</span><span style="font-size:10px; font-weight:800; padding:6px 10px; border-radius:8px; ${badgeStyle}">${o.status.toUpperCase()}</span></div><div style="font-size:14px; font-weight:700; margin-top:10px; color:var(--text-main); line-height:1.4;">${itemsStr}</div>${trackInfo}${actionBtn}</div>`;
        } else {
          let badgeStyle =
            o.status === "Belum"
              ? "background:#FFF3E0; color:#E65100;"
              : "background:#E8F5E9; color:#2E7D32;";
          let displayStatus =
            o.status === "Belum" ? "AKTIF" : o.status.toUpperCase();
          servicesHtml += `<div style="background:var(--bg-surface); padding:18px; border-radius:16px; margin-bottom:15px; border:1px solid var(--border-color); box-shadow:0 4px 10px rgba(0,0,0,0.02);"><div style="display:flex; justify-content:space-between; align-items:flex-start;"><span style="font-size:13px; font-weight:800; color:var(--primary-blue); font-family:monospace;">NO: ${o.id}</span><span style="font-size:10px; font-weight:800; padding:6px 10px; border-radius:8px; ${badgeStyle}">${displayStatus}</span></div><div style="font-size:14px; font-weight:700; margin-top:8px; color:var(--text-main);">${o.service_name}</div><div style="font-size:12px; color:var(--text-muted); margin-top:4px; font-weight:600;"><i class="fas fa-calendar-alt"></i> ${o.date} &nbsp; <i class="fas fa-clock"></i> ${o.time}</div></div>`;
        }
      });
      
      let finalHtml = "";
      if (servicesHtml !== "") {
        finalHtml += `<div style="font-weight:600; font-size:14px; margin: 10px 0 12px; color:var(--text-muted);">Booking Service</div>`;
        finalHtml += servicesHtml;
      }
      if (productsHtml !== "") {
        finalHtml += `<div style="font-weight:600; font-size:14px; margin: ${servicesHtml !== "" ? '25px' : '10px'} 0 12px; color:var(--text-muted);">Order Product</div>`;
        finalHtml += productsHtml;
      }

      container.innerHTML = finalHtml;
    });
}
function confirmOrderReceived(id) {
  if (!confirm("Pasti telah menerima pesanan ini?")) return;
  fetchWithAuth(`${API_BASE_URL}/bookings/products/${id}/receive`, {
    method: "PUT",
  })
    .then((res) => (res ? res.json() : null))
    .then((data) => {
      if (data && data.status === "success") {
        showToast("Selesai.");
        renderNotifications();
      }
    });
}
function submitCustomerReview(event) {
  event.preventDefault();
  const orderNo = document.getElementById("review-orderno").value.trim();
  const stars = document.getElementById("review-stars").value;
  const text = document.getElementById("review-text").value.trim();
  if (!orderNo || !text) return alert("Sila isi.");
  const btn = document.getElementById("btn-review-submit");
  btn.innerText = "Menghantar...";
  btn.disabled = true;
  fetchWithAuth(`${API_BASE_URL}/bookings/reviews`, {
    method: "POST",
    body: JSON.stringify({
      order_no: orderNo,
      stars: stars,
      review_text: text,
    }),
  })
    .then((res) => (res ? res.json() : null))
    .then((data) => {
      if (data && data.status === "success") {
        showToast("Terima kasih!");
        event.target.reset();
        fetchShopData().then(() => renderHomeReviews());
      } else {
        alert("Ralat");
      }
      btn.innerText = "Hantar Ulasan";
      btn.disabled = false;
    })
    .catch((err) => {
      btn.innerText = "Hantar Ulasan";
      btn.disabled = false;
    });
}

// [DIBAIKI] Penggunaan escapeHTML pada setiap string dari database
function renderHomeReviews() {
  let reviews = shopData.Reviews || [];
  const container = document.querySelector(".reviews-container");
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; font-size:12px; color:var(--text-muted); font-weight:600;">Belum ada ulasan daripada pelanggan.</div>`;
    return;
  }

  let html1 = "";
  let html2 = "";
  reviews.forEach((r, i) => {
    let starsHtml = "★".repeat(r.stars || 5) + "☆".repeat(5 - (r.stars || 5));

    let card = `<div class="review-card">
                        <div class="review-header">
                            <div class="avatar-circle">
                                <img src="${r.avatar || "./Profile/1.png"}" onerror="this.src='./Profile/1.png'">
                            </div>
                            <div class="reviewer-info">
                                <div class="reviewer-name">${escapeHTML(r.name)}</div>
                                <div class="stars">${starsHtml}</div>
                            </div>
                        </div>
                        <div class="review-text">"${escapeHTML(r.text)}"</div>
                        <div class="service-tag">${escapeHTML(r.service)}</div>
                    </div>`;

    if (i % 2 === 0) html1 += card;
    else html2 += card;
  });

  if (reviews.length > 0) {
    html1 += html1;
    html2 += html2;
  }
  container.innerHTML = `<div class="marquee-track track-left">${html1}</div><div class="marquee-track track-right" style="margin-top:10px;">${html2}</div>`;
}

function setMinDate() {
  let tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  let minD = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, "0")}-${String(tmr.getDate()).padStart(2, "0")}`;
  document
    .querySelectorAll('input[type="date"]')
    .forEach((inp) => (inp.min = minD));
}
function showToast(msg) {
  let t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

function switchServiceTab(tName) {
  ["haircuts", "treatments", "oncall"].forEach((x) => {
    document.getElementById("services-" + x).style.display = "none";
  });
  document.getElementById("services-" + tName).style.display = "block";
}

function toggleAccordion(id) {
  let card = document.getElementById("card-" + id);
  if (!card) return;
  let isActive = card.classList.contains("active");
  document
    .querySelectorAll(".service-card-wrapper")
    .forEach((w) => w.classList.remove("active"));
  if (!isActive) card.classList.add("active");
}
function switchView(id) {
  document
    .querySelectorAll(".view-section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("view-" + id)?.classList.add("active");
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("nav-" + id)?.classList.add("active");
  window.scrollTo(0, 0);
  if (id === "notifications") {
    renderNotifications();
  }
}


// Handle bar drag down to close modal
const dragHandleArea = document.getElementById('drag-handle-area');
const editCartSheet = document.querySelector('.edit-cart-sheet');
let modalStartY = 0;
let modalCurrentY = 0;
let isDraggingModal = false;

if (dragHandleArea && editCartSheet) {
  dragHandleArea.addEventListener('pointerdown', (e) => {
    isDraggingModal = true;
    modalStartY = e.clientY;
    editCartSheet.style.transition = 'none';
    dragHandleArea.setPointerCapture(e.pointerId);
  });
  dragHandleArea.addEventListener('pointermove', (e) => {
    if (!isDraggingModal) return;
    modalCurrentY = e.clientY;
    const diff = modalCurrentY - modalStartY;
    if (diff > 0) {
      editCartSheet.style.transform = `translateY(${diff}px)`;
    }
  });
  const handlePointerEnd = (e) => {
    if (!isDraggingModal) return;
    isDraggingModal = false;
    dragHandleArea.releasePointerCapture(e.pointerId);
    editCartSheet.style.transition = 'transform 0.3s ease-out';
    if (modalCurrentY > 0 && modalCurrentY - modalStartY > 50) {
      closeModal('edit-cart-modal');
    }
    editCartSheet.style.transform = '';
    modalStartY = 0;
    modalCurrentY = 0;
  };
  dragHandleArea.addEventListener('pointerup', handlePointerEnd);
  dragHandleArea.addEventListener('pointercancel', handlePointerEnd);
}

function selectPaymentMethod(method) {
  const fpxRow = document.getElementById('pm-fpx-row');
  const qrRow = document.getElementById('pm-qr-row');
  const radioFpx = document.getElementById('radio-fpx');
  const radioQr = document.getElementById('radio-qr');
  const fpxInfo = document.getElementById('fpx-info-area');
  const qrInfo = document.getElementById('qr-info-area');

  if (method === 'fpx') {
    radioFpx.checked = true;
    fpxRow.style.borderColor = 'var(--primary-blue)';
    qrRow.style.borderColor = 'var(--border-color)';
    fpxInfo.style.display = 'block';
    qrInfo.style.display = 'none';
  } else {
    radioQr.checked = true;
    qrRow.style.borderColor = 'var(--primary-blue)';
    fpxRow.style.borderColor = 'var(--border-color)';
    qrInfo.style.display = 'block';
    fpxInfo.style.display = 'none';
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// Helper to copy account number
window.copyAccNum = function(acc) {
  navigator.clipboard.writeText(acc).then(() => {
    showToast("Nombor akaun disalin!"); // Using existing showToast instead of alert
  }).catch(err => {
    alert("Gagal menyalin nombor akaun.");
  });
};

// Fetch bank info
fetch('bank-info.json')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('bank-info-container');
    const nameDisplay = document.getElementById('bank-name-display');
    
    if (nameDisplay && data.bankName) {
      nameDisplay.innerText = data.bankName;
    }

    if (container && data) {
      container.innerHTML = `
        <div>${data.ownerName}</div>
        <div onclick="copyAccNum('${data.accountNumber}')" style="font-size: 16px; margin-top: 4px; letter-spacing: 1px; cursor: pointer; color: var(--primary-blue); display: inline-flex; align-items: center; gap: 8px;" title="Klik untuk Salin">
          ${data.accountNumber} <i class="far fa-copy" style="font-size: 14px;"></i>
        </div>
      `;
    }
  })
  .catch(e => console.error('Error fetching bank info:', e));

// EMVCo CRC16 for DuitNow
function calculateCRC16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) > 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function generateDynamicDuitNow(amount) {
  let staticPayload = "00020201021126690014A000000615000101065887340220MAEPP111187656109828031317576685858065204000053034585802MY5924MUHAMMAD ZAFRAN BIN MOHD6002MY6304083C";
  // Tukar tag Point of Initiation dari Static (11) kepada Dynamic (12)
  let dynamicPayload = staticPayload.replace("010211", "010212");
  
  let amtStr = parseFloat(amount).toFixed(2);
  let amtLen = amtStr.length.toString().padStart(2, '0');
  let tag54 = "54" + amtLen + amtStr;
  
  // Masukkan Tag 54 SEBELUM Tag 58 (Country Code) untuk patuhi turutan EMVCo
  let insertIndex = dynamicPayload.indexOf("5802MY");
  let baseStr = dynamicPayload.substring(0, insertIndex) + tag54 + dynamicPayload.substring(insertIndex, dynamicPayload.length - 4);
  
  let newCrc = calculateCRC16(baseStr);
  return baseStr + newCrc;
}

window.renderDynamicQR = function(amount) {
  const payload = generateDynamicDuitNow(amount);
  const qrImage = document.getElementById('dynamic-qr-image');
  const qrDownload = document.getElementById('dynamic-qr-download');
  
  if (typeof QRCode !== 'undefined' && qrImage) {
    QRCode.toDataURL(payload, { 
      width: 250, 
      margin: 1, 
      color: { dark: '#0f172a', light: '#ffffff' } 
    }, function (err, url) {
      if (!err) {
         qrImage.src = url;
         qrDownload.href = url;
      }
    });
  }
};
