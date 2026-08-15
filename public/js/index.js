const IS_LOCALHOST = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST ? "http://localhost:3000/api" : "https://api.dinspirebarbershop.com/api";
const VAPID_PUBLIC_KEY = "BDwYmNxy-sQG489E0z2c0-gM9i22V-7X0q4Vq-j4_9Nq8Q0O2-l5P9T4n9X0-4_4Q";

if (
  !window.matchMedia("(display-mode: standalone)").matches &&
  !navigator.standalone
)
  setTimeout(() => {
    const prompt = document.getElementById("pwa-prompt");
    if (prompt) prompt.style.display = "block";
  }, 4000);

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

  // Retrigger greeting animation
  if (typeof playGreetingAnimation === "function" && typeof currentUser !== "undefined") {
    let nameStr = currentUser ? escapeHTML(currentUser.name || currentUser.username) : (i18n_index[lang] ? i18n_index[lang]["home-guest"].replace(" :)", "") : "new friend");
    playGreetingAnimation(nameStr);
  }

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
  if (window.location.search.includes("fpx=return")) {
    const swooshLoader = document.querySelector(".preloader");
    const clipperLoader = document.getElementById("preloader");
    if (swooshLoader) swooshLoader.style.display = "none";
    if (clipperLoader) clipperLoader.style.display = "none";
  }

  initAppDb();
  checkLoginState();
  if (window.location.search.includes("fpx=return")) {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("order_id");
    const statusId = urlParams.get("status_id");
    const transactionId = urlParams.get("transaction_id") || urlParams.get("billcode");
    
    if (orderId && statusId) {
      fetch(`${API_BASE_URL}/bookings/fpx/verify?order_id=${orderId}&status_id=${statusId}&transaction_id=${transactionId}`)
        .catch(err => console.error("FPX Verify fallback failed:", err));
    }

    if (statusId === "1") {
      switchView("home");
      showSuccessScreen();
    } else {
      switchView("notifications");
      setTimeout(() => {
          showToast("Bayaran anda sedang diproses atau tidak berjaya. Sila semak status pesanan anda.");
      }, 1000);
    }
    
    setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }, 1500);
  } else {
    switchView("home");
  }
  setupOtpInputs("log-otp-inputs", "log-otp");
  setupOtpInputs("reg-otp-inputs", "reg-otp");
  setupStarRating();
  initEventListeners();
  generateAvatarGrid();
  renderNotifications();
  await fetchShopData();
  
  // Load bank info
  try {
    const bRes = await fetch("/bank-info.json");
    if (bRes.ok) {
      bankInfo = await bRes.json();
      const bInfoEl = document.getElementById("checkout-bank-info");
      if (bInfoEl && bankInfo) {
        bInfoEl.innerHTML = `
          <div style="margin-bottom: 2px;">${escapeHTML(bankInfo.bankName || "")}</div>
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">${escapeHTML(bankInfo.ownerName || "")}</div>
          <div style="font-size: 15px; letter-spacing: 1px; color: var(--primary-blue); font-family: monospace; margin-top: 4px;">${escapeHTML(bankInfo.accountNumber || "")}</div>
        `;
      }
    }
  } catch (e) {
    console.error("Failed to load bank info:", e);
  }

  renderHomeReviews();
  updateCartUI();
  
  hideGlobalLoader();
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
  const remember = document.getElementById("login-remember").checked;
  
  if (!password) return alert("Sila masukkan kata laluan!");
  
  const btn = document.getElementById("btn-login-submit");
  btn.innerText = "Mengesahkan...";
  btn.disabled = true;
  fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ phone, password, remember }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        if (remember) {
          localStorage.setItem("din_logged_user", JSON.stringify(data.user));
        } else {
          sessionStorage.setItem("din_logged_user", JSON.stringify(data.user));
        }
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
      sessionStorage.removeItem("din_logged_user");
      checkLoginState();
      if (askConfirm) showToast("Telah log keluar.");
    });
  }
}

  let typingTimeout;
  function playGreetingAnimation(name) {
    let container = document.getElementById('home-greeting-container');
    if (!container) {
      // Fallback untuk cache lama
      const headerDiv = document.querySelector('.header > div');
      if (headerDiv) {
        container = headerDiv.querySelector('h1');
        if (container) container.id = 'home-greeting-container';
      }
    }
    if (!container) return;
    clearTimeout(typingTimeout);

    container.innerHTML = '<span id="typing-text"></span><span class="typing-cursor">|</span>';
    const textElement = document.getElementById('typing-text');
    const cursorElement = document.querySelector('.typing-cursor');

    const lang = localStorage.getItem("user_lang") || "en";
    const i18n = typeof i18n_index !== "undefined" ? i18n_index[lang] : null;
    
    const prefix = i18n ? (i18n["home-welcome"] || "Hello ") : "Hello ";
    const greeting1 = prefix + name + " :)";

    const hour = new Date().getHours();
    let timeGreetingKey = "home-night";
    if (hour >= 5 && hour < 12) timeGreetingKey = "home-morning";
    else if (hour >= 12 && hour < 17) timeGreetingKey = "home-afternoon";
    else if (hour >= 17 && hour < 20) timeGreetingKey = "home-evening";

    let timeText = i18n ? (i18n[timeGreetingKey] || "Good day") : "Good day";
    const greeting2 = timeText + ", " + name + "!";

    let i = 0;
    let phase = 0;
    
    function type() {
      if (!textElement) return;
      if (phase === 0) {
        textElement.innerText = greeting1.substring(0, i + 1);
        i++;
        if (i === greeting1.length) {
          phase = 1;
          typingTimeout = setTimeout(type, 1500); 
        } else {
          typingTimeout = setTimeout(type, 80);
        }
      } else if (phase === 1) {
        phase = 2;
        type();
      } else if (phase === 2) {
        textElement.innerText = greeting1.substring(0, i - 1);
        i--;
        if (i === 0) {
          phase = 3;
          typingTimeout = setTimeout(type, 300);
        } else {
          typingTimeout = setTimeout(type, 40);
        }
      } else if (phase === 3) {
        textElement.innerText = greeting2.substring(0, i + 1);
        i++;
        if (i === greeting2.length) {
          if (cursorElement) cursorElement.classList.add('blink');
          phase = 4;
          typingTimeout = setTimeout(type, 3000); // Tunggu 3 saat sebelum buang semula
        } else {
          typingTimeout = setTimeout(type, 80);
        }
      } else if (phase === 4) {
        if (cursorElement) cursorElement.classList.remove('blink');
        phase = 5;
        type();
      } else if (phase === 5) {
        textElement.innerText = greeting2.substring(0, i - 1);
        i--;
        if (i === 0) {
          phase = 0; // Kembali ke Hello
          typingTimeout = setTimeout(type, 500);
        } else {
          typingTimeout = setTimeout(type, 40);
        }
      }
    }
    
    // Delay 3 saat pada mulanya supaya skrin loading (preloader) sempat hilang
    typingTimeout = setTimeout(type, 3000);
  }

  function checkLoginState() {
    let session = localStorage.getItem("din_logged_user") || sessionStorage.getItem("din_logged_user");
    let nameStr = "new friend";
    
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
      nameStr = escapeHTML(currentUser.name || currentUser.username);
    } else {
      currentUser = null;
      document.getElementById("account-logged-out").style.display = "block";
      document.getElementById("account-logged-in").style.display = "none";
      const lang = localStorage.getItem("user_lang") || "en";
      const i18n = typeof i18n_index !== "undefined" ? i18n_index[lang] : null;
      nameStr = i18n ? i18n["home-guest"].replace(" :)", "") : "new friend";
    }
    
    playGreetingAnimation(nameStr);
  }

