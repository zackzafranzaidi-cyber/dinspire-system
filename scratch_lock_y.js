const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

const oldSetBranch = `window.setBranchMetric = function(metric) {
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
  
      if (branchLineChartObj && window._branchMetrics) {
          branchLineChartObj.data.datasets = window._branchMetrics[metric];
          branchLineChartObj.update();
      }
  };`;

const newSetBranch = `window.setBranchMetric = function(metric) {
      window.currentBranchMetric = metric;
      
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
  
      if (branchLineChartObj && window._branchMetrics) {
          // Cari max revenue untuk kekalkan skala Y paksi supaya graf nampak 'jatuh' bila pilih profit/expense
          let maxVal = 0;
          if (window._branchMetrics.revenue) {
              window._branchMetrics.revenue.forEach(ds => {
                  ds.data.forEach(v => {
                      if (v > maxVal) maxVal = v;
                  });
              });
          }
          
          if (maxVal > 0) {
              branchLineChartObj.options.scales.y.max = maxVal * 1.1; // 10% headroom
          } else {
              delete branchLineChartObj.options.scales.y.max;
          }

          branchLineChartObj.data.datasets = window._branchMetrics[metric];
          branchLineChartObj.update();
      }
  };`;

js = js.replace(oldSetBranch, newSetBranch);
fs.writeFileSync('public/js/owner.js', js);
console.log("Updated setBranchMetric to lock Y axis.");
