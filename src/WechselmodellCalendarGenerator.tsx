import { useState } from "react";
import { Box, Card, CardContent, TextField, MenuItem, Button, Typography } from "@mui/material";

export default function WechselmodellCalendarGenerator() {
  const [intervalString, setIntervalString] = useState("2-3-2");
  const [startType, setStartType] = useState("Daniel");
  const [startDate, setStartDate] = useState("");
  const [calendarId, setCalendarId] = useState(""); // optional
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isIntervalValid = (str: string) => /^(\d+-)*\d+$/.test(str);
  const canSubmit = startDate !== "" && isIntervalValid(intervalString) && !loading;

  const generateICS = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setMessage("⏳ Erstelle Kalender...");

    // Body für POST
    const body: any = {
      startDate,
      intervals: intervalString,
      startWith: startType,
      calendarId: calendarId.trim() !== "" ? calendarId.trim() : undefined
    };

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

      // Webcal-Link öffnen
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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
        bgcolor: "#f5f5f5"
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h5" mb={2} align="center">
            Wechselmodell Kalender
          </Typography>

          <TextField
            label="Startdatum"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Intervalle"
            value={intervalString}
            onChange={(e) => setIntervalString(e.target.value)}
            helperText="Zahlen durch Bindestriche getrennt, z.B. 2-3-2"
            fullWidth
            margin="normal"
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
            label="Kalendername (optional)"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            fullWidth
            margin="normal"
            helperText="z. B. motti – wird als Kalendername angezeigt"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={generateICS}
            disabled={!canSubmit}
            fullWidth
            sx={{ mt: 2 }}
          >
            {loading ? "Erstelle..." : "Abonnieren"}
          </Button>

          {message && (
            <Typography
              sx={{
                mt: 2,
                fontWeight: "bold",
                color: message.startsWith("❌") ? "red" : "green",
                textAlign: "center"
              }}
            >
              {message}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
