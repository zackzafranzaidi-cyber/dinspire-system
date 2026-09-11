var document = {};
var isStandalone = false;
var intro = { style: { display: 'none', transition: '', opacity: '' }, remove: function() { console.log('removed'); } };

if (isStandalone && intro) {
  intro.style.display = "flex"; // Reveal it
  
  // Fallback: Ensure intro screen is removed after 4.5 seconds in case CSS animation fails
  setTimeout(function() {
    if (intro) { intro.style.transition = "opacity 0.5s ease-out"; intro.style.opacity = "0"; setTimeout(function(){ intro.remove(); }, 500); }
  }, 4500);
} else { document.documentElement = { classList: { add: function(x) { console.log('added ' + x); } } }; document.documentElement.classList.add("browser-mode"); if (intro) { intro.remove(); } }
