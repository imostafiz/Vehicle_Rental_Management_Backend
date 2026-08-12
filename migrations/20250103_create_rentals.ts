import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('rentals');
  if (exists) return;

  await knex.schema.createTable('rentals', (table) => {
    table.increments('id').primary();
    table
      .integer('vehicle_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('vehicles')
      .onDelete('CASCADE');
    table.string('customer_name', 255).notNullable();
    table.string('customer_phone', 50).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.decimal('total_amount', 12, 2).notNullable();
    table
      .enu('status', ['booked', 'ongoing', 'completed', 'cancelled'], {
        useNative: true,
        enumName: 'rental_status',
      })
      .notNullable()
      .defaultTo('booked');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();

    table.index(['vehicle_id', 'status'], 'idx_rentals_vehicle_status');
    table.index(['start_date', 'end_date'], 'idx_rentals_dates');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('rentals');
  await knex.schema.raw('DROP TYPE IF EXISTS rental_status');
}
