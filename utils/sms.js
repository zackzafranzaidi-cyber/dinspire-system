const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Hantar SMS menggunakan ESMS API
 * @param {string} to - Nombor telefon penerima
 * @param {string} msg - Teks mesej yang ingin dihantar
 * @param {boolean} throwError - Jika true, akan lempar ralat jika gagal (contoh untuk OTP)
 * @returns {object|null} - Respons API atau null jika gagal & throwError=false
 */
async function sendSMS(to, msg, throwError = false) {
  try {
    // 1. Dapatkan kredensial
    const user = process.env.ESMS_USER;
    const pass = process.env.ESMS_PASS;

    if (!user || !pass) {
      console.warn("[SMS WARNING] API ESMS_USER atau ESMS_PASS tidak ditetapkan dalam .env");
      if (throwError) throw new Error("Konfigurasi SMS Gateway tidak lengkap.");
      return null;
    }

    // 2. Format nombor telefon: buang semua karakter bukan nombor
    let phone = to.replace(/\D/g, "");
    
    // Jika mula dengan 01, tambah 6
    if (phone.startsWith("01")) {
      phone = "6" + phone;
    }

    // 3. Format mesej: Wajib mula dengan RM0.00 untuk Malaysia
    let finalMsg = msg.trim();
    if (!finalMsg.startsWith("RM0.00")) {
      finalMsg = "RM0.00 " + finalMsg;
    }

    // 4. Sediakan payload
    const payload = new URLSearchParams();
    payload.append('user', user);
    payload.append('pass', pass);
    payload.append('to', phone);
    payload.append('msg', finalMsg);

    // 5. Panggil API ESMS
    console.log(`[SMS INFO] Menghantar SMS ke ${phone}...`);
    const response = await axios.post("https://api.esms.com.my/sms/send", payload.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
      }
    });

    const data = response.data;
    if (data.status === 0) {
      console.log(`[SMS SUCCESS] SMS dihantar ke ${phone}. Kredit ditolak: ${data.creditDeducted}`);
      return data;
    } else {
      console.error(`[SMS ERROR] Gagal hantar SMS ke ${phone}. Status: ${data.status} - ${data.message}`);
      if (throwError) throw new Error(data.message);
      return null;
    }

  } catch (error) {
    console.error(`[SMS EXCEPTION] Ralat sistem semasa menghantar SMS:`, error.message);
    if (throwError) throw error;
    return null;
  }
}

module.exports = {
  sendSMS
};

async function getSMSBalance() {
  try {
    const user = process.env.ESMS_USER;
    const pass = process.env.ESMS_PASS;
    if (!user || !pass) return -1;
    const payload = new URLSearchParams();
    payload.append('user', user);
    payload.append('pass', pass);
    const response = await axios.post('https://api.esms.com.my/sms/balance', payload.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (response.data.status === 0) {
      return response.data.balance;
    }
    return -1;
  } catch (error) {
    console.error('[SMS EXCEPTION] Ralat menyemak baki:', error.message);
    return -1;
  }
}
module.exports.getSMSBalance = getSMSBalance;
