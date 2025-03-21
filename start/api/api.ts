import Route from '@ioc:Adonis/Core/Route'

export default () => {
  Route.group(() => {
    Route.post('/login', 'Api/AuthController.login')
    Route.post('/forgot-password', 'Api/AuthController.forgot')
  })
    .prefix('/auth')
    .middleware('guest')
  Route.get('/auth/logout', 'Api/AuthController.logout').middleware('auth')

  Route.group(() => {
    Route.get('/', 'APi/RemotesController.building')
    Route.get('/:idBuilding', 'APi/RemotesController.room')
    Route.get('/:idBuilding/:idRoom', 'APi/RemotesController.item')
  }).prefix('/remote')
  // .middleware('auth')
}
