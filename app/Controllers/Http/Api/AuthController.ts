import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import ApiResponse from 'App/Helpers/ApiResponse'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import Mail from '@ioc:Adonis/Addons/Mail'
import uuid from 'uuid-wand'

export default class AuthController {
  public async login({ auth, request, response }: HttpContextContract) {
    try {
      const loginSchema = schema.create({
        email: schema.string([rules.email()]),
        password: schema.string(),
      })
      const payload = await request.validate({ schema: loginSchema })

      const user = await User.query().where('email', payload.email).first()
      if (!user) {
        return ApiResponse.unauthorized(response, 'Invalid Credentials or Inactive User')
      }
      const email = payload.email
      const password = payload.password
      const token = await auth.use('api').attempt(email, password, {
        expiresIn: '1 days',
      })
      return ApiResponse.ok(response, { user: user, accessToken: token }, 'User Login successfully')
    } catch (error) {
      return ApiResponse.unauthorized(response, 'Invalid Credentials')
    }
  }

  public async forgot({ request, response }: HttpContextContract) {
    const forgotPasswordSchema = schema.create({
      email: schema.string({}, [rules.email()]),
    })

    const payload = await request.validate({ schema: forgotPasswordSchema })

    const user = await User.findBy('email', payload.email)
    if (!user) return ApiResponse.badRequest(response, 'User not found')

    const token = uuid.v4()

    await Database.insertQuery()
      .table('password_reset_tokens')
      .insert({
        email: user.email,
        token: token,
        expires_at: new Date(Date.now() + 3600000),
      })

    await Mail.send((message) => {
      message
        .from('noreply@unimal.link')
        .to(user.email)
        .subject('Reset Password')
        .htmlView('email/password_reset', { user, token })
    })

    return ApiResponse.ok(response, null, 'Password reset email sent successfully')
  }
}
