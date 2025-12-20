const vesselService = require("../services/vesselService");

const trackVessel = async (req, res) => {
    try {
        const { name } = req.query; // e.g. /api/vessel/track?name=EVER GIVEN

        if (!name) {
            return res.status(400).json({ message: "Please provide a vessel name" });
        }

        const data = await vesselService.searchVessel(name);

        if (!data) {
            return res.status(404).json({ message: "Vessel not found" });
        }

        res.json(data);
    } catch (error) {
        console.error("Error in trackVessel:", error);
        res.status(500).json({ message: "Failed to track vessel" });
    }
};

module.exports = {
    trackVessel,
};
