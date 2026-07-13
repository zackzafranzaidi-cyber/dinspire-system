const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkModels() {
    try {

        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY");
        const data = await res.json();
        console.log("Available models:");
        if (data.models) {
            data.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
        } else {
            console.log(data);
        }
    } catch (e) {
        console.error(e);
    }
}
checkModels();
