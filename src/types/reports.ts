export interface PDFReport {
    id: string
    type: 'procurement' | 'operational' | 'inventory' | 'cost'
    title: string
    date: string
    sections: {
      title: string
      content: any
      type: 'text' | 'table' | 'chart'
    }[]
    summary: string
    recommendations?: string[]
  }
  
  export interface CostBreakdown {
    total: number
    acquisition: number
    operational: number
    maintenance: number
    personnel: number
    consumables: number
    details?: {
      itemizedCosts: Array<{
        name: string
        category: string
        cost: number
      }>
      personnelBreakdown: {
        count: number
        costPerPerson: number
      }
      consumablesBreakdown: Array<{
        id: string
        units: number
        costPerUnit: number
        totalCost: number
      }>
    }
  }