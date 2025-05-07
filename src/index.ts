import express from 'express';
import path from 'path';
import cron from 'node-cron';
import bodyParser from 'body-parser';
import { rocketShow, sendCommands, stopShow } from './rocketShow';
import { settings, saveSettings } from './settings';
import { TUYA } from './tuyaConfig';

type CronTask = cron.ScheduledTask | null;
let task: CronTask = null;

function scheduleJob() {
  if (task) {
    task.stop();
  }

  const expr = `*/${settings.cronInterval} * * * *`;
  task = cron.schedule(expr, () => {
    const now = new Date();
    const [startHour, startMinute] = settings.startHour
      ?.split(':')
      .map(Number) || [0, 0];

    // Solo correr si la hora actual es igual o posterior a la hora de inicio
    if (
      now.getHours() > startHour ||
      (now.getHours() === startHour && now.getMinutes() >= startMinute)
    ) {
      console.log(
        `Running show at ${now.toLocaleTimeString()} for ${
          settings.showDuration
        }s`
      );
      rocketShow(settings.showDuration);
    } else {
      console.log(
        `⏱️ Saltando show (aún no alcanzó la hora de comienzo ${settings.startHour})`
      );
    }
  });

  console.log(
    `Scheduled rocketShow every ${
      settings.cronInterval
    } minute(s), starting from ${settings.startHour || '00:00'}`
  );
}

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const { showDuration, cronInterval, startHour } = req.body;
  settings.showDuration = parseInt(showDuration, 10);
  settings.cronInterval = parseInt(cronInterval, 10);
  settings.startHour = startHour || '00:00'; // Default por si no se envía
  saveSettings(settings);
  scheduleJob();
  res.redirect('/');
});
app.post('/api/start-now', (req, res) => {
  console.log(
    `🟢 Show manual iniciado a las ${new Date().toLocaleTimeString()}`
  );
  rocketShow(settings.showDuration);
  res.sendStatus(200);
});
app.post('/api/stop-now', async (req, res) => {
  try {
    stopShow(); // 🔴 cancela el flujo en curso
    for (const id of TUYA.deviceIds) {
      await sendCommands(id, [{ code: 'switch_led', value: false }]);
    }
    console.log('🛑 Show terminado manualmente');
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error al apagar luces manualmente:', err);
    res.status(500).send('Error al detener el show');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  scheduleJob();
});
