import { IClientOptions } from 'mqtt'

const mqttConfig: IClientOptions = {
  host: process.env.MQTT_HOST || 'broker.hivemq.com',
  port: Number(process.env.MQTT_PORT) || 1883,
  protocol: (process.env.MQTT_PROTOCOL as 'mqtt' | 'mqtts') || 'mqtt',
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
  clientId:
    process.env.MQTT_CLIENT_ID + `client_${Math.random().toString(16).substr(2, 8)}` || undefined,
  clean: true,
  keepalive: 60,
  reconnectPeriod: 5000,
}
export default mqttConfig
