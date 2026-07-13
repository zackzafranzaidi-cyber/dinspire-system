const fs = require('fs');
let content = fs.readFileSync('public/js/index.js', 'utf8');

const replacements = [
  ['"Tiada rekod pesanan buat masa ini."', 'i18n_index[currentLang]["js-no-record"]'],
  ['"Tiada produk ditawarkan buat masa ini."', 'i18n_index[currentLang]["js-no-record"]'],
  ['"Tiada Promosi Dijalankan"', 'i18n_index[currentLang]["js-no-record"]'],
  ['>Pilih Jadual</button>', '> + i18n_index[currentLang]["services-btn-schedule"] + </button>'],
  ['>Add</button>', '> + i18n_index[currentLang]["products-btn-add"] + </button>'],
  ['>Delete</div>', '> + i18n_index[currentLang]["cart-delete-btn"] + </div>'],
  ['alert("Troli kosong!")', 'alert(i18n_index[currentLang]["alert-cart-empty"])'],
  ['"Sila pilih saiz/jenis."', 'i18n_index[currentLang]["alert-select-variant"]'],
  ['"Sila pilih Tarikh dan Masa dengan menekan butang Pilih Jadual."', 'i18n_index[currentLang]["alert-select-schedule"]'],
  ['"Sila lengkapkan semua maklumat dan butang Pilih Jadual On-Call."', 'i18n_index[currentLang]["alert-incomplete-address"]'],
  ['alert("Sila muat naik gambar resit bayaran terlebih dahulu.")', 'alert(i18n_index[currentLang]["alert-no-receipt"])'],
  ['showToast("Telah ditambah ke troli!")', 'showToast(i18n_index[currentLang]["alert-cart-updated"])'],
  ['"Sila masukkan komen ulasan."', 'i18n_index[currentLang]["alert-no-comment"]'],
  ['showToast("Ulasan berjaya dihantar!")', 'showToast(i18n_index[currentLang]["alert-review-success"])'],
  ['showToast("Log Masuk Berjaya!")', 'showToast(i18n_index[currentLang]["alert-login-success"])'],
  ['showToast("Pendaftaran Berjaya! Sila log masuk.")', 'showToast(i18n_index[currentLang]["alert-register-success"])'],
];

replacements.forEach(([search, replace]) => {
  content = content.split(search).join(replace);
});

fs.writeFileSync('public/js/index.js', content);
console.log("Done");
