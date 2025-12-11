import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// --------------------
// Middleware
// --------------------
app.use(express.json());

// --------------------
// Funktion: Namhafte ID erzeugen
// --------------------
function generateCalendarId(startDate, intervals, startWith) {
  const str = `${startDate}-${intervals}-${startWith}`;
  // SHA1 hash + erste 10 Zeichen → URL-freundlich
  return crypto.createHash("sha1").update(str).digest("hex").substring(0, 10);
}

// --------------------
// API: Kalender erstellen
// --------------------
app.post("/api/createCalendar", (req, res) => {
  const { startDate, intervals, startWith, calendarId } = req.body;
  if (!startDate || !intervals || !startWith) {
    return res.status(400).json({ error: "Fehlende Daten" });
  }

  // Namhafte ID oder manuell gewählte ID
  const id = calendarId || generateCalendarId(startDate, intervals, startWith);

  // Intervall-basiert mehrtägige VEVENTs erstellen
  const start = new Date(startDate);
  const intervalArr = intervals.split("-").map(Number);
  let events = [];
  let currentStart = new Date(start);
  let currentPerson = startWith;

  intervalArr.forEach((days, i) => {
    const dtStart = currentStart.toISOString().split("T")[0].replace(/-/g, "");
    const dtEnd = new Date(currentStart);
    dtEnd.setDate(currentStart.getDate() + days); // Enddatum exklusiv
    const dtEndStr = dtEnd.toISOString().split("T")[0].replace(/-/g, "");

    events.push(`BEGIN:VEVENT
UID:${id}-${i}
DTSTART;VALUE=DATE:${dtStart}
DTEND;VALUE=DATE:${dtEndStr}
SUMMARY:Wechselmodell ${currentPerson}
END:VEVENT`);

    // nächsten Start setzen
    currentStart = dtEnd;
    currentPerson = currentPerson === "Daniel" ? "Zuhause" : "Daniel";
  });

  // ICS Inhalt zusammenstellen mit Kalendernamen
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Wechselmodell Planer//DE
X-WR-CALNAME:Wechselmodell Kalender
${events.join("\n")}
END:VCALENDAR`;

  // ICS Datei speichern
  const calDir = path.join(__dirname, "cal");
  if (!fs.existsSync(calDir)) fs.mkdirSync(calDir, { recursive: true });
  const icsPath = path.join(calDir, `${id}.ics`);
  fs.writeFileSync(icsPath, icsContent);

  // HTTPS URL zurückgeben
  const host = req.headers.host;
  res.json({
    id,
    url: `https://${host}/cal/${id}.ics`,
  });
});

// --------------------
// React Production Build ausliefern
// --------------------
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));

  // React Router Catch-All
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api") && !req.path.startsWith("/cal") && !req.path.includes(".")) {
      res.sendFile(path.join(distPath, "index.html"));
    } else {
      next();
    }
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
