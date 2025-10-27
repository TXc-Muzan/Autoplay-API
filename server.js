import express from "express";
import fs from "fs";
import axios from "axios";

const app = express();
app.use(express.json());

// 🔧 Replace this with your actual GitHub info:
const REPO = "TXc-Muzan/Autoplay-API"; // e.g. TXcMuzan/shinobu-songs-api
const FILE = "songs.json";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // set this in Render environment

// 🟢 GET all songs
app.get("/songs", async (req, res) => {
  try {
    const raw = await axios.get(`https://raw.githubusercontent.com/${REPO}/main/${FILE}`);
    res.json(raw.data);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🟡 POST add new song
app.post("/add", async (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ error: "Missing name or url" });

    // Step 1: get existing songs
    const getRes = await axios.get(`https://raw.githubusercontent.com/${REPO}/main/${FILE}`);
    const songs = getRes.data;
    const exists = songs.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) return res.status(400).json({ error: "Song name already exists." });

    // Step 2: add new song
    songs.push({ name: name.toLowerCase(), url });

    // Step 3: get file SHA
    const shaRes = await axios.get(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });

    // Step 4: update GitHub file
    await axios.put(
      `https://api.github.com/repos/${REPO}/contents/${FILE}`,
      {
        message: `Add song ${name}`,
        content: Buffer.from(JSON.stringify(songs, null, 2)).toString("base64"),
        sha: shaRes.data.sha
      },
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
    );

    res.json({ success: true, message: `✅ Song "${name}" added successfully.` });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("✅ Shinobu Songs API running on port 3000"));
