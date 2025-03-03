import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { DateTime } from 'luxon' // Untuk mendapatkan waktu sekarang
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'

export default class JobProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    const Database = this.app.container.use('Adonis/Lucid/Database') as DatabaseContract
    const MqttPublish = this.app.container.use('App/Helpers/MqttPublish')

    setInterval(async () => {
      try {
        const now = DateTime.now().setZone('Asia/Jakarta').toFormat('HH:mm')
        const scheduledItems = await Database.from('items')
          .select(['id', 'code'])
          .where('schedule', now)
          .andWhere('is_active', true)

        if (scheduledItems.length > 0) {
          console.log(`Found ${scheduledItems.length} items scheduled at ${now}`)
          Logger.info(`Found ${scheduledItems.length} items scheduled at ${now}`)

          for (const item of scheduledItems) {
            console.log(`Processing item: ${item.code}`)
            await MqttPublish.publish(item.code, 'off')
            await Database.from('items').where('code', item.code).update({ is_active: false })
          }
        }
      } catch (error) {
        Logger.error('Error checking scheduled items: %j', error)
      }
    }, 60 * 1000)
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
