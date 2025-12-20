const axios = require("axios");
const cheerio = require("cheerio");

async function debugDetailScraper() {
    try {
        const url = "https://www.vesselfinder.com/vessels/details/9401063";
        console.log(`🔍 Fetching: ${url}`);

        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        };

        const response = await axios.get(url, { headers, decompress: true });
        const $ = cheerio.load(response.data);

        const title = $("title").text().trim();
        console.log(`Page Title: "${title}"`);

        // Dump H1 parent class
        console.log("H1 Parent Class:", $("h1").parent().attr("class"));

        // Find tables
        const tables = $("table");
        console.log(`Found ${tables.length} tables.`);
        if (tables.length > 0) {
            console.log("First Table Class:", tables.first().attr("class"));
            // Dump first row of first table
            console.log("Row 1:", tables.first().find("tr").first().text().replace(/\s+/g, " ").trim());
        }

        // Look for typical "Last Port" labels
        const bodyText = $("body").html();
        if (bodyText.includes("Last Port")) {
            console.log("Found 'Last Port' in HTML.");
            // Try to find the container
            const lastPortContainer = $("*:contains('Last Port')").last().parent();
            console.log("Last Port Container Class:", lastPortContainer.attr("class"));
            console.log("Last Port Container Text:", lastPortContainer.text().replace(/\s+/g, " ").substring(0, 100));

            // Try regex
            const text = lastPortContainer.text().replace(/\s+/g, " ");
            const match = text.match(/Last Port\s+(.*?)\s+D:/);
            if (match) {
                console.log("EXTRACTED PORT:", match[1]);
            }
        } else if (bodyText.includes("Departure")) {
            console.log("Found 'Departure' in HTML.");
            const el = $("*:contains('Departure')").last();
            console.log("Departure element tag:", el.prop("tagName"));
            console.log("Departure parent text:", el.parent().text().replace(/\s+/g, " ").substring(0, 100));
        }

        // Dump all table rows keys
        $("tr").each((i, row) => {
            const cells = $(row).find("td");
            if (cells.length >= 2) {
                const key = $(cells[0]).text().trim();
                const value = $(cells[1]).text().trim();
                console.log(`Table Row: [${key}] -> [${value}]`);
            }
        });

        // Find Position
        const latEl = $("*:contains('Latitude')").last();
        if (latEl.length) {
            console.log("Latitude Container Text:", latEl.parent().text().replace(/\s+/g, " ").trim());
        }

        const speedEl = $("*:contains('Speed')").last();
        if (speedEl.length) {
            console.log("Speed Container Text:", speedEl.parent().text().replace(/\s+/g, " ").trim());
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugDetailScraper();
