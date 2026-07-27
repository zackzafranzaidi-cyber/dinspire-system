require('dotenv').config();

async function test() {
    const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;
    console.log("Groq Key:", groqKey ? "Found" : "Not Found");
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "Sila patuhi JSON Schema berikut secara mutlak: { \"text\": \"...\", \"action\": null, \"target\": null }. Jangan tulis apa-apa mesej lain selain JSON ini." },
                    { role: "user", content: "Rumuskan data jualan ini: RM433.00" }
                ],
                model: "llama-3.3-70b-versatile",
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
