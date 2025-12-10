import fs from "fs";
import path from "path";
import crypto from "crypto";

const dataDir = path.resolve("./data");

// sicherstellen dass Ordner existiert
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

export function createCalendarConfig(config) {
  const id = crypto.randomBytes(8).toString("hex");
  const file = path.join(dataDir, `${id}.json`);
  fs.writeFileSync(file, JSON.stringify(config, null, 2));
  return id;
}

export function loadCalendarConfig(id) {
  const file = path.join(dataDir, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