function openAvatarModal() {
  document.getElementById("avatar-modal-overlay").classList.add("active");
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("active");
    el.style.display = "";
  }
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

let currentBarberLeaves = [];
let currentBarberBookings = [];

async function openScheduleModal(formId) {
  const barberSelect = document.getElementById(`barber-${formId}`);
  if (!barberSelect || !barberSelect.value) {
     if (typeof Swal !== "undefined") {
       Swal.fire({
          icon: 'warning',
          title: 'Perhatian',
          text: 'Sila pilih Barber terlebih dahulu sebelum menetapkan tarikh dan masa.',
          confirmButtonColor: '#3b82f6'
       });
     } else {
       alert('Sila pilih Barber terlebih dahulu!');
     }
     return;
  }
  const barberId = barberSelect.value;
  
  activeScheduleFormId = formId;
  scheduleMonthOffset = 0;

  let tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  scheduleSelectedDate = tmr;
  scheduleSelectedTime = null;

  document.getElementById("schedule-modal").style.display = "flex";
  
  try {
     const res = await fetch(`${API_BASE_URL}/bookings/staff-availability?staff_id=${barberId}`);
     const data = await res.json();
     currentBarberLeaves = data.leaves || [];
     currentBarberBookings = data.bookings || [];
  } catch (err) {
     currentBarberLeaves = [];
     currentBarberBookings = [];
  }

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
  const dateObj = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj <= today) return; // Tarikh lepas
  if (currentBarberLeaves.includes(dateStr)) {
    if (typeof Swal !== "undefined") Swal.fire('Cuti', 'Barber sedang bercuti pada tarikh ini.', 'info');
    else showToast('Barber sedang bercuti pada tarikh ini.');
    return;
  }

  scheduleSelectedDate = dateObj;
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
    let isLeave = currentBarberLeaves.includes(dateString);
    let bookedCount = currentBarberBookings.filter(b => b.tarikh === dateString).length;
    let isFullyBooked = bookedCount >= 7;
    let isSelected = cellDate.getTime() === scheduleSelectedDate.getTime();

    let classes = ["cal-date-dark"];
    if (isPastOrToday) {
       classes.push("disabled");
    } else if (isLeave) {
       classes.push("disabled");
    } else if (isFullyBooked) {
       classes.push("fully-booked");
    }
    
    if (isSelected && !isPastOrToday && !isLeave && !isFullyBooked) classes.push("selected");

    let onclickAttr = (isPastOrToday || isLeave || isFullyBooked) ? "" : `onclick="selectScheduleDate('${dateString}'); event.stopPropagation();"`;

    html += `<div class="${classes.join(" ")}" ${onclickAttr}>${d}</div>`;
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

  let selectedDateStr = `${scheduleSelectedDate.getFullYear()}-${String(scheduleSelectedDate.getMonth() + 1).padStart(2, "0")}-${String(scheduleSelectedDate.getDate()).padStart(2, "0")}`;
  
  let bookedTimes = currentBarberBookings
    .filter(b => b.tarikh === selectedDateStr)
    .map(b => b.masa.substring(0, 5));

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

    if (isDisabled) {
        // [DIBAIKI] Tunjuk secara visual bahawa waktu sudah ditempah
        html += `<button type="button" class="time-slot-light disabled" style="opacity: 0.5; background: #f3f4f6; color: #9ca3af; cursor: not-allowed; border-color: #e5e7eb; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2;" onclick="event.stopPropagation();">${format12}</button>`;
    } else {
        html += `<button type="button" class="time-slot-light ${isSel}" onclick="selectScheduleTime('${t}'); event.stopPropagation();">${format12}</button>`;
    }
  });

  html += `</div>`;
  container.innerHTML = html;
}

