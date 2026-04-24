#!/usr/bin/env node
// Hämtar väderprognos för Godby (Åland) från FMI:s öppna WFS-API.
// Kör: node godby-weather.js

const PLACE = "Godby";
const STORED_QUERY = "fmi::forecast::harmonie::surface::point::simple";
const PARAMS = "temperature,windspeedms,winddirection,humidity,precipitation1h,weathersymbol3";

const url =
  `https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature` +
  `&storedquery_id=${STORED_QUERY}` +
  `&place=${encodeURIComponent(PLACE)}` +
  `&parameters=${PARAMS}`;

const LABELS = {
  temperature: "Temp (°C)",
  windspeedms: "Vind (m/s)",
  winddirection: "Vindrikt (°)",
  humidity: "Luftfukt (%)",
  precipitation1h: "Nederbörd (mm/h)",
  weathersymbol3: "Symbol",
};

async function main() {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const xml = await res.text();

  const re = /<BsWfs:Time>([^<]+)<\/BsWfs:Time>\s*<BsWfs:ParameterName>([^<]+)<\/BsWfs:ParameterName>\s*<BsWfs:ParameterValue>([^<]+)<\/BsWfs:ParameterValue>/g;

  const byTime = new Map();
  let m;
  while ((m = re.exec(xml)) !== null) {
    const [, time, name, value] = m;
    if (!byTime.has(time)) byTime.set(time, {});
    byTime.get(time)[name] = value;
  }

  if (byTime.size === 0) {
    console.error("Ingen data – kontrollera platsnamn eller parametrar.");
    process.exit(1);
  }

  console.log(`Prognos för ${PLACE} (FMI HARMONIE)\n`);
  for (const [time, vals] of byTime) {
    const parts = Object.entries(vals)
      .map(([k, v]) => `${LABELS[k] ?? k}: ${v}`)
      .join("  ");
    console.log(`${time}  ${parts}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
