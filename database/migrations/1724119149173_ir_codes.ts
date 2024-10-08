import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'ir_codes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('device_id')
        .references('id')
        .inTable('devices')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .index()
      table.string('command').notNullable()
      table.string('variable').notNullable()
      table.text('description').notNullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
