const refDate = new Date("2026-07-29T18:27:43+08:00");
let startOfWeek = new Date(refDate);
startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
startOfWeek.setHours(0, 0, 0, 0);

console.log("refDate:", refDate.toString());
console.log("startOfWeek:", startOfWeek.toString());

const dateObj1 = new Date("2026-07-26T12:00:00+08:00");
console.log("dateObj1:", dateObj1.toString());
console.log("is >= startOfWeek?", dateObj1 >= startOfWeek);

const dateObj2 = new Date("2026-07-26T00:00:00+08:00");
console.log("dateObj2:", dateObj2.toString());
console.log("is >= startOfWeek?", dateObj2 >= startOfWeek);

const dateObj3 = new Date("2026-07-25T23:59:59+08:00");
console.log("dateObj3:", dateObj3.toString());
console.log("is >= startOfWeek?", dateObj3 >= startOfWeek);
