import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import ApiResponse from 'App/Helpers/ApiResponse'
import Building from 'App/Models/Building'
import Room from 'App/Models/Room'
import StatSerialize from 'App/serializers/stat_serializer'

export default class RoomsController {
  public async index({ view, params }: HttpContextContract) {
    const data = await Room.query()
      .preload('building')
      .orderBy('name')
      .where('building_id', params.idBuilding)
    const building = await Building.findOrFail(params.idBuilding)
    return await view.render('pages/remote/room', { data, building })
  }

  public async statistic({ params, response }: HttpContextContract) {
    const rooms = await Room.query().where('building_id', params.idBuilding).preload('item')
    const data = rooms.map((room) => {
      const totalItem = room.item.length
      const activeCount = room.item.filter((i) => i.isActive).length
      const inactiveCount = totalItem - activeCount
      return {
        ...room.serialize(),
        totalItem,
        activeCount,
        inactiveCount,
      }
    })
    return ApiResponse.ok(
      response,
      await StatSerialize.collection(data),
      'Room Stat retrieved successfully'
    )
  }

  public async store({ request, session, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        name: schema.string(),
        buildingId: schema.string(),
        description: schema.string.nullable(),
      }),
      messages: {
        'name.required': 'The name field is required.',
      },
    })
    const room = new Room()
    room.buildingId = payload.buildingId
    room.name = payload.name
    room.description = payload.description
    await room.save()

    session.flash('success', 'Room has been created successfully')
    return response.redirect().back()
  }

  public async update({ request, session, response, params }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        name: schema.string(),
        description: schema.string.nullable(),
      }),
      messages: {
        'name.required': 'The name field is required.',
      },
    })
    const room = await Room.findOrFail(params.id)
    room.name = payload.name
    room.description = payload.description
    await room.save()

    session.flash('success', 'Room has been updated successfully')
    return response.redirect().back()
  }

  public async destroy({ params, response, session }: HttpContextContract) {
    const data = await Room.findOrFail(params.id)
    await data.delete()
    session.flash('success', 'Room has been deleted successfully')
    return response.redirect().back()
  }
}
