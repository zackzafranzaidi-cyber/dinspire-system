require('dotenv').config();

async function test() {
    const xaiKey = process.env.XAI_API_KEY ? process.env.XAI_API_KEY.trim() : null;
    console.log("Key:", xaiKey ? "Found" : "Not Found");
    try {
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${xaiKey}`
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: "Sila jawab pendek: Hai" }],
                model: "grok-2-latest",
                temperature: 0.1
            })
        });
        const status = response.status;
        const text = await response.text();
        console.log("Status:", status);
        console.log("Body:", text);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
