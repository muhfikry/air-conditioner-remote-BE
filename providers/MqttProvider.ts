import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import mqtt from 'mqtt'
import Env from '@ioc:Adonis/Core/Env'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'
import uuid from 'uuid-wand'
import { DateTime } from 'luxon'

export default class MqttProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    if (this.app.container.hasBinding('Mqtt')) {
      return
    }

    this.app.container.singleton('Mqtt', () => {
      const client = mqtt.connect({
        host: Env.get('MQTT_HOST'),
        protocol: Env.get('MQTT_PROTOCOL'),
        username: Env.get('MQTT_USERNAME'),
        password: Env.get('MQTT_PASSWORD'),
        port: Env.get('MQTT_PORT'),
        clientId: `${Env.get('MQTT_CLIENT_ID')}_client_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        keepalive: 60,
        reconnectPeriod: 5000,
      })

      client.on('connect', () => console.log(`[${new Date().toISOString()}] MQTT client connected`))
      client.on('error', (error) => Logger.error('MQTT client error: %j', error))
      client.on('offline', () =>
        console.warn(`[${new Date().toISOString()}] MQTT client offline, reconnecting...`)
      )
      client.on('disconnect', () =>
        console.log(`[${new Date().toISOString()}] MQTT client disconnected`)
      )

      return client
    })
  }

  public async boot() {
    const MqttClient = this.app.container.use('Mqtt')
    const Redis = this.app.container.use('Adonis/Addons/Redis')
    const Database = this.app.container.use('Adonis/Lucid/Database') as DatabaseContract

    const items = await Database.from('items').select('code', 'id')
    if (items.length) {
      const statusTopics = items.map((item) => `${item.code}/status`)
      statusTopics.forEach((topic) => {
        MqttClient.subscribe(topic, { qos: 1 }, (err) => {
          if (!err) console.log(`Subscribed to topic ${topic}`)
          else Logger.error('Failed to subscribe to topic %s: %j', topic, err)
        })
      })
    }

    MqttClient.on('message', async (topic, message) => {
      if (!topic.endsWith('/status')) return

      const code = topic.split('/')[0]
      const isActive = message.toString().toLowerCase() === 'true'

      try {
        const cacheKey = `status:${code}`
        const cachedStatus = await Redis.get(cacheKey)

        if (cachedStatus !== null && cachedStatus === String(isActive)) {
          console.log(`No change for ${code}, skipping update`)
          return
        }

        const item = items.find((i) => i.code === code)
        if (!item) return Logger.error(`Item not found for code: ${code}`)

        await Promise.all([
          Database.from('items').where('code', code).update({ is_active: isActive }),
          Redis.set(cacheKey, String(isActive), 'EX', 60),
          Database.table('logs').insert({
            id: uuid.v4(),
            item_id: item.id,
            is_active: isActive,
            created_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
            updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
          }),
        ])

        console.log(`Updated ${code} to ${isActive}`)
      } catch (error) {
        Logger.error('Failed to update status for code %s: %j', code, error)
      }
    })
  }

  public async ready() {}

  public async shutdown() {
    if (this.app.container.hasBinding('Mqtt')) {
      const MqttClient = this.app.container.use('Mqtt')
      MqttClient.end(() => console.log('MQTT client disconnected gracefully'))
    }
  }
}
