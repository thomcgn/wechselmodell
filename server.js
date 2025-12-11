import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Ordner für ICS-Dateien
const calFolder = path.join(__dirname, "cal");
if (!fs.existsSync(calFolder)) fs.mkdirSync(calFolder);

// Sicheren Dateinamen erzeugen
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "-");
}

// ICS Generator
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

// API → ICS erzeugen
app.post("/api/createCalendar", (req, res) => {
  const { startDate, intervals, startWith, calendarId } = req.body;

  if (!startDate || !intervals || !startWith) {
    return res.status(400).json({ error: "Fehlende Daten" });
  }

  // Entweder benutzerdefinierter Name oder zufälliger
  const id =
    calendarId && calendarId.trim() !== ""
      ? sanitizeFilename(calendarId)
      : Math.random().toString(36).substring(2, 12);

  const icsContent = generateICS({
    startDate,
    intervals,
    startWith,
    calendarName: id,
  });

  const icsPath = path.join(calFolder, `${id}.ics`);
  fs.writeFileSync(icsPath, icsContent, "utf-8");

  console.log(`ICS-Datei erstellt: ${id}.ics`);

  res.json({
    id,
    url: `https://tildi.witchplease.de/cal/${id}.ics`,
  });
});

// ---------- Production React Build ----------
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "dist");

  // React Build
  app.use(express.static(distPath));

  // ICS Ordner öffentlich
  app.use("/cal", express.static(calFolder));

  // React Router fallback (Express 5 kompatibel, kein "*")
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log("Entwicklung: Vite separat starten (npm run dev)");
}

// Start Server
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}, NODE_ENV=${process.env.NODE_ENV}`);
});
