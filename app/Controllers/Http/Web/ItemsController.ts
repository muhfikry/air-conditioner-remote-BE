import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import ApiResponse from 'App/Helpers/ApiResponse'
import MqttPublish from 'App/Helpers/MqttPublish'
import { random } from 'App/Helpers/Random'
import Building from 'App/Models/Building'
import Device from 'App/Models/Device'
import Item from 'App/Models/Item'
import Log from 'App/Models/Log'
import Room from 'App/Models/Room'
import StatusSerialize from 'App/serializers/status_serializer'

export default class ItemsController {
  public async index({ view, params }: HttpContextContract) {
    const data = await Item.query()
      .preload('room')
      .preload('device')
      .orderBy('code')
      .where('room_id', params.idRoom)
    const building = await Building.findOrFail(params.idBuilding)
    const room = await Room.findOrFail(params.idRoom)
    const device = await Device.all()
    return await view.render('pages/remote/item', { data, building, room, device })
  }

  public async status({ params, response }: HttpContextContract) {
    const data = await Item.query().orderBy('code').where('room_id', params.idRoom)
    return ApiResponse.ok(
      response,
      await StatusSerialize.collection(data),
      'Item status retrieved successfully'
    )
  }

  public async turnoff({ session, response, params }: HttpContextContract) {
    const items = await Item.query()
      .where('is_active', true)
      .where('room_id', params.idRoom)
      .whereHas('room', (roomQuery) => {
        roomQuery.where('building_id', params.idBuilding)
      })

    // Latar belakang update dan publish
    setImmediate(async () => {
      for (const item of items) {
        try {
          await MqttPublish.send(response, item.id, 'off')

          item.isActive = false
          await item.save()
          const log = new Log()
          log.itemId = item.id
          log.isActive = false
          await log.save()
        } catch (err) {
          console.error(`Gagal proses item ${item.id}:`, err)
        }
      }
    })

    session.flash('success', 'Turned off all devices in this room successfully')
    return response.redirect().back()
  }

  public async item({ params, response }: HttpContextContract) {
    const data = await Item.query()
      .preload('room')
      .preload('device')
      .where('room_id', params.idRoom)
      .where('id', params.idItem)
      .firstOrFail()
    return ApiResponse.ok(response, data, 'Item retrieved successfully')
  }

  public async itemLog({ params, response, request }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 15)
    const data = await Log.query()
      .where('item_id', params.idItem)
      .orderBy('created_at')
      .paginate(page, limit)
    return ApiResponse.ok(response, data, 'Item log retrieved successfully')
  }

  public async itemSwing({ response, params }: HttpContextContract) {
    try {
      return await MqttPublish.send(response, params.idItem, 'swing')
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async itemUp({ response, params }: HttpContextContract) {
    try {
      const responses = await MqttPublish.send(response, params.idItem, 'up')
      const data = await Item.findOrFail(params.idItem)
      if (data.temperature <= 29) {
        data.temperature += 1
        await data.save()
      }
      return responses
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async itemDown({ response, params }: HttpContextContract) {
    try {
      const responses = await MqttPublish.send(response, params.idItem, 'down')
      const data = await Item.findOrFail(params.idItem)
      if (data.temperature >= 17) {
        data.temperature -= 1
        await data.save()
      }
      return responses
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async itemTimeReset({ response, params }: HttpContextContract) {
    try {
      const data = await Item.findOrFail(params.idItem)
      data.schedule = null
      await data.save()
      return ApiResponse.ok(response, null, 'Time Schedule Has been reset successfully')
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async itemTimeSet({ response, params, request }: HttpContextContract) {
    try {
      const data = await Item.findOrFail(params.idItem)
      const payload = await request.validate({
        schema: schema.create({
          time: schema.string(),
        }),
        messages: {
          'time.required': 'The time is required.',
        },
      })
      data.schedule = payload.time
      await data.save()
      return ApiResponse.ok(response, null, 'Time Schedule Has been set successfully')
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async itemOn({ response, params }: HttpContextContract) {
    try {
      const responses = await MqttPublish.send(response, params.idItem, 'on')
      const data = await Item.findOrFail(params.idItem)
      data.isActive = true
      data.temperature = 16
      await data.save()

      const log = new Log()
      log.itemId = params.idItem
      log.isActive = true
      await log.save()

      return responses
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async itemOff({ response, params }: HttpContextContract) {
    try {
      const responses = await MqttPublish.send(response, params.idItem, 'off')
      const data = await Item.findOrFail(params.idItem)
      data.isActive = false
      await data.save()

      const log = new Log()
      log.itemId = params.idItem
      log.isActive = false
      await log.save()

      return responses
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async itemShare({ response, params, request }: HttpContextContract) {
    try {
      const data = await Item.findOrFail(params.idItem)
      const payload = await request.validate({
        schema: schema.create({
          switch: schema.boolean(),
        }),
        messages: {
          'switch.required': 'The switch is required.',
        },
      })
      data.isPublish = payload.switch
      await data.save()
      return ApiResponse.ok(response, null, 'Publish Status Has been updated successfully')
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async itemKeyReset({ response, params }: HttpContextContract) {
    try {
      const data = await Item.findOrFail(params.idItem)
      data.key = random(6)
      await data.save()
      return ApiResponse.ok(response, null, 'Publish Key Has been updated successfully')
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async store({ request, session, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        device: schema.string(),
        roomId: schema.string(),
        code: schema.string([rules.unique({ table: 'items', column: 'code' })]),
        description: schema.string.nullable(),
      }),
      messages: {
        'code.unique': 'The code has already been taken.',
        'code.required': 'The code field is required.',
        'device.required': 'The Merk field is required.',
      },
    })
    const item = new Item()
    item.deviceId = payload.device
    item.roomId = payload.roomId
    item.code = payload.code
    item.description = payload.description
    await item.save()

    session.flash('success', 'Item has been created successfully')
    return response.redirect().back()
  }

  public async update({ request, session, response, params }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        device: schema.string(),
        code: schema.string([
          rules.unique({
            table: 'items',
            column: 'code',
            whereNot: {
              id: params.id,
            },
          }),
        ]),
        description: schema.string.nullable(),
      }),
      messages: {
        'code.required': 'The code field is required.',
        'device.required': 'The device field is required.',
      },
    })
    const item = await Item.findOrFail(params.id)
    item.deviceId = payload.device
    item.code = payload.code
    item.description = payload.description
    await item.save()

    session.flash('success', 'Item has been updated successfully')
    return response.redirect().back()
  }

  public async destroy({ params, response, session }: HttpContextContract) {
    const data = await Item.findOrFail(params.id)
    await data.delete()
    session.flash('success', 'Item has been deleted successfully')
    return response.redirect().back()
  }
}
