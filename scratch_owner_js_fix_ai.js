const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const newLogic = `
function switchTab(tabName, element = null) {
    if (tabName === 'cms' && window.innerWidth < 768) {
        Swal.fire({
            icon: 'info',
            title: 'Paparan Desktop Sahaja',
            text: 'Master Data (CMS) hanya boleh diakses melalui komputer atau mod desktop untuk pengalaman yang lebih baik.',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    if (tabName === 'ai' && window.innerWidth >= 768) {
        toggleAIDrawer();
        // Highlight AI button but don't hide current tab
        document.getElementById("nav-ai").classList.toggle("text-white");
        document.getElementById("nav-ai").classList.toggle("bg-white/10");
        return;
    }
`;

code = code.replace(/function switchTab\(tabName,\s*element\s*=\s*null\)\s*\{/, newLogic);

fs.writeFileSync('public/js/owner.js', code);
