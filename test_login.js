const supabase = require('./config/db');

async function testSysLogin() {
    console.log("Testing auth logic manually...");
    try {
        const { data: owners, error } = await supabase.from('owners').select('*').limit(1);
        console.log("Owners fetch:", owners ? "Success" : "Error:", error);
    } catch(e) {
        console.log("Exception:", e);
    }
}
testSysLogin();
