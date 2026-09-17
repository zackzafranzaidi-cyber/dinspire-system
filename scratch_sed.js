const fs = require('fs');
let js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

if (!js.includes('.desktop-top-nav .desktop-nav-item')) {
  js = js.replace('document\n    .querySelectorAll(".bottom-nav .nav-item")\n    .forEach((item) =>\n      item.addEventListener("click", () =>\n        switchView(item.id.replace("nav-", "")),\n      ),\n    );',
`document
    .querySelectorAll(".bottom-nav .nav-item")
    .forEach((item) =>
      item.addEventListener("click", () =>
        switchView(item.id.replace("nav-", "")),
      ),
    );
  document
    .querySelectorAll(".desktop-top-nav .desktop-nav-item")
    .forEach((item) =>
      item.addEventListener("click", () =>
        switchView(item.id.replace("desktop-nav-", "")),
      ),
    );`);
}

if (!js.includes('document.getElementById("desktop-nav-" + id)?.classList.add("active");')) {
  js = js.replace('document\n      .querySelectorAll(".nav-item, .sidebar-nav-item")\n      .forEach((n) => n.classList.remove("active"));\n    document.getElementById("nav-" + id)?.classList.add("active");\n    document.getElementById("sidebar-nav-" + id)?.classList.add("active");',
`document
      .querySelectorAll(".nav-item, .sidebar-nav-item, .desktop-nav-item")
      .forEach((n) => n.classList.remove("active"));
    document.getElementById("nav-" + id)?.classList.add("active");
    document.getElementById("sidebar-nav-" + id)?.classList.add("active");
    document.getElementById("desktop-nav-" + id)?.classList.add("active");`);
}
fs.writeFileSync('public/customer/js/customer.js', js);
console.log('Fixed');
