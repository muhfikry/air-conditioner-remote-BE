import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Item from 'App/Models/Item'
import mqtt from 'mqtt'
import mqttConfig from 'Config/mqtt'
import ApiResponse from './ApiResponse'
import Redis from '@ioc:Adonis/Addons/Redis'

export default class MqttPublish {
  private static client: mqtt.MqttClient | null = null

  /**
   * Mengambil instance client MQTT, membuat koneksi jika belum ada
   */
  private static getClient(): mqtt.MqttClient {
    if (!this.client) {
      this.client = mqtt.connect(mqttConfig)
      this.client.on('error', (err) => {
        console.error('MQTT Client Error:', err)
        this.client = null // Reset client untuk memungkinkan rekoneksi
      })
    }
    return this.client
  }

  /**
   * Mengirimkan pesan ke MQTT topic tertentu
   * @param code - MQTT topic
   * @param command - Payload yang akan dikirim
   */
  public static publish(
    code: string,
    command: any
  ): Promise<{ success: boolean; message: string; error?: any }> {
    return new Promise((resolve, reject) => {
      const client = this.getClient()
      if (!client) {
        return reject({ success: false, message: 'MQTT connection failed' })
      }

      client.publish(code, command, { qos: 2 }, (err) => {
        if (err) {
          return reject({ success: false, message: 'MQTT publish failed', error: err })
        }
        if (command === 'on') {
          Redis.set(`status:${code}`, JSON.stringify(true), 'EX', 60)
        }
        if (command === 'off') {
          Redis.set(`status:${code}`, JSON.stringify(false), 'EX', 60)
        }
        resolve({ success: true, message: `Message published to topic: ${code}` })
      })
    })
  }

  /**
   * Publishes an MQTT message with a JSON payload
   * @param response - HttpContext response object
   * @param item - The MQTT topic or item to publish to
   * @param command - The command or variable to find the appropriate IR code
   */
  public static async send(response: HttpContextContract['response'], item: string, command: any) {
    try {
      const data = await Item.findOrFail(item)
      const send = await this.publish(data.code, command)

      if (!send.success) {
        return ApiResponse.internalServerError(response, send.message, send.error)
      }

      return ApiResponse.ok(response, command, `Message topic ${data.code} published successfully`)
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }
}
