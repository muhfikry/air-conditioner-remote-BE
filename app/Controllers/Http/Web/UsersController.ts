import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Building from 'App/Models/Building'
import Permission from 'App/Models/Permission'
import User from 'App/Models/User'

export default class UsersController {
  public async index({ view, request }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const q = request.input('q', '')
    const data = await User.query()
      .where((query) => {
        query.where('name', 'LIKE', `%${q}%`).orWhere('email', 'LIKE', `%${q}%`)
      })
      .preload('permission', (query) => {
        query.preload('building')
      })
      .paginate(page, limit)
    const building = await Building.all()
    return await view.render('pages/user/index', { data, building, q })
  }

  public async store({ request, session, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        name: schema.string({}, [rules.required()]),
        role: schema.string({}, [rules.required()]),
        email: schema.string({}, [rules.required(), rules.email()]),
        password: schema.string({}, [rules.required()]),
      }),
      messages: {
        'name.required': 'The name field is required.',
        'role.required': 'The role field is required.',
        'email.required': 'The email field is required.',
        'email.email': 'Please provide a valid email address.',
        'password.required': 'The password field is required.',
      },
    })

    const user = new User()
    user.name = payload.name
    user.role = payload.role
    user.email = payload.email
    user.password = payload.password
    await user.save()

    if (payload.role === 'admin') {
      if (request.input('building')) {
        for (let building of request.input('building')) {
          const permission = new Permission()
          permission.userId = user.id
          permission.buildingId = building
          await permission.save()
        }
      }
    }

    session.flash('success', 'User has been created successfully')
    return response.redirect().toRoute('user')
  }

  public async update({ request, session, response, params }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        name: schema.string({}, [rules.required()]),
        role: schema.string({}, [rules.required()]),
        email: schema.string({}, [rules.required(), rules.email()]),
        password: schema.string.nullable(),
      }),
      messages: {
        'name.required': 'The name field is required.',
        'role.required': 'The role field is required.',
        'email.required': 'The email field is required.',
        'email.email': 'Please provide a valid email address.',
      },
    })

    const user = await User.findOrFail(params.id)
    user.name = payload.name
    user.role = payload.role
    user.email = payload.email
    if (payload.password) {
      user.password = payload.password
    }
    await user.save()

    const userPermission = await Permission.findBy('user_id', params.id)
    if (userPermission) {
      await userPermission.delete()
    }
    if (payload.role === 'admin') {
      if (request.input('building')) {
        for (let building of request.input('building')) {
          const permission = new Permission()
          permission.userId = user.id
          permission.buildingId = building
          await permission.save()
        }
      }
    }

    session.flash('success', 'User has been updated successfully')
    return response.redirect().toRoute('user')
  }

  public async destroy({ params, response, session }: HttpContextContract) {
    const data = await User.findOrFail(params.id)
    await data.delete()
    session.flash('success', 'User has been deleted successfully')
    return response.redirect().toRoute('user')
  }
}
