import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env if it exists
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'hirelocal-development-secret-key-32chars',
  defaultDemoOtp: process.env.DEFAULT_DEMO_OTP || '123456',
  matchingWeights: {
    rating: parseFloat(process.env.WEIGHT_RATING || '0.30'),
    reliability: parseFloat(process.env.WEIGHT_RELIABILITY || '0.25'),
    experience: parseFloat(process.env.WEIGHT_EXPERIENCE || '0.15'),
    availability: parseFloat(process.env.WEIGHT_AVAILABILITY || '0.15'),
    locationProximity: parseFloat(process.env.WEIGHT_LOCATION_PROXIMITY || '0.15')
  }
};
