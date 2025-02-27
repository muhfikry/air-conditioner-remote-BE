import { DateTime } from 'luxon'
import uuid from 'uuid-wand'
import {
  BaseModel,
  beforeCreate,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Building from './Building'
import Item from './Item'

export default class Room extends BaseModel {
  @beforeCreate()
  public static async createUUID(model: Room) {
    model.id = uuid.v4()
  }

  @column({ isPrimary: true })
  public id: string

  @column()
  public buildingId: string | undefined | null

  @belongsTo(() => Building)
  public building: BelongsTo<typeof Building>

  @column()
  public name: string

  @column()
  public description: string | undefined | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Item)
  public item: HasMany<typeof Item>
}
