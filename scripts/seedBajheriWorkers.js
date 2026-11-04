import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_FILE = path.resolve(__dirname, '../database/seed/seedData.json');
const DB_FILE = path.resolve(__dirname, '../database/storage/hirelocal_db.json');

const bajheriWorkers = [
  {
    worker_id: 'wrk_vapi_aryan_140413',
    user_id: 'usr_worker_aryan',
    name: 'Aryan',
    phone: '9905817179',
    profession: 'Electrician',
    services: ['Electrician'],
    skills: ['House Wiring', 'MCB Installation', 'Fan Installation', 'Switchboard Repair'],
    experience: 5,
    language: 'hi',
    location: {
      name: 'Bajheri, Mohali (140413)',
      pincode: '140413',
      lat: 30.7516,
      lng: 76.5912
    },
    pincode: '140413',
    service_radius: 25,
    communication_type: 'non_smartphone',
    rating: 5.0,
    reliability: 100,
    completed_jobs: 48,
    total_accepted_jobs: 48,
    daily_rate: 550,
    status: 'available',
    account_status: 'active',
    verification_status: 'verified',
    verified: true,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    working_hours: '08:00 - 18:00',
    availableStatus: 'Available for tomorrow',
    bio: 'Verified local master electrician in Bajheri (140413). Expert in house wiring, short circuits, MCB replacement, and fan installations.'
  },
  {
    worker_id: 'wrk_plumber_140413',
    user_id: 'usr_worker_plumber_140413',
    name: 'Harpreet Singh',
    phone: '9827066778',
    profession: 'Plumber',
    services: ['Plumber'],
    skills: ['Pipe Leakage Repair', 'Sanitary Fittings', 'Water Tank Installation', 'Tap & Motor Repair'],
    experience: 7,
    language: 'hi',
    location: {
      name: 'Bajheri, Mohali (140413)',
      pincode: '140413',
      lat: 30.7516,
      lng: 76.5912
    },
    pincode: '140413',
    service_radius: 25,
    communication_type: 'non_smartphone',
    rating: 4.9,
    reliability: 98,
    completed_jobs: 74,
    total_accepted_jobs: 76,
    daily_rate: 550,
    status: 'available',
    account_status: 'active',
    verification_status: 'verified',
    verified: true,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    working_hours: '08:00 - 18:00',
    availableStatus: 'Available for tomorrow',
    bio: 'Experienced plumber in Bajheri (140413). Expert in leak repair, CPVC bathroom pipefitting, sanitary and water motor setup.'
  },
  {
    worker_id: 'wrk_mechanic_140413',
    user_id: 'usr_worker_mechanic_140413',
    name: 'Gurvinder Singh',
    phone: '9827055443',
    profession: 'AC Repair & Service',
    services: ['AC Repair & Service', 'Mechanic'],
    skills: ['Split AC Servicing', 'Gas Charging', 'Inverter AC PCB Check', 'Compressor Overhaul'],
    experience: 8,
    language: 'hi',
    location: {
      name: 'Bajheri, Mohali (140413)',
      pincode: '140413',
      lat: 30.7516,
      lng: 76.5912
    },
    pincode: '140413',
    service_radius: 25,
    communication_type: 'non_smartphone',
    rating: 4.8,
    reliability: 96,
    completed_jobs: 112,
    total_accepted_jobs: 118,
    daily_rate: 600,
    status: 'available',
    account_status: 'active',
    verification_status: 'verified',
    verified: true,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    working_hours: '08:00 - 18:00',
    availableStatus: 'Available for tomorrow',
    bio: 'Master technician for AC servicing, deep jet wash, compressor overhaul and fan motor mechanic in Bajheri.'
  },
  {
    worker_id: 'wrk_carpenter_140413',
    user_id: 'usr_worker_carpenter_140413',
    name: 'Suresh Mistry',
    phone: '9827022334',
    profession: 'Carpenter',
    services: ['Carpenter'],
    skills: ['Door Lock & Hinge Fix', 'Furniture Assembly', 'Modular Kitchen Repair', 'Custom Woodwork'],
    experience: 10,
    language: 'hi',
    location: {
      name: 'Bajheri, Mohali (140413)',
      pincode: '140413',
      lat: 30.7516,
      lng: 76.5912
    },
    pincode: '140413',
    service_radius: 25,
    communication_type: 'non_smartphone',
    rating: 4.9,
    reliability: 97,
    completed_jobs: 145,
    total_accepted_jobs: 148,
    daily_rate: 650,
    status: 'available',
    account_status: 'active',
    verification_status: 'verified',
    verified: true,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    working_hours: '08:00 - 18:00',
    availableStatus: 'Available for tomorrow',
    bio: 'Master carpenter in Bajheri. Expert in modular kitchen fittings, door locks, furniture repairs, and wooden paneling.'
  },
  {
    worker_id: 'wrk_painter_140413',
    user_id: 'usr_worker_painter_140413',
    name: 'Raju Verma',
    phone: '9827077889',
    profession: 'Painter',
    services: ['Painter'],
    skills: ['Interior Wall Painting', 'Waterproofing & Putty', 'Exterior Weathercoat', 'Wood Polishing'],
    experience: 6,
    language: 'hi',
    location: {
      name: 'Bajheri, Mohali (140413)',
      pincode: '140413',
      lat: 30.7516,
      lng: 76.5912
    },
    pincode: '140413',
    service_radius: 25,
    communication_type: 'non_smartphone',
    rating: 4.7,
    reliability: 95,
    completed_jobs: 89,
    total_accepted_jobs: 95,
    daily_rate: 500,
    status: 'available',
    account_status: 'active',
    verification_status: 'verified',
    verified: true,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    working_hours: '08:00 - 18:00',
    availableStatus: 'Available for tomorrow',
    bio: 'Experienced painter skilled in smooth wall putty, waterproofing, Asian Paints emulsion, and wood lacquer in Bajheri.'
  },
  {
    worker_id: 'wrk_appliance_140413',
    user_id: 'usr_worker_appliance_140413',
    name: 'Manpreet Singh',
    phone: '9827088990',
    profession: 'Appliance Repair',
    services: ['Appliance Repair'],
    skills: ['Washing Machine Repair', 'Refrigerator Servicing', 'Microwave & Oven Fix', 'RO Water Purifier Check'],
    experience: 6,
    language: 'hi',
    location: {
      name: 'Bajheri, Mohali (140413)',
      pincode: '140413',
      lat: 30.7516,
      lng: 76.5912
    },
    pincode: '140413',
    service_radius: 25,
    communication_type: 'non_smartphone',
    rating: 4.8,
    reliability: 96,
    completed_jobs: 68,
    total_accepted_jobs: 71,
    daily_rate: 550,
    status: 'available',
    account_status: 'active',
    verification_status: 'verified',
    verified: true,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    working_hours: '08:00 - 18:00',
    availableStatus: 'Available for tomorrow',
    bio: 'Home appliance specialist for washing machines, refrigerators, microwaves, and RO filters in Bajheri & Mohali.'
  },
  {
    worker_id: 'wrk_cleaning_140413',
    user_id: 'usr_worker_cleaning_140413',
    name: 'Sunita Devi',
    phone: '9827099112',
    profession: 'Deep Cleaning',
    services: ['Deep Cleaning'],
    skills: ['Full Home Deep Cleaning', 'Kitchen Degreasing', 'Bathroom Tile Descaling', 'Sofa & Carpet Shampooing'],
    experience: 5,
    language: 'hi',
    location: {
      name: 'Bajheri, Mohali (140413)',
      pincode: '140413',
      lat: 30.7516,
      lng: 76.5912
    },
    pincode: '140413',
    service_radius: 20,
    communication_type: 'non_smartphone',
    rating: 4.9,
    reliability: 99,
    completed_jobs: 94,
    total_accepted_jobs: 95,
    daily_rate: 500,
    status: 'available',
    account_status: 'active',
    verification_status: 'verified',
    verified: true,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    working_hours: '08:00 - 18:00',
    availableStatus: 'Available for tomorrow',
    bio: 'Professional deep cleaning services for apartments, kitchen degreasing, bathroom descaling, and sofa sanitization.'
  }
];

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (!data.workers) data.workers = [];
  if (!data.users) data.users = [];

  for (const bw of bajheriWorkers) {
    // 1. Update or add worker
    const idx = data.workers.findIndex(
      (w) => w.worker_id === bw.worker_id || (w.name.toLowerCase() === bw.name.toLowerCase() && w.profession === bw.profession)
    );
    if (idx >= 0) {
      data.workers[idx] = { ...data.workers[idx], ...bw };
    } else {
      data.workers.push(bw);
    }

    // 2. Update or add user
    const uidx = data.users.findIndex((u) => u.user_id === bw.user_id || u.phone === bw.phone);
    const userObj = {
      user_id: bw.user_id,
      name: bw.name,
      phone: bw.phone,
      address: bw.location.name,
      role: 'worker',
      created_at: new Date().toISOString()
    };
    if (uidx >= 0) {
      data.users[uidx] = { ...data.users[uidx], ...userObj };
    } else {
      data.users.push(userObj);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${filePath} successfully with 7 Bajheri 140413 workers.`);
}

updateFile(SEED_FILE);
updateFile(DB_FILE);
