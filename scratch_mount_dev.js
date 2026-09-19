const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

if (!serverJs.includes('const devRoutes = require("./routes/dev");')) {
    // Mount routes
    serverJs = serverJs.replace('const adminRoutes = require("./routes/admin");', 'const adminRoutes = require("./routes/admin");\nconst devRoutes = require("./routes/dev");');
    serverJs = serverJs.replace('app.use("/api/admin", adminRoutes);', 'app.use("/api/admin", adminRoutes);\napp.use("/api/dev-sys-9x8q2", devRoutes);');
    
    fs.writeFileSync('server.js', serverJs);
    console.log('Mounted devRoutes in server.js');
}
