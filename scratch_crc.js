function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
      else crc = crc << 1;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
const str = "00020201021126420014A000000615000101066033460210MD001712895204723053034585802MY5917DIEYN BARBERSHOP 6002MY627303251765767671906006201388000052017657676838380025663071617657670379790096304";
console.log(crc16(str));
