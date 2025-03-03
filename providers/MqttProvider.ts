import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import mqtt from 'mqtt'
import Env from '@ioc:Adonis/Core/Env'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'

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
        clientId: Env.get('MQTT_CLIENT_ID') + `client_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        keepalive: 60,
        reconnectPeriod: 5000,
      })

      client.on('connect', () => {
        console.log(`[${new Date().toISOString()}] MQTT client connected`)
      })

      client.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] MQTT client error:`, error)
        Logger.error('MQTT client error: %j', error)
      })

      client.on('offline', () => {
        console.warn(`[${new Date().toISOString()}] MQTT client offline, reconnecting...`)
      })

      client.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] MQTT client disconnected`)
      })

      return client
    })
  }

  public async boot() {
    const MqttClient = this.app.container.use('Mqtt')
    const Redis = this.app.container.use('Adonis/Addons/Redis')
    const Database = this.app.container.use('Adonis/Lucid/Database') as DatabaseContract

    const items = await Database.from('items').select('code')
    if (items.length) {
      const statusTopics = items.map((item) => `${item.code}/status`)
      statusTopics.forEach((topic) => {
        MqttClient.subscribe(topic, { qos: 1 }, (err) => {
          if (!err) {
            console.log(`Subscribed to topic ${topic}`)
          } else {
            Logger.error('Failed to subscribe to topic %s: %j', topic, err)
          }
        })
      })
    }

    MqttClient.on('message', async (topic, message) => {
      if (topic.endsWith('/status')) {
        const code = topic.split('/')[0]
        const isActive = message.toString().toLowerCase() === 'true'

        try {
          const cachedStatus = await Redis.get(`status:${code}`)

          if (cachedStatus !== null && JSON.parse(cachedStatus) === isActive) {
            console.log(`No change for ${code}, skipping update`)
            return
          }

          await Database.from('items').where('code', code).update({ is_active: isActive })
          await Redis.set(`status:${code}`, JSON.stringify(isActive), 'EX', 60)
          console.log(`Updated ${code} to ${isActive}`)
        } catch (error) {
          Logger.error('Failed to update status for code %s: %j', code, error)
        }
      }
    })
  }

  public async ready() {}

  public async shutdown() {
    if (this.app.container.hasBinding('Mqtt')) {
      const MqttClient = this.app.container.use('Mqtt')
      MqttClient.end(() => {
        console.log('MQTT client disconnected gracefully')
      })
    }
  }
}
