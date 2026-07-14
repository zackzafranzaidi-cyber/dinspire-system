const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// 2. Fungsi untuk menjana rumusan/nasihat AI
async function generateBusinessInsights(prompt, dashboardData, activeTab = 'dashboard', timeFilter = 'monthly') {
    const rawKeys = process.env.GEMINI_API_KEY || '';
    const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(k => k);
    const xaiKey = process.env.XAI_API_KEY ? process.env.XAI_API_KEY.trim() : null;
    const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;
    
    if (apiKeys.length === 0 && !xaiKey && !groqKey) {
        return JSON.stringify({ text: "Ralat: Kunci API AI tidak dijumpai." });
    }

    const systemInstruction = `
        Anda adalah Dinspire AI, Rakan Kongsi Perniagaan Eksekutif (AI UI Controller) untuk sistem papan pemuka Dinspire.
        Konteks UI Semasa: Pengguna sedang melihat tab: [${activeTab}], Penapis Masa: [${timeFilter}].
        
        Peranan Anda:
        1. Anda BUKAN sekadar robot pelapor. Bertindaklah sebagai penasihat perniagaan yang pintar, mesra, bertenaga, dan berwawasan (gunakan format Markdown). Gunakan ganti nama "Saya" dan panggil pengguna dengan gelaran hormat seperti "Tuan" atau "Boss". Bersembanglah secara semulajadi dan profesional.
        2. Anda kini mempunyai "LaporanJualanBulanan". Gunakannya untuk menganalisis corak perniagaan bulanan keseluruhan.
        3. Untuk memantau atau menyemak "prestasi staf", jualan pekerja, atau transaksi individu hari ini/terkini, SANGAT PENTING untuk anda HANYA merujuk data di dalam \`RingkasanTempahanTerkini\`. JANGAN sebut atau campur adukkan dengan LaporanJualanBulanan jika pengguna bertanyakan tentang pekerja/barber tertentu.
        4. Data \`RingkasanJualanProduk\` pula adalah KHAS untuk jualan e-dagang produk fizikal (bukan servis).
        5. Jika pengguna mengarahkan atau berniat menukar paparan skrin (cth: "buka rekod kehadiran", "pergi ke dashboard"), pulangkan fungsi kawalan 'action' dan 'target' (cth: SWITCH_TAB, punch).
        6. Jika pengguna meminta melihat graf/carta (cth: "tunjuk graf jualan", "chart bayaran"), pulangkan fungsi action: "SHOW_CHART" dan target yang sesuai.
        
        Format Output MESTILAH mematuhi JSON Schema berikut:
        {
            "text": "Jawapan perbualan mesra dan analitikal anda di sini (B.Melayu).",
            "action": "SWITCH_TAB" | "CHANGE_FILTER" | "SHOW_CHART" | null,
            "target": "dashboard" | "transactions" | "reviews" | "punch" | "daily" | "weekly" | "monthly" | "yearly" | "all" | "sales" | "demo" | "pay" | "staff" | null
        }
    `;

    const finalPrompt = `
        ${systemInstruction}
        
        [DATA PAPAN PEMUKA KESELURUHAN]:
        ${JSON.stringify(dashboardData)}
        
        [ARAHAN / SOALAN PENGGUNA]:
        ${prompt}
    `;

    // 1. Cubaan menggunakan Groq (Paling Laju) jika kunci tersedia
    if (groqKey) {
        try {
            console.log("Menggunakan model Groq (Llama-3.3-70B)...");
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${groqKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: `[DATA]:\n${JSON.stringify(dashboardData)}\n\n[SOALAN]:\n${prompt}` }
                    ],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })
            });

            if (response.ok) {
                const data = await response.json();
                let textResult = data.choices[0].message.content;
                
                // Cari block JSON secara paksa (backend extraction)
                const jsonMatch = textResult.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    textResult = jsonMatch[0];
                }
                
                // Sahkan JSON boleh dibaca
                try {
                    JSON.parse(textResult);
                } catch(e) {
                    // Jika gagal juga, kita format manual
                    textResult = JSON.stringify({ text: textResult.replace(/["'{}]/g, ''), action: null, target: null });
                }
                
                return textResult;
            } else {
                console.error("Gagal menggunakan Groq:", await response.text());
            }
        } catch (err) {
            console.error("Ralat rangkaian Groq:", err.message);
        }
    }

    // 2. Cubaan menggunakan xAI (Grok) jika kunci tersedia
    if (xaiKey) {
        try {
            console.log("Menggunakan model xAI (Grok)...");
            const response = await fetch("https://api.x.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${xaiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: `[DATA]:\n${JSON.stringify(dashboardData)}\n\n[SOALAN]:\n${prompt}` }
                    ],
                    model: "grok-2",
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                let textResult = data.choices[0].message.content;
                // Bersihkan text dari formatting markdown ```json jika ada
                if (textResult.startsWith('\`\`\`json')) {
                    textResult = textResult.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
                }
                return textResult;
            } else {
                console.error("Gagal menggunakan xAI:", await response.text());
            }
        } catch (err) {
            console.error("Ralat rangkaian xAI:", err.message);
        }
    }

    if (apiKeys.length > 0) {
        const fallbackModels = ["gemini-3.5-flash", "gemini-2.0-flash", "gemini-pro-latest"];

        for (let modelName of fallbackModels) {
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    // Gunakan API Key secara rawak untuk membahagikan trafik
                    const selectedKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
                    const genAI = new GoogleGenerativeAI(selectedKey);

                    const model = genAI.getGenerativeModel({ 
                        model: modelName,
                        generationConfig: { responseMimeType: "application/json" }
                    });

                    const result = await model.generateContent(finalPrompt);
                    const response = await result.response;
                    let textResult = response.text();
                    
                    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        textResult = jsonMatch[0];
                    }
                    try {
                        JSON.parse(textResult);
                    } catch(e) {
                        textResult = JSON.stringify({ text: textResult.replace(/["'{}]/g, ''), action: null, target: null });
                    }
                    
                    return textResult;

                } catch (error) {
                    const is503 = error.message && error.message.includes('503');
                    const is404 = error.message && error.message.includes('404');
                    const is429 = error.message && error.message.includes('429');

                    if (is404) {
                        console.log(`Model ${modelName} tidak wujud (404). Tukar ke model seterusnya...`);
                        break; // Skip to the next model in fallback list
                    }

                    if ((is503 || is429) && attempt < 3) {
                        console.log(`Model ${modelName} sibuk (${error.message}). Cuba lagi (Cubaan ${attempt}/3)...`);
                        await new Promise(resolve => setTimeout(resolve, attempt * 1500)); // Exponential backoff (1.5s, 3s)
                    } else if (attempt === 3) {
                        console.error(`Gagal menggunakan ${modelName} selepas 3 cubaan.`);
                        break; // Move to the next fallback model
                    } else {
                        console.error(`Ralat lain pada ${modelName}:`, error.message);
                        break; // Other fatal errors like invalid API Key
                    }
                }
            }
        }
    }

    return JSON.stringify({ 
        text: "Harap maaf, kesemua pelayan AI (Groq, xAI, Gemini) sedang sibuk atau mengalami kesesakan kritikal buat masa ini. Sila cuba sebentar lagi." 
    });
}

module.exports = { generateBusinessInsights };
