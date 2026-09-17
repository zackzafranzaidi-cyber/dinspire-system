const fs = require('fs');

function fixInfiniteLoop(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the infinite while loop with a limited retry loop
    const oldLoop = `let success = false;
  while (!success) {
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(\`\${API_BASE_URL}/shop-data?t=\${timestamp}\`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      shopData = await res.json();
      success = true;
    } catch (err) {
      console.warn("Sedang memuatkan pangkalan data (Cold Start)...", err.message);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }`;

    const newLoop = `let success = false;
  let retries = 0;
  while (!success && retries < 3) {
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(\`\${API_BASE_URL}/shop-data?t=\${timestamp}\`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      shopData = await res.json();
      success = true;
    } catch (err) {
      retries++;
      console.warn("Sedang memuatkan pangkalan data (Cold Start)... Percubaan " + retries, err.message);
      if (retries < 3) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        alert("Gagal memuat turun data pelayan. Sila semak internet anda atau 'Swipe Up' untuk tutup aplikasi dan buka semula.");
        hideGlobalLoader();
        return; // Stop execution
      }
    }
  }`;
    
    if (content.includes('while (!success) {') && content.includes('shop-data?t=${timestamp}')) {
        content = content.replace(oldLoop, newLoop);
        fs.writeFileSync(filePath, content);
        console.log("Fixed infinite loop in " + filePath);
    }
}

fixInfiniteLoop('public/customer/js/index.js');
