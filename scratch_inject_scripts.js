const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const scriptsToInject = `
    <!-- SweetAlert2 (Needed for CMS) -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    
    <!-- Leaflet for Maps (Needed for CMS Branches) -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css" />
    <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
`;

html = html.replace(/<\/head>/, scriptsToInject + '\n  </head>');
fs.writeFileSync('public/owner/index.html', html);
