import dotenv from 'dotenv';
dotenv.config();

export const TUYA = {
  accessId: process.env.TUYA_ACCESS_ID!,
  secretKey: process.env.TUYA_SECRET_KEY!,
  baseUrl: process.env.TUYA_BASE_URL!,
  deviceIds: process.env.DEVICE_IDS!.split(','),
};
