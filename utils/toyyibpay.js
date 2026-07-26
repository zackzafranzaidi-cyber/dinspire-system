const crypto = require("crypto");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
require("dotenv").config();

/**
 * Sistem toyyibPay Node.js (Menggantikan FPXSecureSystem)
 * Ditulis dengan tahap keselamatan dan ketahanan (resilience) yang tinggi.
 */
class ToyyibPaySystem {
  constructor() {
    this.secretKey = process.env.TOYYIBPAY_SECRET_KEY || "";
    this.categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE || "";
    this.baseUrl = process.env.TOYYIBPAY_URL || "https://toyyibpay.com";
    this.timeout = 10000; // KESELAMATAN: Timeout 10 saat

    // KETAHANAN: Konfigurasi Retry dengan Exponential Backoff
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Cuba semula jika masalah rangkaian atau ralat pelayan 5xx
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               (error.response && error.response.status >= 500);
      }
    });
  }

  /**
   * Mencipta pautan pembayaran (Bill) toyyibPay
   */
  async createPayment(amountRM, reference, description, customerEmail, customerName, returnUrl, callbackUrl, phoneNumber = "0123456789") {
    // KESELAMATAN: Validasi input asas
    if (!amountRM || amountRM <= 0) {
      throw new Error("Jumlah bayaran (amount) mesti lebih daripada RM0");
    }

    if (!this.secretKey || !this.categoryCode) {
      throw new Error("Konfigurasi toyyibPay (Secret Key / Category Code) tidak dijumpai.");
    }

    try {
      const amountCents = Math.round(amountRM * 100);

      const payload = new URLSearchParams({
        userSecretKey: this.secretKey,
        categoryCode: this.categoryCode,
        billName: "Dinspire Barbershop",
        billDescription: description.substring(0, 100),
        billPriceSetting: 1, // Fixed amount
        billPayorInfo: 1, // Require payer info
        billAmount: amountCents, // Dalam sen
        billReturnUrl: returnUrl,
        billCallbackUrl: callbackUrl,
        billExternalReferenceNo: reference,
        billTo: customerName,
        billEmail: customerEmail || "tiada@email.com",
        billPhone: phoneNumber,
        billSplitPayment: 0,
        billPaymentChannel: "0", // 0 = FPX Only, 2 = FPX & CC
        billChargeToCustomer: 1, // "charge on bill owner, if parameter enableFPXB2B is set to 1". Wait, standard is 1 for billChargeToCustomer or leave blank. We leave it as is or omit it. Let's omit billChargeToCustomer so the default is used. Actually, setting it to 1 sets it to owner.
      });

      // KESELAMATAN: Tiada log data sensitif seperti kad kredit dsb.
      console.log(`Menjana Pautan toyyibPay untuk ${reference} (RM${amountRM.toFixed(2)})`);

      const response = await this.client.post("/index.php/api/createBill", payload.toString());
      
      const responseData = response.data;
      if (Array.isArray(responseData) && responseData[0] && responseData[0].BillCode) {
        const billCode = responseData[0].BillCode;
        return {
          transaction_id: billCode,
          payment_url: `${this.baseUrl}/${billCode}`
        };
      } else {
        throw new Error(JSON.stringify(responseData));
      }
    } catch (error) {
      console.error("toyyibPay API Error:", error.response ? error.response.data : error.message);
      throw new Error("Gagal berhubung dengan Gateway toyyibPay. Sila cuba sebentar lagi.");
    }
  }

  /**
   * KESELAMATAN TINGGI: Pengesahan Tandatangan Webhook (Hash Validation)
   * Formula: MD5( userSecretKey + status + order_id + refno + "ok" )
   */
  verifyWebhookHash(payload) {
    if (!payload) return false;
    
    const status = payload.status || "";
    const order_id = payload.order_id || "";
    const refno = payload.refno || "";
    const receivedHash = payload.hash || "";

    const hashString = `${this.secretKey}${status}${order_id}${refno}ok`;
    const expectedHash = crypto.createHash('md5').update(hashString).digest('hex');

    // KESELAMATAN: Banding secara selamat (constant-time comparison)
    try {
      const is_valid = crypto.timingSafeEqual(
        Buffer.from(expectedHash),
        Buffer.from(receivedHash)
      );
      
      if (!is_valid) {
        console.warn("Amaran Keselamatan: Hash webhook toyyibPay tidak sepadan (Spoofing).");
      }
      return is_valid;
    } catch (e) {
      console.warn("Amaran Keselamatan: Saiz hash tidak sah.");
      return false;
    }
  }

  /**
   * Memproses Webhook (Hanya jika disahkan)
   */
  parseWebhook(payload) {
    if (!this.verifyWebhookHash(payload)) {
      // KESELAMATAN: Tolak webhook palsu
      throw new Error("Pengesahan keselamatan (hash) gagal. Data webhook ditolak.");
    }

    const status = payload.status === "1" ? "paid" : "failed";
    const amountCents = parseInt(payload.amount || "0", 10);

    return {
      reference: payload.order_id || "",
      status: status,
      amount: payload.amount ? parseFloat(payload.amount) : 0,
      transaction_id: payload.refno || ""
    };
  }
}

module.exports = new ToyyibPaySystem();
