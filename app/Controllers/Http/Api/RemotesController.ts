import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ApiResponse from 'App/Helpers/ApiResponse'
import Building from 'App/Models/Building'
import Item from 'App/Models/Item'
import Room from 'App/Models/Room'

export default class RemotesController {
  public async building({ request, response, auth }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const q = request.input('q', '')
    const data = await Building.query()
      .where((query) => {
        query.where('name', 'LIKE', `%${q}%`).orWhere('description', 'LIKE', `%${q}%`)
      })
      .whereHas('permission', (permissionQuery) => {
        permissionQuery.where('user_id', user.id)
      })
      .orderBy('name')
      .paginate(page, limit)
    return ApiResponse.ok(response, data, 'Buildings retrieved successfully')
  }

  public async room({ request, response, auth, params }: HttpContextContract) {
    await auth.use('api').authenticate()
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const q = request.input('q', '')
    const data = await Room.query()
      .where((query) => {
        query.where('name', 'LIKE', `%${q}%`).orWhere('description', 'LIKE', `%${q}%`)
      })
      .where('building_id', params.idBuilding)
      .orderBy('name')
      .paginate(page, limit)
    return ApiResponse.ok(response, data, 'Rooms retrieved successfully')
  }

  public async item({ request, response, auth, params }: HttpContextContract) {
    await auth.use('api').authenticate()
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const q = request.input('q', '')
    const data = await Item.query()
      .where((query) => {
        query.where('code', 'LIKE', `%${q}%`).orWhere('description', 'LIKE', `%${q}%`)
      })
      .preload('device')
      .where('room_id', params.idRoom)
      .orderBy('code')
      .paginate(page, limit)
    return ApiResponse.ok(response, data, 'Items retrieved successfully')
  }
}
