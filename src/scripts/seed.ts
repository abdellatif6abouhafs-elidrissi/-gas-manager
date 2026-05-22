import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../lib/db';
import { User, Station } from '../lib/models';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    console.log('🌱 Starting seed script...');
    console.log('Connecting to MongoDB...');

    await mongoose.connect(MONGODB_URI);

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing users and stations...');
    await User.deleteMany({});
    await Station.deleteMany({});

    // Create test station
    console.log('Creating test station...');
    const station = await Station.create({
      name: 'Station Hay Hassani Casablanca',
      address: 'Hay Hassani, Casablanca, Morocco',
      owner: new mongoose.Types.ObjectId(),
    });
    console.log(`✅ Created station: ${station.name}`);

    // Hash password
    const hashedPassword = await bcrypt.hash('test1234', 10);

    // Create directeur user first (will be the station owner)
    console.log('Creating directeur user...');
    const directeur = await User.create({
      email: 'directeur@test.com',
      password: hashedPassword,
      firstName: 'Ahmed',
      lastName: 'Directeur',
      role: 'directeur',
    });
    console.log(`✅ Created directeur: ${directeur.email}`);

    // Update station owner to the directeur
    station.owner = directeur._id;
    await station.save();

    // Create gerant user
    console.log('Creating gerant user...');
    const gerant = await User.create({
      email: 'gerant@test.com',
      password: hashedPassword,
      firstName: 'Mohammed',
      lastName: 'Gerant',
      role: 'gerant',
      station: station._id,
    });
    console.log(`✅ Created gerant: ${gerant.email}`);

    console.log('\n✨ Seed completed successfully!');
    console.log('\nTest credentials:');
    console.log('─────────────────────────────');
    console.log('Directeur:');
    console.log(`  Email: directeur@test.com`);
    console.log(`  Password: test1234`);
    console.log('\nGerant:');
    console.log(`  Email: gerant@test.com`);
    console.log(`  Password: test1234`);
    console.log(`  Station: ${station.name}`);
    console.log('─────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
