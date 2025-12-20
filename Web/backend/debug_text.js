const axios = require("axios");
const cheerio = require("cheerio");

async function debugText() {
    try {
        const url = "https://www.vesselfinder.com/vessels/details/9401063";
        console.log(`🔍 Fetching: ${url}`);

        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        };

        const response = await axios.get(url, { headers, decompress: true });
        const $ = cheerio.load(response.data);
        const text = $("body").text().replace(/\s+/g, " ");

        console.log("--- Body Text Start ---");
        console.log(text.substring(0, 1000));
        console.log("--- Body Text End ---");

        if (text.includes("sailing at a speed of")) {
            console.log("✅ Found 'sailing at a speed of' phrase.");
            const match = text.match(/sailing at a speed of\s*([\d.]+)\s*knots/i);
            console.log("Match:", match);
        } else {
            console.log("❌ SEO text block NOT found.");
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugText();
