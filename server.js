const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3001;

// --------------------
// Middleware
// --------------------
app.use(express.json());

// --------------------
// API Endpoint: Kalender erstellen
// --------------------
app.post("/api/createCalendar", (req, res) => {
  const { startDate, intervals, startWith } = req.body;
  if (!startDate || !intervals || !startWith) {
    return res.status(400).json({ error: "Fehlende Daten" });
  }

  const id = Math.random().toString(36).substring(2, 12);

  // ICS Inhalt generieren
  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Wechselmodell Planer//DE
BEGIN:VEVENT
UID:${id}
DTSTART;VALUE=DATE:${startDate.replace(/-/g, "")}
SUMMARY:Wechselmodell ${startWith}
END:VEVENT
END:VCALENDAR
`.trim();

  // Pfad zum Speichern
  const calDir = path.join(__dirname, "cal");
  if (!fs.existsSync(calDir)) fs.mkdirSync(calDir, { recursive: true });

  const calPath = path.join(calDir, `${id}.ics`);
  fs.writeFileSync(calPath, icsContent);

  res.json({
    id,
    url: `https://tildi.witchplease.de/cal/${id}.ics`,
  });
});

// --------------------
// Produktion: statische React-Dateien ausliefern
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
