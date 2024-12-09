import type { Equipment, EquipmentCombination } from '@/types/equipment'
import { DegradationTrackerService } from './degradationTracker'

interface CostBreakdown {
  acquisition: number
  operational: number
  maintenance: number
  personnel: number
  consumables: number
  total: number
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

interface ProjectedCosts {
  monthly: CostBreakdown[]
  quarterly: CostBreakdown[]
  yearly: CostBreakdown
  projections: Array<{
    date: string
    costs: CostBreakdown
  }>
}

export class CostCalculatorService {
  private static instance: CostCalculatorService
  private degradationTracker: DegradationTrackerService
  private readonly PERSONNEL_COST_PER_MONTH = 5000 // $5000 per person per month
  private readonly CONSUMABLE_BASE_COST = 100 // $100 per unit base cost

  private constructor() {
    this.degradationTracker = DegradationTrackerService.getInstance()
  }

  public static getInstance(): CostCalculatorService {
    if (!CostCalculatorService.instance) {
      CostCalculatorService.instance = new CostCalculatorService()
    }
    return CostCalculatorService.instance
  }

  calculateEquipmentCosts(equipment: Equipment): CostBreakdown {
    const maintenanceCosts = this.degradationTracker.calculateMaintenanceCosts(equipment)
    const operationalCost = this.calculateOperationalCost(equipment)
    const personnelCost = this.calculatePersonnelCost(equipment)
    const consumablesCost = this.calculateConsumablesCost(equipment)

    return {
      acquisition: equipment.acquisitionCost,
      operational: operationalCost,
      maintenance: maintenanceCosts.monthly,
      personnel: personnelCost,
      consumables: consumablesCost,
      total: equipment.acquisitionCost + operationalCost + maintenanceCosts.monthly + 
             personnelCost + consumablesCost,
      details: {
        itemizedCosts: [{
          name: equipment.name,
          category: equipment.category,
          cost: equipment.acquisitionCost
        }],
        personnelBreakdown: {
          count: equipment.personnelRequired,
          costPerPerson: this.PERSONNEL_COST_PER_MONTH
        },
        consumablesBreakdown: equipment.consumables.map(consumable => ({
          id: consumable.id,
          units: consumable.unitsPerUse,
          costPerUnit: this.CONSUMABLE_BASE_COST,
          totalCost: consumable.unitsPerUse * this.CONSUMABLE_BASE_COST
        }))
      }
    }
  }

  calculateCombinationCosts(combination: EquipmentCombination, equipment: Equipment[]): CostBreakdown {
    const itemizedCosts = combination.equipment.map(item => {
      const equipmentItem = equipment.find(e => e.id === item.id)
      if (!equipmentItem) throw new Error(`Equipment ${item.id} not found`)
      
      const costs = this.calculateEquipmentCosts(equipmentItem)
      return {
        ...costs,
        quantity: item.quantity,
        total: costs.total * item.quantity
      }
    })

    const totalCosts = itemizedCosts.reduce((totals, item) => ({
      acquisition: totals.acquisition + (item.acquisition * item.quantity),
      operational: totals.operational + (item.operational * item.quantity),
      maintenance: totals.maintenance + (item.maintenance * item.quantity),
      personnel: totals.personnel + (item.personnel * item.quantity),
      consumables: totals.consumables + (item.consumables * item.quantity),
      total: totals.total + item.total
    }), {
      acquisition: 0,
      operational: 0,
      maintenance: 0,
      personnel: 0,
      consumables: 0,
      total: 0
    })

    return {
      ...totalCosts,
      details: {
        itemizedCosts: itemizedCosts.map(cost => ({
          name: equipment.find(e => e.id === cost.id)?.name || 'Unknown',
          category: equipment.find(e => e.id === cost.id)?.category || 'unknown',
          cost: cost.total
        })),
        personnelBreakdown: {
          count: combination.equipment.reduce((total, item) => {
            const equipmentItem = equipment.find(e => e.id === item.id)
            return total + (equipmentItem?.personnelRequired || 0) * item.quantity
          }, 0),
          costPerPerson: this.PERSONNEL_COST_PER_MONTH
        },
        consumablesBreakdown: this.calculateCombinationConsumables(combination, equipment)
      }
    }
  }

