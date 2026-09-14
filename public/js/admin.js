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
  Branches: ["id", "name", "location", "imageUrl", "lat", "lng"],
  Staff: ["id", "name", "jenis_staf", "branch_id", "kemahiran"],
  OnCall: ["id", "name", "price"],
  WalkInServices: ["id", "name", "price"],
  WalkInTreatments: ["id", "name", "price"],
  Products: ["id", "name", "price", "imageUrl", "stok"],
  Posters: ["id", "imageUrl"],
};

let currentTab = "Haircuts";


// Modified for Owner Integration
function initAdminCMS() {
    if (typeof API_BASE_URL === 'undefined') window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api';
    loadAdminData();
}

