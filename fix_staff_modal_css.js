const fs = require('fs');
let html = fs.readFileSync('public/staff/index.html', 'utf8');

const wrongModalStart = '<div id="requestEditModal" class="modal">';
const correctModalStart = '<div id="requestEditModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; justify-content: center; align-items: center; padding: 20px;">';

const wrongContentStart = '<div class="modal-content">';
const correctContentStart = '<div style="background: #1e1e1e; padding: 20px; border-radius: 12px; width: 100%; max-width: 400px; color: white;">';

html = html.replace(wrongModalStart, correctModalStart);
html = html.replace(wrongContentStart, correctContentStart);
html = html.replace('<span class="close-btn" onclick="closeRequestEditModal()">&times;</span>', '<span style="float:right; font-size: 24px; cursor: pointer; color: #ccc;" onclick="closeRequestEditModal()">&times;</span>');

fs.writeFileSync('public/staff/index.html', html);
console.log("Fixed modal HTML in staff index");