  projectCosts(equipment: Equipment[], months: number): ProjectedCosts {
    const monthlyProjections = Array.from({ length: months }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() + index)

      const monthlyCosts = equipment.reduce((total, item) => {
        const costs = this.calculateEquipmentCosts(item)
        const degradation = this.degradationTracker.calculateDegradation(item, { days: 30 * index })
        const degradationFactor = degradation.currentValue / degradation.maxValue

        return {
          acquisition: total.acquisition + (costs.acquisition / 12),
          operational: total.operational + (costs.operational * degradationFactor),
          maintenance: total.maintenance + (costs.maintenance * (2 - degradationFactor)),
          personnel: total.personnel + costs.personnel,
          consumables: total.consumables + costs.consumables,
          total: 0 // Calculated below
        }
      }, {
        acquisition: 0,
        operational: 0,
        maintenance: 0,
        personnel: 0,
        consumables: 0,
        total: 0
      })

      monthlyCosts.total = Object.values(monthlyCosts).reduce((sum, value) => sum + value, 0) - monthlyCosts.total
      return { date: date.toISOString(), costs: monthlyCosts }
    })

    const quarterlyProjections = Array.from({ length: Math.ceil(months / 3) }, (_, index) => {
      const quarterMonths = monthlyProjections.slice(index * 3, (index + 1) * 3)
      return this.aggregateCosts(quarterMonths.map(m => m.costs))
    })

    return {
      monthly: monthlyProjections.map(p => p.costs),
      quarterly: quarterlyProjections,
      yearly: this.aggregateCosts(monthlyProjections.map(p => p.costs)),
      projections: monthlyProjections
    }
  }

  private calculateOperationalCost(equipment: Equipment): number {
    const baseCost = equipment.acquisitionCost * 0.1 // 10% of acquisition cost
    const degradation = this.degradationTracker.getHealthStatus(equipment)
    
    // Increase operational costs based on equipment health
    const healthFactor = degradation.status === 'good' ? 1 :
                        degradation.status === 'fair' ? 1.2 :
                        degradation.status === 'poor' ? 1.5 : 2

    return baseCost * healthFactor
  }

  private calculatePersonnelCost(equipment: Equipment): number {
    return equipment.personnelRequired * this.PERSONNEL_COST_PER_MONTH
  }

  private calculateConsumablesCost(equipment: Equipment): number {
    return equipment.consumables.reduce((total, consumable) => {
      return total + (consumable.unitsPerUse * this.CONSUMABLE_BASE_COST)
    }, 0)
  }

  private calculateCombinationConsumables(
    combination: EquipmentCombination,
    equipment: Equipment[]
  ): Array<{ id: string; units: number; costPerUnit: number; totalCost: number }> {
    const consumables = new Map<string, { units: number; costPerUnit: number }>()

    combination.equipment.forEach(item => {
      const equipmentItem = equipment.find(e => e.id === item.id)
      if (!equipmentItem) return

      equipmentItem.consumables.forEach(consumable => {
        const existing = consumables.get(consumable.id)
        const units = consumable.unitsPerUse * item.quantity

        if (existing) {
          existing.units += units
        } else {
          consumables.set(consumable.id, {
            units,
            costPerUnit: this.CONSUMABLE_BASE_COST
          })
        }
      })
    })

    return Array.from(consumables.entries()).map(([id, data]) => ({
      id,
      units: data.units,
      costPerUnit: data.costPerUnit,
      totalCost: data.units * data.costPerUnit
    }))
  }

  private aggregateCosts(costs: CostBreakdown[]): CostBreakdown {
    return costs.reduce((total, current) => ({
      acquisition: total.acquisition + current.acquisition,
      operational: total.operational + current.operational,
      maintenance: total.maintenance + current.maintenance,
      personnel: total.personnel + current.personnel,
      consumables: total.consumables + current.consumables,
      total: total.total + current.total
    }), {
      acquisition: 0,
      operational: 0,
      maintenance: 0,
      personnel: 0,
      consumables: 0,
      total: 0
    })
  }
}