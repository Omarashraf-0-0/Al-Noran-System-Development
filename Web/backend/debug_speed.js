const axios = require("axios");
const cheerio = require("cheerio");

async function debugSpeed() {
    try {
        const url = "https://www.vesselfinder.com/vessels/details/9401063"; // SSF GALENE
        console.log(`🔍 Fetching: ${url}`);

        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        };

        const response = await axios.get(url, { headers, decompress: true });
        const $ = cheerio.load(response.data);

        // Check #spv0 specifically
        const speedEl = $("#spv0");
        console.log("Element #spv0 found:", speedEl.length);

        if (speedEl.length > 0) {
            const rawText = speedEl.text();
            console.log(`Raw Text: "${rawText}"`);

            const trimmed = rawText.trim();
            console.log(`Trimmed: "${trimmed}"`);

            // Test regex
            const regex = /[\/]\s*([\d.]+)\s*kn/;
            const match = trimmed.match(regex);
            console.log("Regex Match:", match);

            if (match && match[1]) {
                console.log("Extracted Speed:", parseFloat(match[1]));
            } else {
                console.log("❌ Regex failed to match speed number.");
            }
        } else {
            console.log("❌ Element #spv0 NOT found in HTML.");
            // Dump close IDs or classes?
            console.log("Alternative: search for 'kn' text:");
            const knElements = $("*:contains('kn')").last();
            console.log("Text containing 'kn':", knElements.text().substring(0, 50));
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugSpeed();
