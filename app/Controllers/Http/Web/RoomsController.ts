import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
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
}
