import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// --------------------
// API: Kalender erstellen
// --------------------
app.post("/api/createCalendar", (req, res) => {
  const { startDate, intervals, startWith } = req.body;
  if (!startDate || !intervals || !startWith) {
    return res.status(400).json({ error: "Fehlende Daten" });
  }

  const id = Math.random().toString(36).substring(2, 12);

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Wechselmodell Planer//DE
BEGIN:VEVENT
UID:${id}
DTSTART;VALUE=DATE:${startDate.replace(/-/g, "")}
SUMMARY:Wechselmodell ${startWith}
END:VEVENT
END:VCALENDAR`;

  const calDir = path.join(__dirname, "cal");
  if (!fs.existsSync(calDir)) fs.mkdirSync(calDir, { recursive: true });

  fs.writeFileSync(path.join(calDir, `${id}.ics`), icsContent);

  res.json({
    id,
    url: `https://tildi.witchplease.de/cal/${id}.ics`,
  });
});

// --------------------
// React Production Build ausliefern
// --------------------
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));

  // React-Router Support
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log("Entwicklung: bitte Vite dev server separat starten (npm run dev)");
}

// --------------------
// Server starten
// --------------------
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}, NODE_ENV=${process.env.NODE_ENV}`);
});
