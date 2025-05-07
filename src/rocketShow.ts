import { TuyaContext } from '@tuya/tuya-connector-nodejs';
import { TUYA } from './tuyaConfig';

const context = new TuyaContext({
  baseUrl: TUYA.baseUrl,
  accessKey: TUYA.accessId,
  secretKey: TUYA.secretKey,
});

type Command = { code: string; value: any };

let cancelShow = false;

export function stopShow() {
  cancelShow = true;
}

export async function sendCommands(
  deviceId: string,
  commands: Command[],
  timeoutMs = 5000,
  attempts = 5
) {
  for (let i = 0; i < attempts; i++) {
    try {
      const tuyaRequest = context.request({
        path: `/v1.0/iot-03/devices/${deviceId}/commands`,
        method: 'POST',
        body: { commands },
      });

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`⏱️ Timeout al enviar comando a ${deviceId}`)),
          timeoutMs
        )
      );

      const res = await Promise.race([tuyaRequest, timeout]);

      if (!res.success) {
        throw new Error(
          `Command failed on ${deviceId}: ${JSON.stringify(res)}`
        );
      }

      return res;
    } catch (err) {
      if (i === attempts - 1) throw err;
      console.warn(
        `🔁 Reintentando comando para ${deviceId} (intento ${i + 2})`
      );
      await delay(1000);
    }
  }
}

export async function rocketShow(duration: number): Promise<void> {
  console.log(`Starting rocketShow for ${duration}s`);
  cancelShow = false;

  try {
    for (const id of TUYA.deviceIds) {
      if (cancelShow) return;
      await sendCommands(id, [
        { code: 'work_mode', value: 'colour' },
        { code: 'colour_data_v2', value: { h: 0, s: 1000, v: 1000 } },
      ]);
      await delay(200);
    }
    await delay(2000);

    for (const id of TUYA.deviceIds) {
      if (cancelShow) return;
      await sendCommands(id, [
        { code: 'colour_data_v2', value: { h: 30, s: 1000, v: 1000 } },
      ]);
      await delay(200);
    }

    for (let i = 0; i < 4; i++) {
      if (cancelShow) return;
      await delay(250);
      for (const id of TUYA.deviceIds) {
        if (cancelShow) return;
        await sendCommands(id, [{ code: 'switch_led', value: false }]);
      }
      await delay(250);
      for (const id of TUYA.deviceIds) {
        if (cancelShow) return;
        await sendCommands(id, [{ code: 'switch_led', value: true }]);
      }
    }

    const remaining = duration - 4;
    if (remaining > 0) {
      for (let i = 0; i < remaining * 2; i++) {
        if (cancelShow) return;
        const color =
          i % 2 === 0
            ? { h: 0, s: 1000, v: 1000 }
            : { h: 30, s: 1000, v: 1000 };

        for (const id of TUYA.deviceIds) {
          if (cancelShow) return;
          await sendCommands(id, [{ code: 'colour_data_v2', value: color }]);
        }
        await delay(500);
      }
    }

    for (const id of TUYA.deviceIds) {
      await sendCommands(id, [{ code: 'switch_led', value: false }]);
    }

    console.log('🚀 rocketShow completed');
  } catch (err) {
    console.error('❌ rocketShow error:', err);
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export { cancelShow };