async function fetchShopData() {
  showGlobalLoader();
  try {
    const timestamp = new Date().getTime();
    const res = await fetch(`${API_BASE_URL}/shop-data?t=${timestamp}`);
    shopData = await res.json();
    let bOpts =
      `<option value="" disabled selected>Pilih Cawangan</option>` +
      (shopData.Branches || [])
        .map((b) => `<option value="${b.id}">${escapeHTML(b.name)}</option>`)
        .join("");

    const buildCard = (arr, prefix, tab, category) =>
      arr
        .map(
          (x, i) => `
      <div class="service-card-wrapper rgb-border-container" id="card-${prefix}${i}">
        <div class="card-inner rgb-border-inner service-card-inner">
          <div class="card-header"><div><h3>${escapeHTML(x.name)}</h3><p style="font-weight:500; font-size:11px; margin-top:3px;">${escapeHTML(x.desc || "Tiada diskripsi")}</p></div><div class="price">RM${parseFloat(x.price).toFixed(2)}</div></div>
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
      
    renderHomeBranches();

    let oncallSvc = document.getElementById("oncall-service-dropdown");
    if (oncallSvc)
      oncallSvc.innerHTML =
        `<option value="" disabled selected>Pilih Servis</option>` +
        (shopData.OnCall || [])
          .map(
            (s) => `<option value="${s.id}">${escapeHTML(s.name)} - RM${s.price}</option>`,
          )
          .join("");

    let oncallBarber = document.getElementById("oncall-barber-dropdown");
    if (oncallBarber)
      oncallBarber.innerHTML =
        `<option value="" disabled selected>Pilih Barber</option>` +
        (shopData.OnCallBarbers || [])
          .map((b) => `<option value="${b.id}">${escapeHTML(b.name)}</option>`).join("");

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
          viewport.onscroll = () => {
            const firstSlide = viewport.querySelector('.slide');
            if (!firstSlide) return;
            const gap = parseFloat(window.getComputedStyle(posterTrack).gap) || 0;
            const slideWidth = firstSlide.offsetWidth + gap;
            const index = Math.round(viewport.scrollLeft / slideWidth);
            const dots = paginationContainer.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
              if (i === index) dot.classList.add('active');
              else dot.classList.remove('active');
            });
          };
        }
  
        if (window.sliderInterval) clearInterval(window.sliderInterval);
        if (shopData.Posters.length > 1) {
          window.sliderInterval = setInterval(() => {
            if (!viewport || !viewport.offsetParent || document.hidden) return;
            
            const firstSlide = viewport.querySelector('.slide');
            if (!firstSlide) return;
            const gap = parseFloat(window.getComputedStyle(posterTrack).gap) || 0;
            const slideWidth = firstSlide.offsetWidth + gap;
            
            const maxScroll = viewport.scrollWidth - viewport.clientWidth;
            const currentIndex = Math.round(viewport.scrollLeft / slideWidth);
            const isLastSlide = currentIndex >= shopData.Posters.length - 1;
            if (isLastSlide || viewport.scrollLeft >= maxScroll - 10) {
              // At the end, go back to start
              viewport.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              // Scroll to next slide
              viewport.scrollTo({ left: viewport.scrollLeft + slideWidth, behavior: 'smooth' });
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
    console.error("Gagal load shop data:", err);
  } finally {
    hideGlobalLoader();
    setTimeout(() => {
      const loading = document.getElementById("loading");
      if (loading) loading.style.display = "none";
    }, 800);
  }
}

function updBarber(sel, id) {
  let bSelect = document.getElementById("barber-" + id);
  let selectedBranch = String(sel.value).trim();
  let arr = (shopData.Barbers || []).filter(
    (b) => {
      if (String(b.branch_id).trim() !== selectedBranch) return false;
      if (id.startsWith("hc") && b.can_haircut === false) return false;
      if (id.startsWith("tr") && b.can_treatment === false) return false;
      return true;
    }
  );
  bSelect.innerHTML =
    arr.length > 0
      ? `<option value="" disabled selected>Pilih Barber</option>` +
        arr.map((b) => `<option value="${b.id}">${escapeHTML(b.name)}</option>`).join("")
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
        (p) => {
          const stockLeft = parseInt(p.stok) || 0;
          const isOutOfStock = stockLeft <= 0;
          const btnClass = isOutOfStock ? "text-white rounded-lg px-2 py-1.5 text-xs font-bold" : "bg-gray-600 text-white rounded-lg px-2 py-1.5 text-xs font-bold";
          const btnStyle = isOutOfStock ? "background-color: #9ca3af; cursor: not-allowed; opacity: 0.7;" : "";
          const btnText = i18n_index[currentLang]["products-btn-add"];
          
          let imgOverlay = "";
          let stockBadge = "";
          
          if (isOutOfStock) {
              imgOverlay = `<div style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,255,255,0.4); display:flex; justify-content:center; align-items:center; z-index:10; border-radius:10px; overflow:hidden;"><span style="color:rgba(0,0,0,0.3); font-size:20px; font-weight:900; transform: rotate(-25deg); letter-spacing: 2px; user-select:none; white-space:nowrap;">HABIS STOK</span></div>`;
          } else {
              stockBadge = `<div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold; z-index:11;">Baki Stok: ${stockLeft}</div>`;
          }

          return `
            <div class="product-card" style="position:relative;">
                ${stockBadge}
                <div style="position:relative; margin-bottom:10px;">
                    ${imgOverlay}
                    <img src="${p.imageUrl || "https://via.placeholder.com/150"}" class="product-img" style="margin-bottom:0;" alt="${escapeHTML(p.name)}" onerror="this.src='https://via.placeholder.com/150'">
                </div>
                <div class="product-info">
                    <div class="product-title">${escapeHTML(p.name)}</div>
                    <div class="product-price">RM ${parseFloat(p.price).toFixed(2)}</div>
                    <div class="card-actions mt-auto pt-2">
                        <div class="qty-control flex items-center justify-between bg-gray-100 rounded-lg p-1 flex-1">
                            <button class="qty-btn w-6 h-6 rounded bg-white font-bold" onclick="changeTempQty('${p.id}', -1, ${stockLeft})">-</button>
                            <span class="qty-num text-xs font-bold text-center w-5" id="temp-qty-${p.id}">1</span>
                            <button class="qty-btn w-6 h-6 rounded bg-white font-bold" onclick="changeTempQty('${p.id}', 1, ${stockLeft})">+</button>
                        </div>
                        <button class="add-btn ${btnClass}" style="${btnStyle}" ${isOutOfStock ? "disabled" : ""} onclick="addToCart('${p.id}', '${escapeHTML(p.name || "")}', ${parseFloat(p.price)}, '${p.imageUrl}', ${stockLeft})">${btnText}</button>
                    </div>
                </div>
            </div>
        `;
        }
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
                        <div style="font-weight:600; font-size:13px; color:#111827;">${escapeHTML(item.name)}</div>
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
    
    if (delta > 0 && cartState[id].maxStock !== undefined) {
      if (cartState[id].qty + delta > cartState[id].maxStock) {
        return alert("Gagal menambah. Baki stok hanya tinggal " + cartState[id].maxStock + " unit.");
      }
    }

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
      itemsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:10px;"><div><div style="font-weight:600; font-size:13px; color:#111827;">${escapeHTML(item.name)}</div><div style="font-size:11px; color:#6B7280; margin-top:2px;">Qty: ${item.qty}</div></div><div style="font-weight:600; font-size:13px; color:#111827;">RM ${(item.price * item.qty).toFixed(2)}</div></div>`;
    }
  } else {
    shippingCard.style.display = type === "oncall" ? "block" : "none";
    if (type === "oncall" && titleEl)
      titleEl.innerText = "Location Information";

    feeLabelEl.innerText = "Service Fee";
    fee = type === "treatment" ? 0 : (shopData.Settings?.serviceFee || 0);
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
    
    // Kosongkan troli
    cartState = {};
    updateCartUI();
    document.querySelectorAll('[id^="temp-qty-"]').forEach(el => el.innerText = "1");
    
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

function changeTempQty(id, delta, maxStock) {
    let el = document.getElementById("temp-qty-" + id);
    if (!el) return;
    let val = parseInt(el.innerText) + delta;
    if (val < 1) val = 1;
    if (maxStock !== undefined && val > maxStock) {
        val = maxStock;
        showToast("Maaf, kuantiti melebihi stok sedia ada (" + maxStock + ").");
    }
    el.innerText = val;
  }
  function addToCart(id, name, price, imgUrl, maxStock) {
    let qtyEl = document.getElementById("temp-qty-" + id);
    let qty = parseInt(qtyEl.innerText);
    let currentInCart = cartState[id] ? cartState[id].qty : 0;
    
    if (maxStock !== undefined && (currentInCart + qty > maxStock)) {
       return alert("Gagal menambah. Baki stok hanya tinggal " + maxStock + " unit.");
    }
    
    if (cartState[id]) {
      cartState[id].qty += qty;
      cartState[id].maxStock = maxStock;
    } else {
      cartState[id] = { id, name, price, imgUrl, qty, maxStock };
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
  container.innerHTML = '';
  showGlobalLoader();
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
            o.status === "Pending Verification"
              ? "background:#FFF3CD; color:#856404;"
              : o.status === "Rejected"
                ? "background:#F8D7DA; color:#721C24;"
                : o.status === "Preparing"
                  ? "background:#FFF3E0; color:#E65100;"
                  : o.status === "Shipped"
                    ? "background:#E3F2FD; color:#1565C0;"
                    : "background:#E8F5E9; color:#2E7D32;";
          let trackInfo =
            (o.status === "Shipped" || o.status === "Received" || o.status === "Delivered") &&
            o.tracking_no
              ? `<div style="font-size:13px; margin-top:8px; font-weight:700; color:var(--primary-blue); background:#F0F4FF; padding:8px 12px; border-radius:8px;">Tracking No: <span style="letter-spacing:1px; color:#1C1C1E;">${escapeHTML(o.tracking_no)}</span></div>`
              : "";
          let actionBtn = "";
          if (o.status === "Shipped") {
              actionBtn = `<button class="submit-btn" style="margin-top:12px; padding:12px; background:#34C759;" onclick="confirmOrderReceived('${o.id}')">Pesanan Diterima (Received)</button>`;
          } else if (o.status === "Rejected") {
              actionBtn = `<a href="https://wa.me/60174836277?text=Sila hubungi pihak kedai kerana pesanan produk saya ditolak. ID: ${o.id}" target="_blank" class="submit-btn" style="display:block; text-align:center; text-decoration:none; margin-top:12px; padding:12px; background:#E53935; color:white;"><i class="fab fa-whatsapp mr-2"></i> Hubungi Kedai</a>`;
          }
          
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
          productsHtml += `<div style="background:var(--bg-surface); padding:14px; border-radius:10px; margin-bottom:10px; border:1px solid var(--border-color); box-shadow:0 4px 10px rgba(0,0,0,0.02);"><div style="display:flex; justify-content:space-between; align-items:flex-start;"><span style="font-size:12px; font-weight:800; color:var(--text-muted); font-family:monospace;">ID: ${o.id.substring(0, 8).toUpperCase()}</span><span style="font-size:10px; font-weight:800; padding:6px 10px; border-radius:8px; ${badgeStyle}">${o.status.toUpperCase()}</span></div><div style="font-size:14px; font-weight:700; margin-top:10px; color:var(--text-main); line-height:1.4;">${itemsStr}</div>${trackInfo}${actionBtn}</div>`;
        } else {
          let badgeStyle =
            o.status === "Pending Verification"
              ? "background:#FFF3CD; color:#856404;"
              : o.status === "Rejected" || o.status === "Batal"
                ? "background:#F8D7DA; color:#721C24;"
                : o.status === "Belum"
                  ? "background:#FFF3E0; color:#E65100;"
                  : "background:#E8F5E9; color:#2E7D32;";
          let displayStatus =
            o.status === "Belum" ? "AKTIF" : o.status.toUpperCase();
            
          let actionBtnService = "";
          if (o.status === "Rejected") {
              actionBtnService = `<a href="https://wa.me/60174836277?text=Sila hubungi pihak kedai kerana tempahan saya ditolak. NO: ${o.id}" target="_blank" class="submit-btn" style="display:block; text-align:center; text-decoration:none; margin-top:12px; padding:12px; background:#E53935; color:white;"><i class="fab fa-whatsapp mr-2"></i> Hubungi Kedai</a>`;
          } else if (o.status === "Batal") {
              if (o.cancelled_by === 'admin') {
                  actionBtnService = `<button class="submit-btn" style="display:block; width:100%; text-align:center; margin-top:12px; padding:12px; background:#007BFF; color:white;" onclick="triggerResetBooking('${o.id}', '${o.service_name}', '${o.staff_id}')"><i class="fas fa-undo-alt mr-2"></i> Reset Booking</button>`;
              } else {
                  actionBtnService = `<a href="https://wa.me/60174836277?text=cancelled booking%0Ano booking: ${o.id}%0A" target="_blank" class="submit-btn" style="display:block; text-align:center; text-decoration:none; margin-top:12px; padding:12px; background:#E53935; color:white;"><i class="fab fa-whatsapp mr-2"></i> Contact Us</a>`;
              }
          }
          
          servicesHtml += `<div style="background:var(--bg-surface); padding:14px; border-radius:10px; margin-bottom:10px; border:1px solid var(--border-color); box-shadow:0 4px 10px rgba(0,0,0,0.02);"><div style="display:flex; justify-content:space-between; align-items:flex-start;"><span style="font-size:13px; font-weight:800; color:var(--primary-blue); font-family:monospace;">NO: ${o.id}</span><span style="font-size:10px; font-weight:800; padding:6px 10px; border-radius:8px; ${badgeStyle}">${displayStatus}</span></div><div style="font-size:14px; font-weight:700; margin-top:8px; color:var(--text-main);">${o.service_name}</div><div style="font-size:12px; color:var(--text-muted); margin-top:4px; font-weight:600;"><i class="fas fa-calendar-alt"></i> ${o.date} &nbsp; <i class="fas fa-clock"></i> ${o.time}</div>${actionBtnService}</div>`;
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
    })
    .catch((err) => {
      container.innerHTML =
        '<div style="text-align:center; padding: 20px; color:var(--text-muted); font-size:13px;">Gagal memuat turun.</div>';
    })
    .finally(() => {
      hideGlobalLoader();
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
        alert(data && data.message ? data.message : "Ralat ketika menghantar ulasan.");
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
  function renderHomeBranches() {
    const container = document.getElementById("home-branches-container");
    if (!container) return;
    
    let branches = shopData.Branches || [];
    if (branches.length === 0) {
      container.innerHTML = `<div style="padding:20px; font-size:13px; color:var(--text-muted);">Tiada cawangan tersedia.</div>`;
      return;
    }
    
    // Placeholder image since DB doesn't have image column yet
    const placeholderImg = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80";
    
    const branchesHtml = branches.map(b => `
        <div class="branch-home-card">
          <img src="${escapeHTML(b.image_url || placeholderImg)}" alt="${escapeHTML(b.name)}">
          <div class="branch-home-info">
            <h3>${escapeHTML(b.name)}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${escapeHTML(b.location)}</p>
          </div>
        </div>
      `).join("");
      
      // Duplicate content 40 times to create a pseudo-endless manual swipe slider
      container.innerHTML = branchesHtml.repeat(40);
      
      // Letakkan skrol di tengah-tengah supaya "tiada permulaan" (boleh swipe ke kiri)
      setTimeout(() => {
        const card = container.querySelector('.branch-home-card');
        if (card) {
          const setWidth = branches.length * (card.offsetWidth + 15);
          container.scrollLeft = 20 * setWidth; // Mula di set ke-20
        }
      }, 150);
    }
  
  function renderHomeReviews() {
  let reviews = shopData.Reviews || [];
  const container = document.querySelector(".reviews-container");
  if (!container) return;
  
  // Update total customers & branches & satisfaction
  const totalCustomersEl = document.getElementById("total-customers-count");
  if (totalCustomersEl && shopData.TotalCustomers !== undefined) {
    totalCustomersEl.innerText = shopData.TotalCustomers.toLocaleString() + "+";
  }

  const totalBranchesEl = document.getElementById("total-branches-count");
  if (totalBranchesEl && shopData.Branches) {
    totalBranchesEl.innerText = shopData.Branches.length;
  }
  
  const custSatisfactionEl = document.getElementById("customer-satisfaction-count");
  if (custSatisfactionEl && shopData.CustomerSatisfaction !== undefined) {
    custSatisfactionEl.innerText = shopData.CustomerSatisfaction + "%";
  }

  if (reviews.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; font-size:12px; color:var(--text-muted); font-weight:600;">Belum ada ulasan daripada pelanggan.</div>`;
    return;
  }

  // Pastikan ada sekurang-kurangnya 4 ulasan untuk paparan berterusan
  let extendedReviews = [...reviews];
  while (extendedReviews.length < 4 && extendedReviews.length > 0) {
    extendedReviews = extendedReviews.concat(reviews);
  }

  let track1Reviews = [...extendedReviews];
  let track2Reviews = [...extendedReviews];
  // Alihkan susunan untuk track 2 supaya tak nampak sama
  if (track2Reviews.length > 1) {
    track2Reviews.push(track2Reviews.shift());
  }

  // Gandakan sekali lagi untuk efek marquee CSS
  track1Reviews = track1Reviews.concat(track1Reviews);
  track2Reviews = track2Reviews.concat(track2Reviews);

  const renderCard = (r) => {
    let starsHtml = "★".repeat(r.stars || 5) + "☆".repeat(5 - (r.stars || 5));
    return `<div class="review-card">
                        <div class="review-header">
                            <div class="review-header-left">
                                <div class="avatar-circle">
                                    <img src="${r.avatar || "./Profile/1.png"}" onerror="this.src='./Profile/1.png'">
                                </div>
                                <div class="reviewer-info">
                                    <div class="reviewer-name">${escapeHTML(r.name)}</div>
                                    <div class="review-time">${escapeHTML(r.branch || "Cawangan Dinspire")}</div>
                                </div>
                            </div>
                            <div class="stars">${starsHtml}</div>
                        </div>
                        <div class="review-text">"${escapeHTML(r.text)}"</div>
                        <div class="service-tag">${escapeHTML(r.service)}</div>
                    </div>`;
  };

  let html1 = track1Reviews.map(renderCard).join("");
  let html2 = track2Reviews.map(renderCard).join("");
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
      const elapsed = Date.now() - globalLoaderStartTime;
      const remaining = Math.max(0, 1000 - elapsed);
      setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => { preloader.style.visibility = 'hidden'; }, 500);
      }, remaining);
  }
}

