const fs = require('fs');
let toyyibpayJs = fs.readFileSync('utils/toyyibpay.js', 'utf8');

if (!toyyibpayJs.includes('sandbox_payment')) {
    toyyibpayJs = toyyibpayJs.replace(
        'const amountCents = Math.round(amountRM * 100);',
        `
      // [SANDBOX] Inject dev keys if Sandbox Mode is active
      let targetSecret = this.secretKey;
      let targetCategory = this.categoryCode;
      let targetBase = this.baseUrl;
      let isSandbox = false;

      if (global.featureFlags && global.featureFlags.sandbox_payment) {
         targetSecret = process.env.TOYYIBPAY_SECRET_TEST || targetSecret;
         targetCategory = process.env.TOYYIBPAY_CATEGORY_TEST || targetCategory;
         targetBase = "https://dev.toyyibpay.com";
         isSandbox = true;
      }
      
      const amountCents = Math.round(amountRM * 100);
      `
    );
    
    toyyibpayJs = toyyibpayJs.replace(
        'userSecretKey: this.secretKey,',
        'userSecretKey: targetSecret,'
    );
    toyyibpayJs = toyyibpayJs.replace(
        'categoryCode: this.categoryCode,',
        'categoryCode: targetCategory,'
    );
    
    // Also use the right client base URL for the request
    toyyibpayJs = toyyibpayJs.replace(
        'const response = await this.client.post("/index.php/api/createBill", payload.toString());',
        `
      let finalClient = this.client;
      if (isSandbox) {
         finalClient = axios.create({ baseURL: targetBase, timeout: this.timeout, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      }
      const response = await finalClient.post("/index.php/api/createBill", payload.toString());
        `
    );
    
    toyyibpayJs = toyyibpayJs.replace(
        'payment_url: `${this.baseUrl}/${billCode}`',
        'payment_url: `${targetBase}/${billCode}`'
    );
    
    fs.writeFileSync('utils/toyyibpay.js', toyyibpayJs);
    console.log('Added Sandbox Mode to toyyibpay.js');
}
