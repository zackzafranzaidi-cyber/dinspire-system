const crypto = require("crypto");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
require("dotenv").config();

/**
 * Sistem FPX (Financial Process Exchange) Node.js
 * Ditulis dengan tahap keselamatan dan ketahanan (resilience) yang tinggi.
 */
class FPXSecureSystem {
  constructor() {
    this.apiKey = process.env.FPX_API_KEY || "TEST_API_KEY";
    this.signatureKey = process.env.FPX_SIGNATURE_KEY || "TEST_SIGNATURE_KEY";
    this.merchantId = process.env.FPX_MERCHANT_ID || "TEST_MERCHANT_ID";
    this.baseUrl = process.env.FPX_BASE_URL || "https://api.sandbox-fpx.com/v1";
    this.timeout = 10000; // KESELAMATAN: Timeout 10 saat

    // 1. KETAHANAN: Konfigurasi Retry dengan Exponential Backoff
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      auth: {
        username: this.apiKey,
        password: ""
      },
      headers: {
        "Content-Type": "application/json"
      }
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Cuba semula jika masalah rangkaian atau ralat pelayan FPX 5xx
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               (error.response && error.response.status >= 500);
      }
    });
  }

  /**
   * Mencipta pautan pembayaran FPX
   */
  async createPayment(amount, reference, description, customerEmail, customerName, returnUrl, callbackUrl) {
    // 2. KESELAMATAN: Validasi input asas
    if (!amount || amount <= 0) {
      throw new Error("Jumlah bayaran (amount) mesti lebih daripada 0");
    }

    const payload = {
      merchant_id: this.merchantId,
      email: customerEmail,
      name: customerName,
      amount: Math.round(amount * 100), // Simpan dalam sen (cents)
      description: (description || "").substring(0, 200), // 3. KESELAMATAN: Hadkan panjang
      reference: reference,
      return_url: returnUrl,
      callback_url: callbackUrl
    };

    try {
      const response = await this.client.post("/payments", payload);
      
      // Jika sandbox-fpx.com palsu digunakan untuk ujian tempatan, kita akan 'mock' balasan
      if (this.baseUrl.includes("sandbox-fpx.com")) {
         return {
            payment_url: `https://dummy-fpx.com/pay?ref=${reference}&amt=${amount}`,
            transaction_id: `TXN${Date.now()}`,
            reference: reference
         };
      }

      return {
        payment_url: response.data.url,
        transaction_id: response.data.id,
        reference: reference
      };
    } catch (error) {
      console.error("Ralat mencipta bayaran FPX:", error.message);
      // 5. KESELAMATAN: Urus ralat tanpa mendedahkan stacktrace sensitif
      throw new Error("Gagal berhubung dengan Gateway FPX. Sila cuba sebentar lagi.");
    }
  }

  /**
   * Mengesahkan tandatangan webhook FPX
   */
  verifyWebhookSignature(payload, receivedSignature) {
    if (!receivedSignature) {
      console.warn("Amaran Keselamatan: Tandatangan tiada dalam webhook");
      return false;
    }

    // Ubah ke string JSON tanpa jarak putih (sort keys for consistency)
    const payloadStr = JSON.stringify(payload, Object.keys(payload).sort());

    // 6. KESELAMATAN: Jana HMAC-SHA256
    const hmac = crypto.createHmac("sha256", this.signatureKey);
    hmac.update(payloadStr);
    const expectedSignature = hmac.digest("hex");

    // 7. KESELAMATAN: Banding secara selamat (constant-time comparison)
    try {
      const is_valid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature)
      );
      
      if (!is_valid) {
        console.warn("Amaran Keselamatan: Tandatangan webhook FPX tidak sepadan (Spoofing).");
      }
      return is_valid;
    } catch (e) {
      // Menangkap ralat jika saiz buffer tak sama
      console.warn("Amaran Keselamatan: Saiz tandatangan tidak sah.");
      return false;
    }
  }

  /**
   * Memproses Webhook (Hanya jika disahkan)
   */
  parseWebhook(payload, receivedSignature) {
    if (!this.verifyWebhookSignature(payload, receivedSignature)) {
      // 8. KESELAMATAN: Tolak webhook palsu
      throw new Error("Pengesahan keselamatan (signature) gagal. Data webhook ditolak.");
    }

    const isPaid = (payload.status || "").toLowerCase() === "paid";
    const amountCents = parseInt(payload.amount || "0", 10);

    return {
      reference: payload.reference || "",
      status: isPaid ? "paid" : "failed",
      amount: amountCents / 100,
      transaction_id: payload.id || ""
    };
  }
}

module.exports = new FPXSecureSystem();