function switchView(id) {
  showGlobalLoader();

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
  } else {
    setTimeout(hideGlobalLoader, 300); // Quick transition for normal tabs
  }
}


// Generic function for bottom sheet drag to close
function makeBottomSheetDraggable(dragHandleId, sheetElementSelector, modalId) {
  const dragHandleArea = document.getElementById(dragHandleId);
  const sheetElement = document.querySelector(sheetElementSelector);
  let modalStartY = 0;
  let modalCurrentY = 0;
  let isDraggingModal = false;

  if (dragHandleArea && sheetElement) {
    dragHandleArea.addEventListener('pointerdown', (e) => {
      isDraggingModal = true;
      modalStartY = e.clientY;
      sheetElement.style.transition = 'none';
      dragHandleArea.setPointerCapture(e.pointerId);
    });
    dragHandleArea.addEventListener('pointermove', (e) => {
      if (!isDraggingModal) return;
      modalCurrentY = e.clientY;
      const diff = modalCurrentY - modalStartY;
      if (diff > 0) {
        sheetElement.style.transform = `translateY(${diff}px)`;
      }
    });
    const handlePointerEnd = (e) => {
      if (!isDraggingModal) return;
      isDraggingModal = false;
      dragHandleArea.releasePointerCapture(e.pointerId);
      sheetElement.style.transition = 'transform 0.3s ease-out';
      if (modalCurrentY > 0 && modalCurrentY - modalStartY > 50) {
        closeModal(modalId);
      }
      sheetElement.style.transform = '';
      modalStartY = 0;
      modalCurrentY = 0;
    };
    dragHandleArea.addEventListener('pointerup', handlePointerEnd);
    dragHandleArea.addEventListener('pointercancel', handlePointerEnd);
  }
}

