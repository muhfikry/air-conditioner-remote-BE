import Route from '@ioc:Adonis/Core/Route'

export default () => {
  Route.get('/', ({ response }) => {
    return response.redirect().toRoute('login')
  })

  Route.group(() => {
    Route.get('/login', 'Web/AuthController.login').as('login')
    Route.post('/login', 'Web/AuthController.loginSubmit').as('login.submit')
    Route.get('/forget', 'Web/AuthController.forget').as('forget')
    Route.post('/forget', 'Web/AuthController.forgetSubmit').as('forget.submit')
    Route.get('/reset/:token/:email', 'Web/AuthController.reset').as('reset')
    Route.post('/reset/:token/:email', 'Web/AuthController.resetSubmit').as('reset.submit')
  })
    .prefix('/auth')
    .middleware('guest')
  Route.get('/auth/logout', 'Web/AuthController.logout').as('logout').middleware('auth')

  Route.get('/dashboard', 'Web/DashboardController.index').as('dashboard').middleware('auth')

  Route.group(() => {
    // Route.get('/building', 'Web/MasterDataController.building').as('master-data.building')
    // Route.post('/building', 'Web/MasterDataController.buildingStore').as(
    //   'master-data.building.store'
    // )
    // Route.post('/building/:id/update', 'Web/MasterDataController.buildingUpdate').as(
    //   'master-data.building.update'
    // )
    // Route.get('/building/:id/delete', 'Web/MasterDataController.buildingDestroy').as(
    //   'master-data.building.destroy'
    // )
    // Route.get('/room', 'Web/MasterDataController.room').as('master-data.room')
    // Route.post('/room', 'Web/MasterDataController.roomStore').as('master-data.room.store')
    // Route.post('/room/:id/update', 'Web/MasterDataController.roomUpdate').as(
    //   'master-data.room.update'
    // )
    // Route.get('/room/:id/delete', 'Web/MasterDataController.roomDestroy').as(
    //   'master-data.room.destroy'
    // )
    Route.get('/item', 'Web/MasterDataController.item').as('master-data.item')
    Route.post('/item', 'Web/MasterDataController.itemStore').as('master-data.item.store')
    Route.post('/item/:id/update', 'Web/MasterDataController.itemUpdate').as(
      'master-data.item.update'
    )
    Route.get('/item/:id/delete', 'Web/MasterDataController.itemDestroy').as(
      'master-data.item.destroy'
    )
  })
    .prefix('/master-data')
    .middleware(['auth', 'role:superadmin'])

  Route.group(() => {
    Route.get('/', 'Web/BuildingsController.index').as('remote.building')
    Route.get('/stat', 'Web/BuildingsController.statistic').as('remote.building.stat')
    Route.group(() => {
      Route.post('/', 'Web/BuildingsController.store').as('remote.building.store')
      Route.post('/:id/update', 'Web/BuildingsController.update').as('remote.building.update')
      Route.get('/:id/delete', 'Web/BuildingsController.destroy').as('remote.building.destroy')
    })
      .prefix('/building')
      .middleware('role:superadmin')

    Route.get('/:idBuilding', 'Web/RoomsController.index')
      .as('remote.room')
      .middleware('permissionCheck:web')
    Route.get('/:idBuilding/stat', 'Web/RoomsController.statistic')
      .as('remote.room.stat')
      .middleware('permissionCheck:api')
    Route.group(() => {
      Route.post('', 'Web/RoomsController.store').as('remote.room.store')
      Route.post('/:id/update', 'Web/RoomsController.update').as('remote.room.update')
      Route.get('/:id/delete', 'Web/RoomsController.destroy').as('remote.room.destroy')
    })
      .prefix('/room')
      .middleware('role:superadmin')

    Route.get('/:idBuilding/:idRoom', 'Web/ItemsController.index').as('remote.item.index')
    Route.group(() => {
      Route.post('/', 'Web/itemsController.store').as('remote.item.store')
      Route.post('/:id/update', 'Web/itemsController.update').as('remote.item.update')
      Route.get('/:id/delete', 'Web/itemsController.destroy').as('remote.item.destroy')
    })
      .prefix('/item')
      .middleware('role:superadmin')

    Route.get('/:idBuilding/:idRoom/:idItem', 'Web/ItemsController.item')
      .as('remote.item')
      .middleware('permissionCheck:api')
    Route.get('/:idBuilding/:idRoom/:idItem/log', 'Web/ItemsController.itemLog')
      .as('remote.item.log')
      .middleware('permissionCheck:api')
    Route.post('/:idBuilding/:idRoom/:idItem/on', 'Web/ItemsController.itemOn')
      .as('remote.item.on')
      .middleware('permissionCheck:api')
    Route.post('/:idBuilding/:idRoom/:idItem/off', 'Web/ItemsController.itemOff')
      .as('remote.item.off')
      .middleware('permissionCheck:api')
    Route.post('/:idBuilding/:idRoom/:idItem/swing', 'Web/ItemsController.itemSwing')
      .as('remote.item.swing')
      .middleware('permissionCheck:api')
    Route.post('/:idBuilding/:idRoom/:idItem/up', 'Web/ItemsController.itemUp')
      .as('remote.item.up')
      .middleware('permissionCheck:api')
    Route.post('/:idBuilding/:idRoom/:idItem/down', 'Web/ItemsController.itemDown')
      .as('remote.item.down')
      .middleware('permissionCheck:api')
    Route.post('/:idBuilding/:idRoom/:idItem/time-reset', 'Web/ItemsController.itemTimeReset')
      .as('remote.item.time-reset')
      .middleware('permissionCheck:api')
    Route.post('/:idBuilding/:idRoom/:idItem/time-set', 'Web/ItemsController.itemTimeSet')
      .as('remote.item.time-set')
      .middleware('permissionCheck:api')
    Route.post('/:idBuilding/:idRoom/:idItem/share', 'Web/ItemsController.itemShare')
      .as('remote.item.share')
      .middleware('permissionCheck:api')
    Route.post('/:idBuilding/:idRoom/:idItem/key-reset', 'Web/ItemsController.itemKeyReset')
      .as('remote.item.key-reset')
      .middleware('permissionCheck:api')
  })
    .prefix('/remote')
    .middleware('auth')

  Route.group(() => {
    Route.get('/', 'Web/UsersController.index').as('user')
    Route.post('/', 'Web/UsersController.store').as('user.store')
    Route.post('/:id/update', 'Web/UsersController.update').as('user.update')
    Route.get('/:id/delete', 'Web/UsersController.destroy').as('user.destroy')
  })
    .prefix('/user')
    .middleware(['auth', 'role:superadmin'])

  Route.group(() => {
    Route.post('/change-password', 'Web/ProfilesController.changePassword').as(
      'profile.changePassword'
    )
  })
    .prefix('/profile')
    .middleware('auth')
}
