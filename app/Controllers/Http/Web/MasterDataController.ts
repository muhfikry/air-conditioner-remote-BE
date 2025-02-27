import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Building from 'App/Models/Building'
import Device from 'App/Models/Device'
import Item from 'App/Models/Item'
import Room from 'App/Models/Room'

export default class MasterDataController {
  public async building({ view, request }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const data = await Building.query().paginate(page, limit)
    // return data
    return view.render('pages/master-data/building', { data })
  }

  public async buildingStore({ request, session, response }: HttpContextContract) {
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
    return response.redirect().toRoute('master-data.building')
  }

  public async buildingUpdate({ request, session, response, params }: HttpContextContract) {
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
    return response.redirect().toRoute('master-data.building')
  }

  public async buildingDestroy({ params, response, session }: HttpContextContract) {
    const data = await Building.findOrFail(params.id)
    await data.delete()
    session.flash('success', 'Building has been deleted successfully')
    return response.redirect().toRoute('master-data.building')
  }

  public async room({ view, request }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const data = await Room.query()
      .preload('building')
      .orderBy('building_id')
      .orderBy('name')
      .paginate(page, limit)
    const building = await Building.all()
    return view.render('pages/master-data/room', { data, building })
  }

  public async roomStore({ request, session, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        name: schema.string(),
        building: schema.string(),
        description: schema.string.nullable(),
      }),
      messages: {
        'name.required': 'The name field is required.',
        'building.required': 'The Building field is required.',
      },
    })
    const room = new Room()
    room.buildingId = payload.building
    room.name = payload.name
    room.description = payload.description
    await room.save()

    session.flash('success', 'Room has been created successfully')
    return response.redirect().toRoute('master-data.room')
  }

  public async roomUpdate({ request, session, response, params }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        name: schema.string(),
        building: schema.string(),
        description: schema.string.nullable(),
      }),
      messages: {
        'name.required': 'The name field is required.',
        'building.required': 'The Building field is required.',
      },
    })
    const room = await Room.findOrFail(params.id)
    room.buildingId = payload.building
    room.name = payload.name
    room.description = payload.description
    await room.save()

    session.flash('success', 'Room has been updated successfully')
    return response.redirect().toRoute('master-data.room')
  }

  public async roomDestroy({ params, response, session }: HttpContextContract) {
    const data = await Room.findOrFail(params.id)
    await data.delete()
    session.flash('success', 'Room has been deleted successfully')
    return response.redirect().toRoute('master-data.room')
  }

  public async item({ view, request }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const data = await Item.query()
      .preload('device')
      .preload('room', (query) => {
        query.preload('building', (query) => {
          query.orderBy('id')
        })
      })
      // .orderBy('code')
      .paginate(page, limit)
    const room = await Room.query().preload('building')
    const device = await Device.all()
    return view.render('pages/master-data/item', { data, room, device })
  }

  public async itemStore({ request, session, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        device: schema.string(),
        room: schema.string(),
        code: schema.string(),
        description: schema.string.nullable(),
      }),
      messages: {
        'code.required': 'The code field is required.',
        'device.required': 'The Merk field is required.',
        'room.required': 'The room field is required.',
      },
    })
    const item = new Item()
    item.deviceId = payload.device
    item.roomId = payload.room
    item.code = payload.code
    item.description = payload.description
    await item.save()

    session.flash('success', 'Item has been created successfully')
    return response.redirect().toRoute('master-data.item')
  }

  public async itemUpdate({ request, session, response, params }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        device: schema.string(),
        room: schema.string(),
        code: schema.string(),
        description: schema.string.nullable(),
      }),
      messages: {
        'code.required': 'The code field is required.',
        'device.required': 'The device field is required.',
        'room.required': 'The room field is required.',
      },
    })
    const item = await Item.findOrFail(params.id)
    item.deviceId = payload.device
    item.roomId = payload.room
    item.code = payload.code
    item.description = payload.description
    await item.save()

    session.flash('success', 'Item has been updated successfully')
    return response.redirect().toRoute('master-data.item')
  }

  public async itemDestroy({ params, response, session }: HttpContextContract) {
    const data = await Item.findOrFail(params.id)
    await data.delete()
    session.flash('success', 'Item has been deleted successfully')
    return response.redirect().toRoute('master-data.item')
  }
}
