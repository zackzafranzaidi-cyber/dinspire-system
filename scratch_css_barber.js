const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const barberCSS = `
  /* Barber Pole Avatar Animation */
  .barber-pole-wrapper {
    position: relative;
    width: 76px;
    height: 76px;
    border-radius: 50%;
    margin: 0 auto 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  .barber-pole-wrapper::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      #ff2a2a 0deg 60deg, 
      #ffffff 60deg 120deg, 
      #1877f2 120deg 180deg, 
      #ff2a2a 180deg 240deg, 
      #ffffff 240deg 300deg, 
      #1877f2 300deg 360deg
    );
    animation: barber-spin 3s linear infinite;
  }
  
  .barber-pole-wrapper img {
    position: relative;
    z-index: 1;
    width: 68px;
    height: 68px;
    border-radius: 50%;
    object-fit: cover;
    background-color: white;
    border: 3px solid white;
  }
  
  @keyframes barber-spin {
    100% { transform: rotate(360deg); }
  }
`;

css += barberCSS;
fs.writeFileSync('public/css/index.css', css);
console.log("Added CSS for barber pole.");
