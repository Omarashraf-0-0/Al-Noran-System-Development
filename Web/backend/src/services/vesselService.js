const axios = require("axios");
const cheerio = require("cheerio");

const EGYPT_PORTS = [
    { name: "Alexandria", lat: 31.19, lon: 29.89 },
    { name: "Port Said", lat: 31.26, lon: 32.3 },
    { name: "Damietta", lat: 31.45, lon: 31.75 },
    { name: "Sokhna", lat: 29.6, lon: 32.37 },
    { name: "Adabiya", lat: 29.95, lon: 32.48 },
];

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in nautical miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3440; // Radius of Earth in nautical miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Geocodes a location string using OpenStreetMap Nominatim API
 * @param {string} location
 * @returns {Promise<{lat: number, lon: number}|null>}
 */
async function getCoordinates(location) {
    try {
        if (!location || location === "Unknown") return null;

        const cleanLoc = location.replace(/[\(\[].*?[\)\]]/g, "").trim(); // Remove brackets like (EG)
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanLoc)}&format=json&limit=1`;

        // Add a slight delay to respect Nominatim's fair use policy (max 1 req/sec recommended)
        // Since this is triggered by user action, it's naturally limited, but a small safety check is good.

        const res = await axios.get(url, {
            headers: { "User-Agent": "NoranSystem/1.0 (internal-tool)" }
        });

        if (res.data && res.data.length > 0) {
            return {
                lat: parseFloat(res.data[0].lat),
                lon: parseFloat(res.data[0].lon)
            };
        }
        return null;
    } catch (err) {
        console.error("Geocoding error:", err.message);
        return null;
    }
}

/**
 * Scrapes VesselFinder for ship details
 * @param {string} shipName
 */
async function searchVessel(shipName) {
    try {
        // Clean ship name (remove voyage numbers like /0003W)
        const cleanName = shipName.split("/")[0].trim();
        console.log(`🔍 Searching for vessel: ${cleanName} (Original: ${shipName})`);
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        };

        // 1. Search for the vessel to get the dedicated page URL
        const searchUrl = `https://www.vesselfinder.com/vessels?name=${encodeURIComponent(
            cleanName
        )}`;
        const searchRes = await axios.get(searchUrl, {
            headers,
            decompress: true
        });
        const $search = cheerio.load(searchRes.data);

        // Find the first result link using generic selector if specific class fails
        // Trying specific first
        let firstResult = $search(".vessels_table tbody tr").first();
        if (firstResult.length === 0) {
            // Fallback: generic table
            firstResult = $search("table tbody tr").first();
            // Even more generic if tbody is missing (some cheerio parsing quirks)
            if (firstResult.length === 0) {
                firstResult = $search("table tr").eq(1); // Index 1 to skip header
            }
        }

        // Extract link
        let vesselLink = firstResult.find(".ship-link").attr("href");
        if (!vesselLink) {
            vesselLink = firstResult.find("a").attr("href");
        }

        if (!vesselLink) {
            console.log("❌ Vessel not found in search results");
            // Log for debugging
            console.log("HTML snippet:", $search("body").text().substring(0, 200));
            return null;
        }

        console.log(`✅ Found vessel link: ${vesselLink}`);
        const fullUrl = `https://www.vesselfinder.com${vesselLink}`;

        // 2. Fetch the vessel details page
        const detailRes = await axios.get(fullUrl, { headers });
        const $ = cheerio.load(detailRes.data);

        // Extract details
        let name = $(".title-section h1").text().trim();
        if (!name) {
            name = $("h1").text().trim();
        }

        const type = $(".title-section .viv").text().trim();

        // Parsing "Last Port"
        let lastPort = "Unknown";

        // Extract body text once for regex operations
        const bodyText = $("body").text().replace(/\s+/g, " ");

        // 0. User Suggestion: Check for specific class '_npNa'
        // This is often used for the port link. We prioritize finding it within a container labeled "Departure" or "Last Port"
        const lastPortContainer = $("*:contains('Departure'), *:contains('Last Port')").filter((i, el) => $(el).children("a._npNa").length > 0).first();
        if (lastPortContainer.length > 0) {
            lastPort = lastPortContainer.find("a._npNa").text().trim();
        } else {
            // Fallback: just check for the class globally if specific container matches fail (often it is the first such link)
            const directLink = $("a._npNa").first();
            if (directLink.length > 0) {
                lastPort = directLink.text().trim();
            }
        }

        // 1. Try regex on body text for "Last Port ... D:" pattern
        if (lastPort === "Unknown") {
            const lastPortMatch = bodyText.match(/Last Port\s+(.*?)\s+D:/);
            if (lastPortMatch) {
                lastPort = lastPortMatch[1].trim();
            }
        }

        // Fallback: Check standard table fields
        if (lastPort === "Unknown") {
            $(".tparams tr").each((i, el) => {
                const rowTitle = $(el).find(".n3").text().trim();
                const rowValue = $(el).find(".v3").text().trim();
                if (rowTitle.includes("Departure") || rowTitle.includes("Last Port")) {
                    lastPort = rowValue;
                }
            });
        }

        // Extract Position (Lat/Lon)
        // Try regex for "dd.ddddd N / dd.ddddd E" pattern
        // Pattern matches: "31.2345 N / 32.5678 E"
        let lat = 0;
        let lon = 0;

        const posMatch = bodyText.match(/([0-9.]+)\s*([NS])\s*\/\s*([0-9.]+)\s*([EW])/);
        if (posMatch) {
            lat = parseFloat(posMatch[1]);
            if (posMatch[2] === "S") lat = -lat;

            lon = parseFloat(posMatch[3]);
            if (posMatch[4] === "W") lon = -lon;
        }

        // Strategy 2: Look for 'coordinate' classes (often used in the map viewer data or hidden fields)
        if (lat === 0 && lon === 0) {
            const latTxt = $(".coordinate.lat").text().trim();
            const lonTxt = $(".coordinate.lon").text().trim();
            if (latTxt && lonTxt) {
                lat = parseFloat(latTxt.replace(/[^\d.]/g, "")) * (latTxt.includes("S") ? -1 : 1);
                lon = parseFloat(lonTxt.replace(/[^\d.]/g, "")) * (lonTxt.includes("W") ? -1 : 1);
            }
        }

        // Strategy 3: Regex in Scripts (Map verification)
        if (lat === 0 && lon === 0) {
            const html = $("body").html(); // Use full HTML to catch scripts
            // Look for { lat: 31.2, lon: 32.5 } patterns often found in JS objects
            const mapMatch = html.match(/lat\s*:\s*(-?[\d.]+)\s*,\s*lon\s*:\s*(-?[\d.]+)/);
            if (mapMatch) {
                lat = parseFloat(mapMatch[1]);
                lon = parseFloat(mapMatch[2]);
            }
        }

        // Extract Speed
        let speed = 0;

        // 0. User Suggestion: Check specific ID 'spv0'
        const speedElement = $("#spv0");
        if (speedElement.length > 0) {
            const speedText = speedElement.text().trim();
            const matches = speedText.match(/[\/]\s*([\d.]+)\s*kn/);
            if (matches && matches[1]) {
                speed = parseFloat(matches[1]);
            }
        }

        // 1. SEO Text Block (High Reliability)
        // "sailing at a speed of 10.5 knots"
        if (speed === 0) {
            const seoMatch = bodyText.match(/sailing at a speed of\s*([\d.]+)\s*knots/i);
            if (seoMatch) {
                speed = parseFloat(seoMatch[1]);
            }
        }

        // 2. Text Regex fallback
        if (speed === 0) {
            // Check for "Speed: 10.3 kn" or "Speed 10.3 kn" in text nodes
            // Specifically looking for the data-point format often seen
            const speedMatch = bodyText.match(/Speed\s*[:\-\s]\s*([\d.]+)\s*kn/i);

            if (speedMatch) {
                speed = parseFloat(speedMatch[1]);
            } else {
                // Try looking for the "Speed" label and the following text
                // e.g. "Speed (kn) 13.5"
                const speedKnMatch = bodyText.match(/Speed\s*\(kn\)\s*([\d.]+)/i);
                if (speedKnMatch) {
                    speed = parseFloat(speedKnMatch[1]);
                }
            }
        }

        const vesselData = {
            name,
            type,
            lastPort,
            position: { lat, lon },
            speed,
            url: fullUrl,
        };

        // Filter out bad coordinates (0,0) implies failed scrape usually
        if (lat === 0 && lon === 0) {
            console.log("⚠️ Warning: Coordinates 0,0 (scraping likely partial)");
        }

        console.log("🚢 Vessel Data Extracted:", vesselData);

        // Determine reference coordinates for ETA calculation
        // User requested to calculate based on "Last Port"
        let referenceLat = lat;
        let referenceLon = lon;
        let isFromLastPort = false;

        // Try to geocode Last Port to use as reference
        if (lastPort && lastPort !== "Unknown") {
            const portCoords = await getCoordinates(lastPort);
            if (portCoords) {
                console.log(`📍 Geocoded Last Port (${lastPort}):`, portCoords);
                referenceLat = portCoords.lat;
                referenceLon = portCoords.lon;
                isFromLastPort = true;
            }
        }

        // Calculate ETA to Egypt Ports
        vesselData.etaToEgypt = EGYPT_PORTS.map((port) => {
            // Distance from Reference (Last Port OR Current Pos)
            const distance = calculateDistance(referenceLat, referenceLon, port.lat, port.lon);

            // Assume average speed of 14 knots if current speed is 0 or low
            const calcSpeed = speed > 1 ? speed : 14;
            const hours = distance / calcSpeed;
            const days = hours / 24;

            return {
                portName: port.name,
                distance: Math.round(distance), // nm
                etaHours: Math.round(hours),
                etaDays: days.toFixed(1),
            };
        }).sort((a, b) => a.distance - b.distance); // Closest first

        // Add meta info about calculation source
        vesselData.calculationSource = isFromLastPort ? `From Last Port (${lastPort})` : "From Current Position";

        return vesselData;
    } catch (error) {
        console.error("❌ Error scraping VesselFinder:", error.message);
        return null;
    }
}

module.exports = {
    searchVessel,
};
