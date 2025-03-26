import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import ApiResponse from 'App/Helpers/ApiResponse'
import Building from 'App/Models/Building'
import StatSerialize from 'App/serializers/stat_serializer'

export default class BuildingsController {
  public async index({ view, auth }: HttpContextContract) {
    const user = await auth.use('web').authenticate()
    const data =
      user.role === 'superadmin'
        ? await Building.query().orderBy('name')
        : await Building.query()
            .whereHas('permission', (permissionQuery) => {
              permissionQuery.where('user_id', user.id)
            })
            .orderBy('name')
    return await view.render('pages/remote/building', { data })
  }

  public async statistic({ response, auth }: HttpContextContract) {
    const user = await auth.use('web').authenticate()
    const buildings =
      user.role === 'superadmin'
        ? await Building.query().preload('room', (roomQuery) => {
            roomQuery.preload('item')
          })
        : await Building.query()
            .preload('room', (roomQuery) => {
              roomQuery.preload('item')
            })
            .whereHas('permission', (permissionQuery) => {
              permissionQuery.where('user_id', user.id)
            })
    const data = buildings.map((building) => {
      let totalItem = 0
      let activeCount = 0
      building.room.forEach((r) => {
        totalItem += r.item.length
        activeCount += r.item.filter((i) => i.isActive).length
      })
      const inactiveCount = totalItem - activeCount
      return {
        ...building.serialize(),
        totalItem,
        activeCount,
        inactiveCount,
      }
    })

    return ApiResponse.ok(
      response,
      await StatSerialize.collection(data),
      'Building Stat retrieved successfully'
    )
  }

  public async store({ request, session, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        name: schema.string(),
        description: schema.string.nullable(),
      }),
      messages: {
        'name.required': 'The name field is required.',
      },
    })
    const building = new Building()
    building.name = payload.name
    building.description = payload.description
    await building.save()

    session.flash('success', 'Building has been created successfully')
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
    const building = await Building.findOrFail(params.id)
    building.name = payload.name
    building.description = payload.description
    await building.save()

    session.flash('success', 'Building has been updated successfully')
    return response.redirect().back()
  }

  public async destroy({ params, response, session }: HttpContextContract) {
    const data = await Building.findOrFail(params.id)
    await data.delete()
    session.flash('success', 'Building has been deleted successfully')
    return response.redirect().back()
  }
}
