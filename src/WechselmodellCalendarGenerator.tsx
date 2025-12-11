import { useState } from "react";
import { Box, Card, CardContent, TextField, MenuItem, Button, Typography } from "@mui/material";
import "./WechselmodellCalendarGenerator.css";

export default function WechselmodellCalendarGenerator() {
  const [intervalString, setIntervalString] = useState("2-3-2");
  const [startType, setStartType] = useState("Daniel");
  const [startDate, setStartDate] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isIntervalValid = (str: string) => /^(\d+-)*\d+$/.test(str);
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

    const body: any = { startDate, intervals: intervalString, startWith: startType };
    if (calendarId.trim() !== "") body.calendarId = calendarId.trim();

    try {
      const res = await fetch("/api/createCalendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Fehler beim Erstellen des Kalenders (${res.status})`);
      const data = await res.json();

      const host = window.location.hostname;
      const port = window.location.port;
      window.location.href = `webcal://${host}${port ? `:${port}` : ""}/cal/${data.id}.ics`;

      setMessage("✅ Kalender erfolgreich erstellt!");
    } catch (err: any) {
      setMessage(err.message.includes("Failed to fetch")
        ? "❌ Server nicht erreichbar."
        : `❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="calendar-container">
      <Card className="calendar-card">
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Wechselmodell Kalender
          </Typography>

          <TextField
            label="Startdatum"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Intervalle"
            value={intervalString}
            onChange={(e) => setIntervalString(e.target.value)}
            placeholder="z. B. 2-3-2"
            fullWidth
            margin="normal"
            error={intervalString !== "" && !isIntervalValid(intervalString)}
          />

          <TextField
            select
            label="Start mit"
            value={startType}
            onChange={(e) => setStartType(e.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="Daniel">Daniel</MenuItem>
            <MenuItem value="Zuhause">Zuhause</MenuItem>
          </TextField>

          <TextField
            label="Kalender-ID (optional)"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            placeholder="z. B. daniel-zuhause"
            fullWidth
            margin="normal"
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={generateICS}
            disabled={!canSubmit}
            className="calendar-button"
          >
            {loading ? "Erstelle..." : "Abonnieren"}
          </Button>

          {message && (
            <Typography
              align="center"
              className={`calendar-message ${message.startsWith("❌") ? "error" : "success"}`}
            >
              {message}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
