import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Permission from 'App/Models/Permission'

export default class PermissionCheck {
  public async handle(
    { auth, session, response, params }: HttpContextContract,
    next: () => Promise<void>
  ) {
    // Pastikan user terautentikasi
    const user = await auth.use('web').authenticate()

    // Jika user adalah admin, baru kita cek perizinannya
    if (user.role === 'admin') {
      const permissionsCheck = await Permission.query()
        .where('user_id', user.id)
        .where('building_id', params.idBuilding)
        .first()

      if (!permissionsCheck) {
        session.flash('error', 'You do not have permission to perform this action.')
        return response.redirect().toRoute('remote')
      }
    }

    await next()
  }
}
