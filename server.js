import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// --------------------
// Ordner für ICS-Dateien
// --------------------
const calFolder = path.join(__dirname, "cal");
if (!fs.existsSync(calFolder)) fs.mkdirSync(calFolder);

// --------------------
// Hilfsfunktion: ICS-Datei generieren
// --------------------
function generateICS({ startDate, intervals, startWith, calendarName }) {
  const start = new Date(startDate);
  const intervalArray = intervals.split("-").map(Number);

  let events = "";
  let currentStart = new Date(start);
  let currentType = startWith;

  intervalArray.forEach((days, index) => {
    const endDate = new Date(currentStart);
    endDate.setDate(endDate.getDate() + days);

    const startStr = currentStart.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endStr = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    events += `
BEGIN:VEVENT
UID:${calendarName}-${index}@wechselmodell
SUMMARY:Wechselmodell - ${currentType}
DTSTART:${startStr}
DTEND:${endStr}
END:VEVENT
`;

    currentStart = new Date(endDate);
    currentType = currentType === "Daniel" ? "Zuhause" : "Daniel";
  });

  return `
BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Wechselmodell//Calendar//DE
${events}
END:VCALENDAR
  `.trim();
}

// --------------------
// API Endpoint
// --------------------
app.post("/api/createCalendar", (req, res) => {
  const { startDate, intervals, startWith, calendarId } = req.body;

  if (!startDate || !intervals || !startWith) {
    return res.status(400).json({ error: "Fehlende Daten" });
  }

  const id = calendarId && calendarId.trim() !== "" ? calendarId.trim() : Math.random().toString(36).substring(2, 12);
  const icsContent = generateICS({ startDate, intervals, startWith, calendarName: id });

  const icsPath = path.join(calFolder, `${id}.ics`);
  fs.writeFileSync(icsPath, icsContent, "utf-8");

  res.json({
    id,
    url: `https://tildi.witchplease.de/cal/${id}.ics`,
  });
});

// --------------------
// Produktion: React ausliefern
// --------------------
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "dist");

  // Statische Dateien
  app.use(express.static(distPath));

  // React-Router Fallback
  app.use((req, res, next) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log("Entwicklung: bitte separat Vite dev server starten (npm run dev)");
}

// --------------------
// Server starten
// --------------------
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}, NODE_ENV=${process.env.NODE_ENV}`);
});
