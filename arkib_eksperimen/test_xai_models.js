require('dotenv').config();

async function test() {
    const xaiKey = process.env.XAI_API_KEY ? process.env.XAI_API_KEY.trim() : null;
    try {
        const response = await fetch("https://api.x.ai/v1/models", {
            headers: { "Authorization": `Bearer ${xaiKey}` }
        });
        const text = await response.text();
        console.log("Models:", text);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