makeBottomSheetDraggable('drag-handle-area', '#edit-cart-modal .edit-cart-sheet', 'edit-cart-modal');
makeBottomSheetDraggable('drag-handle-reset', '#reset-booking-sheet', 'reset-booking-modal');

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
fetch('/bank-info.json')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('bank-info-container');
    const nameDisplay = document.getElementById('bank-name-display');
    
    if (nameDisplay && data.bankName) {
      nameDisplay.innerText = data.bankName;
    }

    bankInfo = data;
  })
  .catch(e => console.error('Error fetching bank info:', e));

// ==========================================
// RESET BOOKING FUNCTIONS
// ==========================================
function triggerResetBooking(orderNo, serviceName, staffId) {
  document.getElementById("reset-booking-id").value = orderNo;
  document.getElementById("reset-booking-service-name").innerText = serviceName;
  
  // Cari cawangan asal staf ini
  let originalBranchId = null;
  let allBarbersData = [];
  if (shopData && shopData.Barbers) allBarbersData = allBarbersData.concat(shopData.Barbers);
  if (shopData && shopData.OnCallBarbers) allBarbersData = allBarbersData.concat(shopData.OnCallBarbers);
  
  const origStaff = allBarbersData.find(b => b.id === staffId);
  if (origStaff && origStaff.branch_id) {
    originalBranchId = origStaff.branch_id;
  }
  
  // Populate staff dropdown
  const barberSelect = document.getElementById("barber-reset-booking");
  let options = '<option value="" disabled selected>Sila Pilih Barber</option>';
  
  // Tapis staf di cawangan yang sama, atau jika On-Call, tunjuk semua
  let filteredBarbers = allBarbersData.filter(b => {
     if (originalBranchId) return b.branch_id === originalBranchId;
     return true; 
  });
  
  // Unikkan barber ID sekiranya duplikat
  let uniqueBarbers = [];
  let map = new Map();
  for (let b of filteredBarbers) {
      if(!map.has(b.id)){
          map.set(b.id, true);
          uniqueBarbers.push(b);
      }
  }

  if (uniqueBarbers.length > 0) {
    uniqueBarbers.forEach(s => {
      options += `<option value="${s.id}">${escapeHTML(s.name)}</option>`;
    });
  }
  barberSelect.innerHTML = options;
  
  document.getElementById("input-date-reset-booking").value = "";
  document.getElementById("input-time-reset-booking").value = "";
  document.getElementById("btn-jadual-reset-booking").innerText = "Pilih Jadual (Tarikh & Masa)";
  document.getElementById("btn-jadual-reset-booking").classList.remove("has-value");
  
  document.getElementById("reset-booking-modal").classList.add("active");
}

