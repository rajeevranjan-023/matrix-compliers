require("dotenv").config();
const express = require("express");
const cors = require("cors");
const designRoutes = require("./routes/design");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", designRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ShelterIQ backend running on http://localhost:${PORT}`);
});
