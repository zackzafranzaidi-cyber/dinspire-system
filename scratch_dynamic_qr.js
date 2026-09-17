function generateDynamicDuitNow(amount) {
  let baseStr = "00020201021126420014A000000615000101066033460210MD001712895204723053034585802MY5917DIEYN BARBERSHOP 6002MY62730325176576767190600620138800005201765767683838002566307161765767037979009";
  
  // 1. Change to Dynamic (010211 -> 010212)
  baseStr = baseStr.replace("010211", "010212");
  
  // 2. Format amount to 2 decimal places
  let amountStr = amount.toFixed(2);
  let tag54 = "54" + amountStr.length.toString().padStart(2, '0') + amountStr;
  
  // 3. Insert Tag 54 before Tag 58
  baseStr = baseStr.replace("5802MY", tag54 + "5802MY");
  
  // 4. Calculate new CRC
  let strToCrc = baseStr + "6304";
  
  let crc = 0xFFFF;
  for (let i = 0; i < strToCrc.length; i++) {
    crc ^= strToCrc.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
      else crc = crc << 1;
    }
  }
  let crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  
  return strToCrc + crcHex;
}
console.log(generateDynamicDuitNow(25.5));
