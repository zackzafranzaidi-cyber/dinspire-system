fetch('https://customer.dinspirebarbershop.com/')
.then(r => r.text())
.then(html => {
  // Find all script src tags
  const regex = /src="([^"]*\.js[^"]*)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    console.log('Script:', match[1]);
  }
  // Also check the CSS links
  const cssRegex = /href="([^"]*\.css[^"]*)"/g;
  while ((match = cssRegex.exec(html)) !== null) {
    console.log('CSS:', match[1]);
  }
})
