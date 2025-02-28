interface StatSerializeInterface {
  id: string
  name: string
  description?: string | null
  totalItem: number
  activeCount: number
  inactiveCount: number
}

export default class StatSerialize {
  public static async single(building: any): Promise<StatSerializeInterface> {
    return {
      id: building.id,
      name: building.name,
      description: building.description,
      totalItem: building.totalItem,
      activeCount: building.activeCount,
      inactiveCount: building.inactiveCount,
    }
  }

  public static async collection(buildings: any[]): Promise<StatSerializeInterface[]> {
    return Promise.all(buildings.map((building: any) => this.single(building)))
  }
}
