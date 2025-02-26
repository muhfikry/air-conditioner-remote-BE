import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Device from 'App/Models/Device'

export default class extends BaseSeeder {
  public async run() {
    const devices = [
      {
        merk: 'Panasonic',
      },
      {
        merk: 'LG',
      },
      {
        merk: 'Samsung',
      },
    ]

    await Device.createMany(devices)
  }
}
