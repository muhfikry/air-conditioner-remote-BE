import { IClientOptions } from 'mqtt'

const mqttConfig: IClientOptions = {
  host: process.env.MQTT_HOST || 'broker.hivemq.com',
  port: Number(process.env.MQTT_PORT) || 1883,
  protocol: (process.env.MQTT_PROTOCOL as 'mqtt' | 'mqtts') || 'mqtt',
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
  clientId: process.env.MQTT_CLIENT_ID || undefined,
}
export default mqttConfig
