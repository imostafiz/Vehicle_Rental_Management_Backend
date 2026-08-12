import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('vehicles');
  if (exists) return;

  await knex.schema.createTable('vehicles', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('plate_number', 50).notNullable().unique();
    table.string('category', 100).notNullable();
    table.decimal('daily_rate', 10, 2).notNullable();
    table.string('photo_path', 500).nullable();
    table.timestamp('deleted_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('vehicles');
}
