import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import ApiResponse from 'App/Helpers/ApiResponse'
import MqttPublish from 'App/Helpers/MqttPublish'
import Building from 'App/Models/Building'
import Item from 'App/Models/Item'
import Log from 'App/Models/Log'
import Room from 'App/Models/Room'
import { random } from 'App/Helpers/Random'

export default class RemotesController {
  public async index({ view, auth }: HttpContextContract) {
    const user = await auth.use('web').authenticate()
    const data =
      user.role === 'superadmin'
        ? await Building.all()
        : await Building.query().whereHas('permission', (permissionQuery) => {
            permissionQuery.where('user_id', user.id)
          })
    return await view.render('pages/remote/index', { data })
  }

  public async building({ view, params }: HttpContextContract) {
    const data = await Room.query()
      .preload('building')
      .orderBy('name', 'asc')
      .where('building_id', params.idBuilding)
    const building = await Building.findOrFail(params.idBuilding)
    return await view.render('pages/remote/building', { data, building })
  }

  public async room({ view, params }: HttpContextContract) {
    const data = await Item.query()
      .preload('room')
      .preload('device')
      .orderBy('code', 'asc')
      .where('room_id', params.idRoom)
    const building = await Building.findOrFail(params.idBuilding)
    const room = await Room.findOrFail(params.idRoom)
    return await view.render('pages/remote/room', { data, building, room })
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
      return await MqttPublish.publish(response, params.idItem, 'swing')
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }

  public async itemUp({ response, params }: HttpContextContract) {
    try {
      const responses = await MqttPublish.publish(response, params.idItem, 'up')
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
      const responses = await MqttPublish.publish(response, params.idItem, 'down')
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
      const responses = await MqttPublish.publish(response, params.idItem, 'on')
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
      const responses = await MqttPublish.publish(response, params.idItem, 'off')
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
}