async function fetchBarberAvailabilityForReset() {
  const barberId = document.getElementById("reset-booking-barber").value;
  const dateStr = document.getElementById("reset-booking-date").value;
  const timeSelect = document.getElementById("reset-booking-time");
  
  if (!barberId || !dateStr) {
    timeSelect.innerHTML = '<option value="">Pilih Masa</option>';
    return;
  }
  
  const selectedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  if (selectedDate <= today) {
    timeSelect.innerHTML = '<option value="">Tarikh tidak sah</option>';
    return;
  }
  
  timeSelect.innerHTML = '<option value="">Memuat turun...</option>';
  
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/staff-availability?staff_id=${barberId}`);
    const data = await res.json();
    let currentBarberLeaves = data.leaves || [];
    let currentBarberBookings = data.bookings || [];
    
    if (currentBarberLeaves.includes(dateStr)) {
      timeSelect.innerHTML = '<option value="">Barber sedang bercuti</option>';
      return;
    }
    
    // Generate times
    let bookedTimes = [];
    currentBarberBookings.forEach(b => {
      if (b.tarikh === dateStr) {
        bookedTimes.push(b.masa.substring(0, 5));
      }
    });
    
    let allTimes = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];
    
    let options = '<option value="" disabled selected>Pilih Masa</option>';
    let availableCount = 0;
    allTimes.forEach(t => {
      if (bookedTimes.includes(t)) {
        options += `<option value="${t}" disabled>${t} (Telah Ditempah)</option>`;
      } else {
        options += `<option value="${t}">${t}</option>`;
        availableCount++;
      }
    });
    
    if (availableCount === 0) {
      timeSelect.innerHTML = '<option value="">Semua masa penuh</option>';
    } else {
      timeSelect.innerHTML = options;
    }
  } catch (err) {
    timeSelect.innerHTML = '<option value="">Ralat sistem</option>';
  }
}

async function submitResetBooking() {
  const orderNo = document.getElementById("reset-booking-id").value;
  const staffId = document.getElementById("barber-reset-booking").value;
  const dateStr = document.getElementById("input-date-reset-booking").value;
  const timeStr = document.getElementById("input-time-reset-booking").value;
  
  if (!staffId || !dateStr || !timeStr) {
    if (typeof Swal !== "undefined") Swal.fire('Perhatian', 'Sila pilih Barber, Tarikh dan Masa.', 'warning');
    else alert('Sila pilih Barber, Tarikh dan Masa.');
    return;
  }
  
  if (!confirm("Adakah anda pasti untuk reset tempahan ini dengan masa yang baharu?")) return;
  
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/bookings/order/${orderNo}/reset`, {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_date: dateStr,
        new_time: timeStr,
        new_staff_id: staffId
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      if (typeof Swal !== "undefined") Swal.fire('Berjaya!', data.message, 'success');
      else alert(data.message);
      
      closeModal('reset-booking-modal');
      renderNotifications();
    } else {
      if (typeof Swal !== "undefined") Swal.fire('Gagal!', data.message, 'error');
      else alert(data.message);
    }
  } catch (err) {
    if (typeof Swal !== "undefined") Swal.fire('Gagal', 'Sistem tidak dapat berhubung', 'error');
    else alert('Sistem tidak dapat berhubung');
  }
}
