import { BaseTask, CronTimeV2 } from 'adonis5-scheduler/build/src/Scheduler/Task'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'
import MqttPublish from 'App/Helpers/MqttPublish'
import Redis from '@ioc:Adonis/Addons/Redis'

export default class JobScheduler extends BaseTask {
  public static get schedule() {
    // Use CronTimeV2 generator:
    return CronTimeV2.everyMinute()
  }
  /**
   * Set enable use .lock file for block run retry task
   * Lock file save to `build/tmp/adonis5-scheduler/locks/your-class-name`
   */
  public static get useLock() {
    return false
  }

  public async handle() {
    const lockKey = 'cronjob:lock:schedule'
    const lockTime = 50

    const isLocked = await Redis.get(lockKey)
    if (isLocked) {
      Logger.info('Skipping job: Another instance is running')
      return
    }

    try {
      await Redis.set(lockKey, 'running', 'EX', lockTime)

      const now = DateTime.now().setZone('Asia/Jakarta').toFormat('HH:mm')

      let scheduledItems: any[] = []
      const cachedItems = await Redis.get(`scheduled_items:${now}`)

      if (cachedItems) {
        scheduledItems = JSON.parse(cachedItems)
      } else {
        scheduledItems = await Database.from('items')
          .select(['id', 'code'])
          .where('schedule', now)
          .andWhere('is_active', true)

        await Redis.set(`scheduled_items:${now}`, JSON.stringify(scheduledItems), 'EX', 60)
      }

      if (!scheduledItems.length) return

      Logger.info(`Processing ${scheduledItems.length} scheduled items at ${now}`)

      const itemCodes = scheduledItems.map((item) => item.code)

      await Promise.all(
        scheduledItems.map(async (item) => {
          try {
            await MqttPublish.publish(item.code, 'off')
          } catch (error) {
            Logger.error(`Failed to send MQTT for ${item.code}: %j`, error)
          }
        })
      )

      await Database.from('items').whereIn('code', itemCodes).update({ is_active: false })

      Logger.info(`Successfully processed ${scheduledItems.length} items.`)
    } catch (error) {
      Logger.error('Error processing scheduled items: %j', error)
    } finally {
      await Redis.del(lockKey)
    }
  }
}
