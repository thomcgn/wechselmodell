import express from "express";
import { createCalendarConfig, loadCalendarConfig } from "./storage.js";
import { generateICS } from "./icsGenerator.js";

const app = express();
app.use(express.json());

// 1) React sendet Kalenderdaten
app.post("/api/createCalendar", (req, res) => {
  const { startDate, intervals, startWith } = req.body;

  if (!startDate || !intervals || !startWith) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const id = createCalendarConfig({ startDate, intervals, startWith });

  // client soll abonnierbare URL erhalten
  return res.json({
    id,
    url: `https://example.com/cal/${id}.ics`
  });
});

// 2) iPhone ruft abonnierte ICS ab
app.get("/cal/:id.ics", (req, res) => {
  const id = req.params.id;
  const config = loadCalendarConfig(id);

  if (!config) {
    return res.status(404).send("Calendar not found");
  }

  const intervals = config.intervals
    .split("-")
    .map((x) => parseInt(x.trim()))
    .filter((x) => !isNaN(x));

  const ics = generateICS({
    startDate: config.startDate,
    intervals,
    startWith: config.startWith,
  });

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", "inline; filename=cal.ics");
  res.send(ics);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log("Server läuft auf Port", PORT);
});
