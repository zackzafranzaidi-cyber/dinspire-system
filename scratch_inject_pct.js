const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

const percentageLogic = `
    // Calculate previous period data for percentage comparison
    let previousRefDate = new Date(now);
    let periodName = "period";
    if (filterType === 'daily') { previousRefDate.setDate(now.getDate() - 1); periodName = "day"; }
    else if (filterType === 'weekly') { previousRefDate.setDate(now.getDate() - 7); periodName = "week"; }
    else if (filterType === 'monthly') { previousRefDate.setMonth(now.getMonth() - 1); periodName = "month"; }
    else if (filterType === 'yearly') { previousRefDate.setFullYear(now.getFullYear() - 1); periodName = "year"; }

    let prevRevenue = 0; let prevOrders = 0; let prevProfit = 0;
    if (filterType !== 'all') {
      let prevBookings = masterData.bookings.filter(b => b.Status === "Selesai" && isWithinFilter(b.Date || b.Timestamp || b.created_at, filterType, previousRefDate));
      let prevTableOrders = masterData.orders.filter((o) => isWithinFilter(o.tarikh || o.Timestamp || o.created_at, filterType, previousRefDate)).filter(o => o.status !== "Pending Verification" && o.status !== "Preparing");
      let prevFilteredOrders = prevTableOrders.filter((o) => {
        if (o.status === "Batal" || o.status === "Pending Verification") return false;
        let r = o.resit || o.ReceiptLink || "";
        if (typeof r === "string" && (r.includes("FPX_PENDING") || r.includes("FPX_FAILED"))) return false;
        return true;
      });
      
      let p_sRev = 0, p_sFee = 0;
      prevBookings.forEach(b => { p_sRev += parseFloat(b.Price) || 0; p_sFee += parseFloat(b.Fee) || 0; });
      let p_pRev = 0, p_pShip = 0;
      prevFilteredOrders.forEach(o => {
        let items = typeof o.senarai_produk === "string" ? JSON.parse(o.senarai_produk) : o.senarai_produk;
        if (!items && o.Items) items = typeof o.Items === "string" ? JSON.parse(o.Items) : o.Items;
        let cost = 0;
        for (let k in items) cost += (items[k].qty || 0) * (items[k].price || 0);
        p_pRev += cost;
        p_pShip += parseFloat(o.shipping_fee) || 0;
      });
      
      let p_totalComm = p_sRev * (masterData.commissionPercent / 100);
      prevRevenue = p_sRev + p_sFee + p_pRev + p_pShip;
      prevOrders = prevBookings.length;
      prevProfit = prevRevenue - p_totalComm;
    }

    const updatePct = (id, current, prev) => {
      let elContainer = document.getElementById(id + "-container");
      let el = document.getElementById(id);
      if (!el || !elContainer) return;
      
      if (filterType === 'all' || prev === 0) {
        elContainer.className = "text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 self-start mt-1";
        if (id === 'val-revenue-pct') elContainer.className = "text-xs font-bold px-2 py-1 rounded-md mb-1 bg-gray-100 text-gray-500";
        el.innerText = filterType === 'all' ? "-" : (current > 0 ? "+100%" : "0%");
        return;
      }
      
      let pct = ((current - prev) / prev) * 100;
      let isUp = pct >= 0;
      let formattedPct = (isUp ? "↑ " : "↓ ") + Math.abs(pct).toFixed(1) + "%";
      
      el.innerText = formattedPct;
      let baseClass = id === 'val-revenue-pct' ? "text-xs font-bold px-2 py-1 rounded-md mb-1 " : "text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ";
      if (id !== 'val-revenue-pct') baseClass += " self-start "; // for flex alignment
      
      if (isUp) {
        elContainer.className = baseClass + "bg-emerald-50 text-emerald-600";
      } else {
        elContainer.className = baseClass + "bg-red-50 text-red-600";
      }
    };

    const currentRevenue = serviceRev + productRev + totalServiceFees + totalShippingFees;
    const currentOrders = filteredBookings.length;
    const currentProfit = currentRevenue - totalComm;

    updatePct('val-revenue-pct', currentRevenue, prevRevenue);
    updatePct('val-orders-pct', currentOrders, prevOrders);
    updatePct('val-profit-pct', currentProfit, prevProfit);

    let periodEl = document.getElementById('val-revenue-period');
    if (periodEl) periodEl.innerText = periodName;
`;

// Insert right before `animateNumber("val-revenue", ...);`
const targetStr = 'animateNumber("val-revenue", serviceRev + productRev';
js = js.replace(targetStr, percentageLogic + '\n    ' + targetStr);
fs.writeFileSync('public/js/owner.js', js);
console.log("Percentage logic injected!");
