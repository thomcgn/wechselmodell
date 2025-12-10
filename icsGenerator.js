export function generateICS({ startDate, intervals, startWith }) {
  const formatDate = (d) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let currentDate = new Date(startDate);
  currentDate.setHours(15, 0, 0, 0);

  let isDaniel = startWith === "Daniel";

  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Wechselmodell//EN\n";

  intervals.forEach((nights, idx) => {
    const blockStart = new Date(currentDate);

    const blockEnd = new Date(blockStart);
    blockEnd.setDate(blockEnd.getDate() + nights);
    blockEnd.setHours(15, 0, 0, 0);

    const title = isDaniel ? "Daniel" : "Zuhause";

    ics +=
      "BEGIN:VEVENT\n" +
      `UID:${blockStart.getTime()}-${idx}@wechselmodell\n` +
      `DTSTAMP:${formatDate(new Date())}\n` +
      `DTSTART:${formatDate(blockStart)}\n` +
      `DTEND:${formatDate(blockEnd)}\n` +
      `SUMMARY:${title} – ${nights} Nächte\n` +
      "END:VEVENT\n";

    currentDate = new Date(blockEnd);
    isDaniel = !isDaniel;
  });

  ics += "END:VCALENDAR";
  return ics;
}
