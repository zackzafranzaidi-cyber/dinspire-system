const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

const regexChart = /if \(branchLineChartObj\) \{[\s\S]*?colorIndex\+\+;\s*\}\);\s*branchLineChartObj\.data\.datasets = datasets;\s*animateChartWhenVisible\(branchLineChartObj, "branchLineChart"\);\s*\}/;

const newChartLogic = `if (branchLineChartObj) {
      window._branchMetrics = { revenue: [], expense: [], profit: [] };
      
      let datasetsR = [], datasetsE = [], datasetsP = [];
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

        datasetsR.push({ ...baseOpts, data: window._branchData.revenue[br] });
        datasetsE.push({ ...baseOpts, data: window._branchData.expense[br] });
        datasetsP.push({ ...baseOpts, data: window._branchData.profit[br] });
        
        colorIndex++;
      });
      
      window._branchMetrics.revenue = datasetsR;
      window._branchMetrics.expense = datasetsE;
      window._branchMetrics.profit = datasetsP;
      
      let curr = window.currentBranchMetric || 'revenue';
      branchLineChartObj.data.labels = labels;
      branchLineChartObj.data.datasets = window._branchMetrics[curr];
      animateChartWhenVisible(branchLineChartObj, "branchLineChart");
    }`;

if (js.match(regexChart)) {
    console.log("Found branch chart logic to replace.");
} else {
    console.log("Could not find regex!");
}

