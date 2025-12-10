import React, { useState } from "react";

export default function WechselmodellCalendarGenerator() {
  const [intervalString, setIntervalString] = useState("2-3-2");
  const [startType, setStartType] = useState("Daniel");
  const [startDate, setStartDate] = useState("");

  const generateICS = () => {
    if (!startDate) {
      alert("Bitte ein Startdatum wählen.");
      return;
    }

    const intervals = intervalString
      .split("-")
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n));

    if (intervals.length === 0) {
      alert("Ungültige Intervalle.");
      return;
    }

    let currentDate = new Date(startDate);
    let isDaniel = startType === "Daniel";

    let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourApp//Wechselmodell//EN\n`;

    intervals.forEach((nights, idx) => {
      // Startzeit 15:00 Uhr am Übergabetag
      let blockStart = new Date(currentDate);
      blockStart.setHours(15, 0, 0, 0);

      // Endzeit = Start + Anzahl Nächte (jede Nacht = Abholtag + 1 Tag), danach Übergabe
      let blockEnd = new Date(blockStart);
      blockEnd.setDate(blockEnd.getDate() + nights); // Nächster Abholtag nach nights Nächten
      blockEnd.setHours(15, 0, 0, 0);

      const title = isDaniel ? "Daniel" : "Zuhause";
      const uid = `${blockStart.getTime()}-${idx}@wechselmodell`;

      const formatDate = (d) =>
        d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      ics +=
        "BEGIN:VEVENT\n" +
        `UID:${uid}\n` +
        `DTSTAMP:${formatDate(new Date())}\n` +
        `DTSTART:${formatDate(blockStart)}\n` +
        `DTEND:${formatDate(blockEnd)}\n` +
        `SUMMARY:${title} – ${nights} Nächte\n` +
        "END:VEVENT\n";

      // Nächster Block beginnt **direkt nach der Übergabe des aktuellen Blocks**
      currentDate = new Date(blockEnd);
      isDaniel = !isDaniel;
    });

    ics += "END:VCALENDAR";

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wechselmodell-calendar.ics";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 400, padding: 20, fontFamily: "sans-serif" }}>
      <h2>Wechselmodell</h2>

      <label>Startdatum</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={{ width: "100%", marginBottom: 15 }}
      />

      <label>Intervalle (z.B. 2-3-2)</label>
      <input
        type="text"
        value={intervalString}
        onChange={(e) => setIntervalString(e.target.value)}
        style={{ width: "100%", marginBottom: 15 }}
      />

      <label>Start mit:</label>
      <select
        value={startType}
        onChange={(e) => setStartType(e.target.value)}
        style={{ width: "100%", marginBottom: 15 }}
      >
        <option value="Daniel">Daniel</option>
        <option value="Zuhause">Zuhause</option>
      </select>

      <button onClick={generateICS} style={{ padding: "10px 20px" }}>
        ICS Datei erzeugen
      </button>
    </div>
  );
}
