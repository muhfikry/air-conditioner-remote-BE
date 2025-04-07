interface StatusSerializeInterface {
  id: string
  code: string
  description?: string | null
  status: boolean
}

export default class StatusSerialize {
  public static async single(item: any): Promise<StatusSerializeInterface> {
    return {
      id: item.id,
      code: item.code,
      description: item.description,
      status: item.isActive,
    }
  }

  public static async collection(items: any[]): Promise<StatusSerializeInterface[]> {
    return Promise.all(items.map((item: any) => this.single(item)))
  }
}
