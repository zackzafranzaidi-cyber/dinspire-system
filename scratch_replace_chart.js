const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

const updateBarChartStart = 'function updateBarChart(bookings, orders, filterType) {';
const updateBarChartEnd = 'function openReceiptModal(link) {';

let startIndex = js.indexOf(updateBarChartStart);
let endIndex = js.indexOf(updateBarChartEnd);

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find start or end index! Start:", startIndex, "End:", endIndex);
    process.exit(1);
}

const newUpdateBarChart = `function updateBarChart(bookings, orders, filterType) {
    let labels = [];
    let dataPoints = [];
    let bgColors = [];
    const now = currentReferenceDate;
  
    window._branchData = { revenue: {}, expense: {}, profit: {} };
    let allPossibleBranches = new Set(Object.values(mapBarberBranch));
    
    bookings.forEach((b) => {
        let txDate = b.Date || (b.Timestamp ? String(b.Timestamp).split("T")[0] : "");
        let br = getTransactionBranch(b.Barber, txDate, b.Time);
        if (br) allPossibleBranches.add(br);
    });
  
    allPossibleBranches.forEach(br => {
      window._branchData.revenue[br] = [];
      window._branchData.expense[br] = [];
      window._branchData.profit[br] = [];
    });
  
    if (filterType === "daily") {
      for (let i = 0; i < 24; i++) {
        labels.push(i.toString().padStart(2, "0") + ":00");
        dataPoints.push(0);
        bgColors.push(i === now.getHours() ? "#111827" : "#d1d5db");
      }
    } else if (filterType === "weekly") {
      labels = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
      dataPoints = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 7; i++) {
        bgColors.push(i === now.getDay() ? "#111827" : "#d1d5db");
      }
    } else if (filterType === "monthly") {
      let daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
        dataPoints.push(0);
        bgColors.push(i === now.getDate() ? "#111827" : "#d1d5db");
      }
    } else if (filterType === "yearly") {
      labels = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
      dataPoints = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 12; i++) {
        bgColors.push(i === now.getMonth() ? "#111827" : "#d1d5db");
      }
    } else {
      labels = ["Semua Data"];
      dataPoints = [0];
      bgColors = ["#111827"];
    }
  
    Object.keys(window._branchData.revenue).forEach(br => {
      window._branchData.revenue[br] = new Array(labels.length).fill(0);
      window._branchData.expense[br] = new Array(labels.length).fill(0);
      window._branchData.profit[br] = new Array(labels.length).fill(0);
    });
  
    function getIndex(dateStr, timeStr) {
      let d;
      if (dateStr && timeStr && typeof dateStr === "string" && dateStr.includes("-") && timeStr.includes(":")) {
        d = new Date(\`\${dateStr}T\${timeStr.length === 5 ? timeStr + ":00" : timeStr}\`);
      } else {
        d = parseGSDate(dateStr);
      }
      if (!d || isNaN(d.getTime())) return -1;
  
      let idx = -1;
      if (filterType === "daily") {
        let hour = d.getHours();
        if (hour >= 0 && hour < 24) idx = hour;
      } else if (filterType === "weekly") {
        let day = d.getDay();
        idx = day;
      } else if (filterType === "monthly") {
        let dateNum = d.getDate();
        if (dateNum >= 1 && dateNum <= labels.length) idx = dateNum - 1;
      } else if (filterType === "yearly") {
        let month = d.getMonth();
        if (month >= 0 && month < 12) idx = month;
      } else {
        idx = 0;
      }
      return idx;
    }

    bookings.forEach((b) => {
      let txDate = b.Date || (b.Timestamp ? String(b.Timestamp).split("T")[0] : "");
      let br = getTransactionBranch(b.Barber, txDate, b.Time);
      if (br === "Tidak Ditetapkan") br = "In-Branch";
      
      let idx = getIndex(txDate, b.Time);
      if (idx !== -1) {
          let price = parseFloat(b.Price) || 0;
          let fee = parseFloat(b.Fee) || 0;
          let rev = price + fee;
          let exp = price * (masterData.commissionPercent / 100);
          let prof = rev - exp;
          
          dataPoints[idx] += rev;
          if (window._branchData.revenue[br]) {
             window._branchData.revenue[br][idx] += rev;
             window._branchData.expense[br][idx] += exp;
             window._branchData.profit[br][idx] += prof;
          }
      }
    });

    orders.forEach((o) => {
      let idx = getIndex(o.Timestamp || o.tarikh, null);
      if (idx !== -1) {
          let cost = o._calculatedTotal || 0;
          let ship = parseFloat(o.shipping_fee) || 0;
          let rev = cost + ship;
          dataPoints[idx] += rev;
          if (window._branchData.revenue["In-Branch"]) {
             window._branchData.revenue["In-Branch"][idx] += rev;
             window._branchData.profit["In-Branch"][idx] += rev;
          }
      }
    });
  
    salesChartObj.data.labels = labels;
    salesChartObj.data.datasets[0].data = dataPoints;
    salesChartObj.data.datasets[0].backgroundColor = bgColors;
    animateChartWhenVisible(salesChartObj, "salesChart");
  
    if (branchLineChartObj) {
      window._branchMetrics = { revenue: [], expense: [], profit: [] };
      let colorIndex = 0;
      const ctxChart = document.getElementById("branchLineChart").getContext("2d");
      
      let activeGradient = ctxChart.createLinearGradient(0, 0, 0, 300);
      activeGradient.addColorStop(0, \`rgba(17, 24, 39, 0.5)\`);
      activeGradient.addColorStop(1, \`rgba(17, 24, 39, 0.0)\`);
      let inactiveGradient = ctxChart.createLinearGradient(0, 0, 0, 300);
      inactiveGradient.addColorStop(0, \`rgba(209, 213, 219, 0.5)\`);
      inactiveGradient.addColorStop(1, \`rgba(209, 213, 219, 0.0)\`);
  
      Object.keys(window._branchData.revenue).forEach(br => {
        let lowerBr = br.toLowerCase();
        if (lowerBr.includes("on-call") || lowerBr.includes("oncall") || lowerBr === "in-branch" || lowerBr === "tidak ditetapkan") return;
  
        let isFirst = (colorIndex === 0);
        let baseColor = isFirst ? "#111827" : "#d1d5db";
        let gradient = isFirst ? activeGradient : inactiveGradient;
  
        const baseOpts = {
          label: br,
          borderColor: baseColor,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          borderWidth: isFirst ? 3 : 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          order: isFirst ? 0 : 1,
          customActiveColor: "#111827",
          customInactiveColor: "#d1d5db",
          customActiveGradient: activeGradient,
          customInactiveGradient: inactiveGradient
        };

        window._branchMetrics.revenue.push({ ...baseOpts, data: window._branchData.revenue[br] });
        window._branchMetrics.expense.push({ ...baseOpts, data: window._branchData.expense[br] });
        window._branchMetrics.profit.push({ ...baseOpts, data: window._branchData.profit[br] });
        colorIndex++;
      });
      
      let curr = window.currentBranchMetric || 'revenue';
      branchLineChartObj.data.labels = labels;
      branchLineChartObj.data.datasets = window._branchMetrics[curr];
      animateChartWhenVisible(branchLineChartObj, "branchLineChart");
    }
}
`;

js = js.substring(0, startIndex) + newUpdateBarChart + "\n  " + js.substring(endIndex);

js += `
window.setBranchMetric = function(metric) {
    window.currentBranchMetric = metric;
    
    // Update button styles
    const btns = ['revenue', 'expense', 'profit'];
    btns.forEach(b => {
        const el = document.getElementById('btn-branch-' + b);
        if(el) {
            if(b === metric) {
                el.className = "px-3 py-1.5 rounded-md text-purple-700 bg-white shadow-sm border border-gray-200 transition";
            } else {
                el.className = "px-3 py-1.5 rounded-md text-gray-400 hover:text-gray-900 transition";
            }
        }
    });

    if (window.branchLineChartObj && window._branchMetrics) {
        window.branchLineChartObj.data.datasets = window._branchMetrics[metric];
        window.branchLineChartObj.update();
    }
};
`;

fs.writeFileSync('public/js/owner.js', js);
console.log("Replaced updateBarChart safely.");
