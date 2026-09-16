const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const navStart = `<nav class="flex flex-col w-full relative z-10 px-4 gap-1">`;
const newNavStart = `<nav class="flex flex-col w-full relative z-10 px-2 gap-1 flex-1 overflow-y-auto custom-scrollbar pb-4" style="margin-right: 2px;">`;

const spacer = `<div class="flex-1"></div>`;
const newSpacer = ``; // Remove the spacer since nav is flex-1

// Wait, I should make sure there's custom-scrollbar css if I use it.
const styleInjection = `
      /* Skrol Navigasi Sidebar */
      .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
      }
`;

if (html.includes(navStart)) {
    html = html.replace(navStart, newNavStart);
    if (html.includes(spacer)) {
        html = html.replace(spacer, newSpacer);
    }
    
    // Inject style before </style>
    if (!html.includes('/* Skrol Navigasi Sidebar */')) {
        html = html.replace('</style>', styleInjection + '</style>');
    }
    
    fs.writeFileSync('public/owner/index.html', html);
    console.log("Updated sidebar navigation to be scrollable.");
} else {
    console.log("Could not find navStart.");
}
