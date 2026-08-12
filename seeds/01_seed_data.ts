import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';

const year = new Date().getFullYear();

export async function seed(knex: Knex): Promise<void> {
  await knex('rentals').del();
  await knex('vehicles').del();
  await knex('staff').del();

  //Hass the password for the admin user
  const passwordHash = await bcrypt.hash('admin123', 10);

  const [staffId] = await knex('staff')
    .insert({
      email: 'admin@example.com',
      password_hash: passwordHash,
      name: 'System Admin',
    })
    .returning('id');

  const [sedanId] = await knex('vehicles')
    .insert({
      name: 'Toyota Camry',
      plate_number: 'DHA-1234',
      category: 'Sedan',
      daily_rate: 2500,
      photo_path: null,
    })
    .returning('id');

  const [suvId] = await knex('vehicles')
    .insert({
      name: 'Toyota Land Cruiser',
      plate_number: 'DHA-5678',
      category: 'SUV',
      daily_rate: 6000,
      photo_path: null,
    })
    .returning('id');

  const [vanId] = await knex('vehicles')
    .insert({
      name: 'Toyota Hiace',
      plate_number: 'DHA-9012',
      category: 'Van',
      daily_rate: 4500,
      photo_path: null,
    })
    .returning('id');

  const sedan = sedanId.id;
  const suv = suvId.id;
  const van = vanId.id;

  await knex('rentals').insert([
    {
      vehicle_id: sedan,
      customer_name: 'Rahim Uddin',
      customer_phone: '01700000001',
      start_date: `${year}-07-29`,
      end_date: `${year}-08-03`,
      total_amount: 2500 * 6,
      status: 'completed',
    },
    {
      vehicle_id: suv,
      customer_name: 'Karim Ahmed',
      customer_phone: '01700000002',
      start_date: `${year}-08-05`,
      end_date: `${year}-08-09`,
      total_amount: 6000 * 5,
      status: 'completed',
    },
    {
      vehicle_id: van,
      customer_name: 'Jasmine Akter',
      customer_phone: '01700000003',
      start_date: `${year}-08-10`,
      end_date: `${year}-08-15`,
      total_amount: 4500 * 6,
      status: 'booked',
    },
    {
      vehicle_id: sedan,
      customer_name: 'Nusrat Jahan',
      customer_phone: '01700000004',
      start_date: `${year}-08-12`,
      end_date: `${year}-08-14`,
      total_amount: 2500 * 3,
      status: 'booked',
    },
  ]);
}
