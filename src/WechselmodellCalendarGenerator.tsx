import { useState } from "react";

export default function WechselmodellCalendarGenerator() {
  const [intervalString, setIntervalString] = useState("2-3-2");
  const [startType, setStartType] = useState("Daniel");
  const [startDate, setStartDate] = useState("");
  const [message, setMessage] = useState(""); // Feedback
  const [loading, setLoading] = useState(false); // Ladezustand

  // Prüft, ob Intervalle korrekt sind: nur Zahlen getrennt durch Bindestrich
  const isIntervalValid = (str: string) => /^(\d+-)*\d+$/.test(str);

  // Button aktivieren nur, wenn Datum gewählt + Intervalle gültig
  const canSubmit = startDate !== "" && isIntervalValid(intervalString) && !loading;

  const generateICS = async () => {
    if (!startDate) {
      setMessage("⚠ Bitte wähle ein Startdatum aus!");
      return;
    }

    if (!isIntervalValid(intervalString)) {
      setMessage("⚠ Intervalle müssen nur Zahlen durch Bindestriche getrennt sein, z.B. 2-3-2");
      return;
    }

    setLoading(true);
    setMessage("⏳ Erstelle Kalender...");

    const body = {
      startDate,
      intervals: intervalString,
      startWith: startType,
    };

    try {
      const res = await fetch("/api/createCalendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Fehler beim Erstellen des Kalenders (${res.status})`);
      }

      const data = await res.json();

      // iPhone abonnieren
      const host = window.location.hostname;
const port = window.location.port; // z.B. 5173 oder 80
window.location.href = `webcal://${host}${port ? `:${port}` : ""}/cal/${data.id}.ics`;


      setMessage("✅ Kalender erfolgreich erstellt!");
    } catch (err: any) {
      if (err.message.includes("Failed to fetch")) {
        setMessage("❌ Server nicht erreichbar. Bitte prüfe, ob der Backend-Server läuft.");
      } else {
        setMessage(`❌ ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Wechselmodell Kalender</h2>

      <label>
        Startdatum:
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />
      </label>

      <label>
        Intervalle:
        <input
          value={intervalString}
          onChange={(e) => setIntervalString(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />
      </label>

      <label>
        Start mit:
        <select
          value={startType}
          onChange={(e) => setStartType(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        >
          <option>Daniel</option>
          <option>Zuhause</option>
        </select>
      </label>

      <button
        onClick={generateICS}
        disabled={!canSubmit}
        style={{
          padding: "8px 16px",
          cursor: canSubmit ? "pointer" : "not-allowed",
          marginBottom: 10,
        }}
      >
        {loading ? "Erstelle..." : "Abonnieren"}
      </button>

      {message && (
        <p style={{ fontWeight: "bold", color: message.startsWith("❌") ? "red" : "green" }}>
          {message}
        </p>
      )}
    </div>
  );
}
