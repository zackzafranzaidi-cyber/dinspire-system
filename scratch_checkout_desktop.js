const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const injection = `

  /* Jadikan checkout-bar sebagai panel sisi kanan kekal di Desktop */
  .checkout-bar {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    right: 0 !important;
    left: auto !important;
    width: 280px !important;
    height: 100dvh !important;
    border-top: none !important;
    border-left: 1px solid var(--border-color) !important;
    background-color: #f8fafc !important;
    box-shadow: -4px 0 25px rgba(0,0,0,0.03) !important;
    gap: 20px !important;
    padding: 40px !important;
  }
  
  .checkout-bar > div:first-child {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .checkout-label {
    font-size: 13px !important;
    text-align: center;
  }
  
  .checkout-price {
    font-size: 28px !important;
    text-align: center;
  }
  
  .checkout-bar > div:last-child {
    flex-direction: row;
    width: 100%;
    gap: 10px !important;
  }
  
  .buy-now-btn {
    width: 100% !important;
    height: 45px !important;
    font-size: 15px !important;
    border-radius: 12px !important;
  }
  
  .cart-edit-icon-btn {
    width: 45px !important;
    height: 45px !important;
    border-radius: 12px !important;
    font-size: 18px !important;
    background: #ffffff !important;
    border: 1px solid var(--border-color) !important;
    color: var(--primary-blue) !important;
  }
  
  .view-content {
    padding-right: 280px !important;
  }
  
  .bottom-nav {
    padding-right: calc(max(0px, (100% - 400px) / 2) + 280px) !important;
  }
`;

const target = `@media (min-width: 768px) {`;

if (css.includes(target)) {
    css = css.replace(target, target + injection);
    fs.writeFileSync('public/css/index.css', css);
    console.log("Injected desktop checkout bar CSS.");
} else {
    console.log("Could not find target.");
}
