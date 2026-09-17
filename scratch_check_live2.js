fetch('https://customer.dinspirebarbershop.com/customer/js/customer.js?v=50')
.then(r => r.text())
.then(text => {
  console.log('Status OK, size:', text.length);
  console.log('First 100:', text.substring(0, 100));
  console.log('Has fetchShopData:', text.includes('fetchShopData'));
  console.log('Has DOMContentLoaded:', text.includes('DOMContentLoaded'));
})
.catch(err => console.error(err));
