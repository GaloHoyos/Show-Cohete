import fs from 'fs';
import path from 'path';

interface Settings {
  showDuration: number; // seconds
  cronInterval: number; // minutes
  startHour: string; // HH:MM
}

const SETTINGS_FILE = path.resolve(__dirname, '../settings.json');

// Load or initialize settings
function loadSettings(): Settings {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // Asegura compatibilidad con versiones anteriores
    if (!parsed.startHour) {
      parsed.startHour = '00:00';
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(parsed, null, 2));
    }

    return parsed;
  } catch {
    const defaults: Settings = {
      showDuration: 15,
      cronInterval: 30,
      startHour: '00:00',
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }
}

function saveSettings(settings: Settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

let settings = loadSettings();
export { settings, saveSettings };
