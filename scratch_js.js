const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');

const target = `document.getElementById("view-" + id)?.classList.add("active");`;
const injection = `
    const mobContainer = document.querySelector(".mobile-container");
    if (mobContainer) {
      if (id === "products") {
        mobContainer.classList.add("tab-products-active");
      } else {
        mobContainer.classList.remove("tab-products-active");
      }
    }
`;

if (js.includes(target) && !js.includes('tab-products-active')) {
    js = js.replace(target, target + injection);
    fs.writeFileSync('public/js/index.js', js);
    console.log("Injected JS logic for tab-products-active.");
} else {
    console.log("Could not inject JS or already exists.");
}
