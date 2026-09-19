const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

if (!serverJs.includes('initFeatureFlags')) {
    serverJs = serverJs.replace('const logger = require("./utils/logger");', 'const logger = require("./utils/logger");\nconst { initFeatureFlags } = require("./utils/featureFlags");');
    
    serverJs = serverJs.replace('const server = app.listen(PORT, async () => {', 'const server = app.listen(PORT, async () => {\n  await initFeatureFlags();');
    
    fs.writeFileSync('server.js', serverJs);
    console.log('Added initFeatureFlags to server.js');
}
