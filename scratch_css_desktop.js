const fs = require('fs');
const cssPath = 'public/customer/css/index.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Ensure we don't append it multiple times
if (!css.includes('/* DESKTOP UI ENHANCEMENTS */')) {
  css += `\n/* DESKTOP UI ENHANCEMENTS */
@media (min-width: 1024px) {
  /* Top Navbar */
  .desktop-top-nav {
    display: flex !important;
    justify-content: space-between;
    align-items: center;
    padding: 0 40px;
    height: 70px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 1001;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }
  .desktop-nav-logo {
    font-weight: 900;
    font-size: 24px;
    color: var(--text-main);
    letter-spacing: 1px;
  }
  .desktop-nav-links {
    display: flex;
    gap: 30px;
  }
  .desktop-nav-item {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    padding: 8px 12px;
    border-radius: 8px;
  }
  .desktop-nav-item:hover {
    color: var(--primary-blue);
    background: rgba(24, 119, 242, 0.05);
  }
  .desktop-nav-item.active {
    color: var(--primary-blue);
    background: rgba(24, 119, 242, 0.1);
  }

  /* Hide Bottom Nav */
  .bottom-nav {
    display: none !important;
  }

  /* Adjust View Content Padding */
  .view-content {
    padding-bottom: 20px !important; 
    padding-top: 20px !important;
  }

  /* Grid for Services instead of Horizontal Scroll */
  .category-section .flex.overflow-x-auto {
    flex-wrap: wrap !important;
    overflow-x: visible !important;
    justify-content: center !important;
    gap: 20px !important;
  }
  .category-section .flex.overflow-x-auto::-webkit-scrollbar {
    display: none !important;
  }
  .service-card {
    min-width: 200px !important;
    max-width: 250px !important;
    margin-right: 0 !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  /* Hover effects */
  .product-card:hover, .service-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    cursor: pointer;
  }

  /* Banner Width */
  .slider-viewport {
    max-width: 1000px !important;
    margin: 0 auto 30px auto !important;
    border-radius: 20px !important;
  }
}
`;
  fs.writeFileSync(cssPath, css);
  console.log('CSS updated');
} else {
  console.log('CSS already updated');
}
