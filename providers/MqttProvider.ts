import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import mqtt from 'mqtt'
import Env from '@ioc:Adonis/Core/Env'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'
import Redis from '@ioc:Adonis/Addons/Redis'
/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
|
| Your application is not ready when this file is loaded by the framework.
| Hence, the top level imports relying on the IoC container will not work.
| You must import them inside the life-cycle methods defined inside
| the provider class.
|
| @example:
|
| public async ready () {
|   const Database = this.app.container.resolveBinding('Adonis/Lucid/Database')
|   const Event = this.app.container.resolveBinding('Adonis/Core/Event')
|   Event.on('db:query', Database.prettyPrint)
| }
|
*/
export default class MqttProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Mqtt', () => {
      const client = mqtt.connect({
        host: Env.get('MQTT_HOST'),
        protocol: Env.get('MQTT_PROTOCOL'),
        username: Env.get('MQTT_USERNAME'),
        password: Env.get('MQTT_PASSWORD'),
        port: Env.get('MQTT_port'),
        clientId: Env.get('MQTT_CLIENT_ID'),
      })

      client.on('connect', () => {
        console.log('MQTT client connected')
      })

      client.on('error', (error) => {
        console.error('MQTT client error:', error)
        Logger.error('MQTT client error: %j', error)
      })

      return client
    })
  }

  public async boot() {
    const MqttClient = this.app.container.use('Mqtt')
    const Redis = this.app.container.use('Adonis/Addons/Redis')
    const Database = this.app.container.use('Adonis/Lucid/Database') as DatabaseContract

    const items = await Database.from('items').select('code')
    if (items) {
      const status = items.map((item) => item.code + '/status')
      status.forEach((topic) => {
        MqttClient.subscribe(topic, (err) => {
          if (!err) {
            console.log(`Subscribed to topic ${topic}`)
          } else {
            Logger.error('Failed to subscribe to topic %s: %j', topic, err) // Log error to file
          }
        })
      })
    }

    // Print received messages to the terminal and update the database
    MqttClient.on('message', async (topic, message) => {
      if (topic.endsWith('/status')) {
        const code = topic.split('/')[0]
        const isActive = message.toString() === 'true'

        try {
          const cachedStatus = await Redis.get(`status:${code}`)

          if (cachedStatus !== null && JSON.parse(cachedStatus) === isActive) {
            console.log(`No change for ${code}, skipping update`)
            return
          }
          await Database.from('items').where('code', code).update({ is_active: isActive })
          await Redis.set(`status:${code}`, JSON.stringify(isActive))
          console.log(`Updated ${code} to ${isActive}`)
        } catch (error) {
          Logger.error('Failed to update status for code %s: %j', code, error)
        }
      }
    })
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    const MqttClient = this.app.container.use('Mqtt')
    MqttClient.end() // Gracefully close the MQTT connection
  }
}
