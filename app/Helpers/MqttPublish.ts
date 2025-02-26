// app/Helpers/Response.ts

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// import IrCode from 'App/Models/IrCode'
import Item from 'App/Models/Item'
import mqtt from 'mqtt'
import mqttConfig from 'Config/mqtt'
import ApiResponse from './ApiResponse'

export default class MqttPublish {
  private static client: mqtt.MqttClient | null = null // Updated type

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
   * Publishes an MQTT message with a JSON payload
   *
   * @param item - The MQTT topic or item to publish to
   * @param command - The command or variable to find the appropriate IR code
   */
  public static async publish(
    response: HttpContextContract['response'],
    item: string,
    command: any
  ) {
    try {
      const data = await Item.findOrFail(item)

      const client = this.getClient()
      if (!client) {
        return ApiResponse.internalServerError(response, 'MQTT connection failed', null)
      }

      client.publish(data.code, command, { qos: 0 }, (err) => {
        if (err) {
          return ApiResponse.internalServerError(response, 'Publish failed', err.message)
        }
      })

      return ApiResponse.ok(
        response,
        command,
        'Message topic ' + data.code + ' published successfully'
      )
    } catch (error) {
      return ApiResponse.internalServerError(response, error.message, error.stack)
    }
  }
}
