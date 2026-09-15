const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');
const updateBarChartStart = 'function updateBarChart(bookings, orders, filterType) {';
const updateBarChartEnd = '  function handleLegendClick(e, legendItem, legend) {'; 
console.log("Start:", js.indexOf(updateBarChartStart));
console.log("End:", js.indexOf(updateBarChartEnd));
