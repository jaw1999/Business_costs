import { create } from 'zustand'
import type { PDFReport } from '@/types/reports'
import { useEquipmentStore } from './equipmentStore'
import { useInventoryStore } from './inventoryStore'
import { CostCalculatorService } from '@/services/costCalculator'
import { DegradationTrackerService } from '@/services/degradationTracker'
import { InventoryManagerService } from '@/services/inventoryManager'

interface ReportState {
  reports: PDFReport[]
  selectedReport: PDFReport | null
  loading: boolean
  error: string | null
  
  // Report Actions
  addReport: (report: PDFReport) => void
  updateReport: (report: PDFReport) => void
  removeReport: (id: string) => void
  selectReport: (id: string | null) => void
  
  // Report Generation
  generateInventoryReport: () => Promise<PDFReport>
  generateCostReport: (timeframe: 'monthly' | 'quarterly' | 'yearly') => Promise<PDFReport>
  generateDegradationReport: () => Promise<PDFReport>
  generateProcurementReport: () => Promise<PDFReport>
  
  // Analytics
  getEquipmentUtilization: () => {
    overall: number
    byCategory: Record<string, number>
    trend: Array<{ date: string; utilization: number }>
  }
  getCostAnalytics: () => {
    totalCost: number
    byCategory: Record<string, number>
    trend: Array<{ date: string; cost: number }>
    projected: Array<{ date: string; cost: number }>
  }
  getMaintenanceAnalytics: () => {
    pendingMaintenance: number
    maintenanceCosts: number
    nextScheduled: Array<{ equipment: string; date: string }>
    healthStatus: Record<string, number>
  }
  
  // Export Actions
  exportReportToPDF: (id: string) => Promise<Blob>
  exportAllReports: () => Promise<Blob>
  
  // Utility Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

const costCalculator = CostCalculatorService.getInstance()
const degradationTracker = DegradationTrackerService.getInstance()
const inventoryManager = InventoryManagerService.getInstance()

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  selectedReport: null,
  loading: false,
  error: null,

  // Report Actions
  addReport: (report) => {
    try {
      set((state) => ({
        reports: [...state.reports, report],
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to add report' })
    }
  },

  updateReport: (updatedReport) => {
    try {
      set((state) => ({
        reports: state.reports.map((r) =>
          r.id === updatedReport.id ? updatedReport : r
        ),
        selectedReport:
          state.selectedReport?.id === updatedReport.id
            ? updatedReport
            : state.selectedReport,
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to update report' })
    }
  },

  removeReport: (id) => {
    try {
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
        selectedReport:
          state.selectedReport?.id === id ? null : state.selectedReport,
        error: null
      }))
    } catch (error) {
      set({ error: 'Failed to remove report' })
    }
  },

  selectReport: (id) => {
    set((state) => ({
      selectedReport: id
        ? state.reports.find((r) => r.id === id) || null
        : null
    }))
  },

  // Report Generation
  generateInventoryReport: async () => {
    try {
      set({ loading: true })
      const equipment = useEquipmentStore.getState().equipment
      const consumables = useInventoryStore.getState().consumables
      
      const inventoryReport = inventoryManager.generateInventoryReport(
        equipment,
        consumables
      )

      const report: PDFReport = {
        id: crypto.randomUUID(),
        type: 'inventory',
        title: 'Inventory Status Report',
        date: new Date().toISOString(),
        sections: [
          {
            title: 'Equipment Status',
            content: inventoryReport.equipment,
            type: 'table'
          },
          {
            title: 'Consumables Status',
            content: inventoryReport.consumables,
            type: 'table'
          },
          {
            title: 'Alerts',
            content: inventoryReport.alerts,
            type: 'text'
          }
        ],
        summary: `Total Equipment: ${equipment.length}, 
                 Low Stock Items: ${inventoryReport.alerts.filter(a => a.type === 'low_stock').length},
                 Maintenance Required: ${inventoryReport.alerts.filter(a => a.type === 'maintenance_needed').length}`
      }

      get().addReport(report)
      return report
    } catch (error) {
      set({ error: 'Failed to generate inventory report' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  generateCostReport: async (timeframe) => {
    try {
      set({ loading: true })
      const equipment = useEquipmentStore.getState().equipment
      
      const months = timeframe === 'monthly' ? 1 : timeframe === 'quarterly' ? 3 : 12
      const projectedCosts = costCalculator.projectCosts(equipment, months)

      const report: PDFReport = {
        id: crypto.randomUUID(),
        type: 'cost',
        title: `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Cost Report`,
        date: new Date().toISOString(),
        sections: [
          {
            title: 'Cost Breakdown',
            content: projectedCosts[timeframe],
            type: 'chart'
          },
          {
            title: 'Equipment Costs',
            content: equipment.map(eq => ({
              name: eq.name,
              costs: costCalculator.calculateEquipmentCosts(eq)
            })),
            type: 'table'
          },
          {
            title: 'Cost Projections',
            content: projectedCosts.projections,
            type: 'chart'
          }
        ],
        summary: `Total Projected Cost: $${projectedCosts[timeframe].total.toLocaleString()}`,
        recommendations: [
          'High-cost areas identified for optimization',
          'Suggested maintenance schedule adjustments',
          'Procurement strategy recommendations'
        ]
      }

      get().addReport(report)
      return report
    } catch (error) {
      set({ error: 'Failed to generate cost report' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  generateDegradationReport: async () => {
    try {
      set({ loading: true })
      const equipment = useEquipmentStore.getState().equipment
      
      const degradationAnalysis = equipment.map(eq => ({
        equipment: eq,
        status: degradationTracker.getHealthStatus(eq),
        prediction: degradationTracker.predictReplacement(eq),
        maintenance: degradationTracker.calculateMaintenanceCosts(eq)
      }))

      const report: PDFReport = {
        id: crypto.randomUUID(),
        type: 'operational',
        title: 'Equipment Degradation Report',
        date: new Date().toISOString(),
        sections: [
          {
            title: 'Equipment Health Status',
            content: degradationAnalysis.map(analysis => ({
              name: analysis.equipment.name,
              status: analysis.status.status,
              health: `${(analysis.equipment.degradation.currentValue / analysis.equipment.degradation.maxValue * 100).toFixed(1)}%`,
              daysUntilReplacement: analysis.prediction.daysUntilReplacement
            })),
            type: 'table'
          },
          {
            title: 'Maintenance Schedule',
            content: degradationAnalysis
              .filter(analysis => analysis.status.needsMaintenance)
              .map(analysis => ({
                equipment: analysis.equipment.name,
                urgency: analysis.status.status,
                estimatedCost: analysis.maintenance.monthly
              })),
            type: 'table'
          }
        ],
        summary: `${degradationAnalysis.filter(a => a.status.needsMaintenance).length} items require maintenance`,
        recommendations: degradationAnalysis
          .filter(a => a.status.needsMaintenance)
          .map(a => `Schedule maintenance for ${a.equipment.name} within ${
            a.prediction.daysUntilReplacement
          } days`)
      }

      get().addReport(report)
      return report
    } catch (error) {
      set({ error: 'Failed to generate degradation report' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  generateProcurementReport: async () => {
    try {
      set({ loading: true })
      const equipment = useEquipmentStore.getState().equipment
      const consumables = useInventoryStore.getState().consumables
      
      const procurementNeeds = inventoryManager.generateProcurementNeeds(
        equipment,
        consumables
      )

      const report: PDFReport = {
        id: crypto.randomUUID(),
        type: 'procurement',
        title: 'Procurement Needs Report',
        date: new Date().toISOString(),
        sections: [
          {
            title: 'Immediate Procurement Needs',
            content: procurementNeeds.filter(need => need.priority === 'high'),
            type: 'table'
          },
          {
            title: 'Upcoming Procurement Needs',
            content: procurementNeeds.filter(need => need.priority !== 'high'),
            type: 'table'
          },
          {
            title: 'Cost Analysis',
            content: {
              totalCost: procurementNeeds.reduce((sum, need) => sum + need.estimatedCost, 0),
              byPriority: procurementNeeds.reduce((acc, need) => ({
                ...acc,
                [need.priority]: (acc[need.priority] || 0) + need.estimatedCost
              }), {} as Record<string, number>)
            },
            type: 'chart'
          }
        ],
        summary: `Total procurement needs: ${procurementNeeds.length}, 
                 Estimated total cost: $${procurementNeeds
                   .reduce((sum, need) => sum + need.estimatedCost, 0)
                   .toLocaleString()}`
      }

      get().addReport(report)
      return report
    } catch (error) {
      set({ error: 'Failed to generate procurement report' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // Analytics
  getEquipmentUtilization: () => {
    const equipment = useEquipmentStore.getState().equipment
    const totalEquipment = equipment.length
    const inUseEquipment = equipment.filter(eq => eq.inUse > 0).length
    
    const utilizationByCategory = equipment.reduce((acc, eq) => {
      acc[eq.category] = acc[eq.category] || { total: 0, inUse: 0 }
      acc[eq.category].total++
      if (eq.inUse > 0) acc[eq.category].inUse++
      return acc
    }, {} as Record<string, { total: number; inUse: number }>)

    return {
      overall: totalEquipment ? (inUseEquipment / totalEquipment) * 100 : 0,
      byCategory: Object.entries(utilizationByCategory).reduce(
        (acc, [category, data]) => ({
          ...acc,
          [category]: (data.inUse / data.total) * 100
        }),
        {} as Record<string, number>
      ),
      trend: [] // Would be populated with historical data in a real implementation
    }
  },

  getCostAnalytics: () => {
    const equipment = useEquipmentStore.getState().equipment
    const totalCost = equipment.reduce(
      (sum, eq) => sum + costCalculator.calculateEquipmentCosts(eq).total,
      0
    )

    const costsByCategory = equipment.reduce((acc, eq) => {
      const costs = costCalculator.calculateEquipmentCosts(eq)
      acc[eq.category] = (acc[eq.category] || 0) + costs.total
      return acc
    }, {} as Record<string, number>)

    return {
      totalCost,
      byCategory: costsByCategory,
      trend: [], // Would be populated with historical data
      projected: [] // Would be populated with projected costs
    }
  },

  getMaintenanceAnalytics: () => {
    const equipment = useEquipmentStore.getState().equipment
    const maintenanceNeeded = equipment.filter(
      eq => degradationTracker.getHealthStatus(eq).needsMaintenance
    )

    const totalMaintenanceCosts = maintenanceNeeded.reduce((sum, eq) => {
      const costs = degradationTracker.calculateMaintenanceCosts(eq)
      return sum + costs.monthly
    }, 0)

    const healthStatusCount = equipment.reduce((acc, eq) => {
      const status = degradationTracker.getHealthStatus(eq).status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      pendingMaintenance: maintenanceNeeded.length,
      maintenanceCosts: totalMaintenanceCosts,
      nextScheduled: maintenanceNeeded.map(eq => ({
        equipment: eq.name,
        date: degradationTracker.calculateMaintenanceCosts(eq).nextMaintenance
      })),
      healthStatus: healthStatusCount
    }
  },

  // Export Actions
  exportReportToPDF: async (id) => {
    try {
      set({ loading: true })
      const report = get().reports.find(r => r.id === id)
      if (!report) throw new Error('Report not found')
      
      // In a real implementation, this would use a PDF generation library
      // For now, we'll just return a simple blob
      const content = JSON.stringify(report, null, 2)
      return new Blob([content], { type: 'application/pdf' })
    } catch (error) {
      set({ error: 'Failed to export report' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  exportAllReports: async () => {
    try {
      set({ loading: true })
      const content = JSON.stringify(get().reports, null, 2)
      return new Blob([content], { type: 'application/pdf' })
    } catch (error) {
      set({ error: 'Failed to export reports' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // Continuing from where we left off...

  // Utility Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Additional Analytics Methods
  getEquipmentCategoryDistribution: () => {
    const equipment = useEquipmentStore.getState().equipment
    return equipment.reduce((acc, eq) => {
      acc[eq.category] = (acc[eq.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  },

  getConsumableUsageTrends: () => {
    const consumables = useInventoryStore.getState().consumables
    const transactions = useInventoryStore.getState().transactions
    
    return consumables.map(consumable => {
      const consumableTransactions = transactions
        .filter((t): t is ConsumableTransaction => 
          'consumableId' in t && t.consumableId === consumable.id
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const usage = consumableTransactions.reduce((acc, transaction) => {
        const month = new Date(transaction.date).toISOString().slice(0, 7)
        if (transaction.type === 'use') {
          acc[month] = (acc[month] || 0) + transaction.quantity
        }
        return acc
      }, {} as Record<string, number>)

      return {
        id: consumable.id,
        name: consumable.name,
        currentStock: consumable.stockLevel,
        usage
      }
    })
  },

  getOperationalEfficiencyMetrics: () => {
    const equipment = useEquipmentStore.getState().equipment
    const consumables = useInventoryStore.getState().consumables
    
    const equipmentEfficiency = equipment.map(eq => {
      const health = degradationTracker.getHealthStatus(eq)
      const costs = costCalculator.calculateEquipmentCosts(eq)
      const utilization = eq.inUse / eq.quantity

      return {
        id: eq.id,
        name: eq.name,
        healthScore: (eq.degradation.currentValue / eq.degradation.maxValue) * 100,
        utilizationRate: utilization * 100,
        costPerUse: costs.total / (eq.inUse || 1),
        maintenanceEfficiency: health.needsMaintenance ? 0 : 100
      }
    })

    const consumableEfficiency = consumables.map(consumable => {
      const turnoverRate = useInventoryStore.getState()
        .getTransactionHistory(consumable.id)
        .filter((t): t is ConsumableTransaction => 
          'consumableId' in t && t.type === 'use'
        )
        .reduce((sum, t) => sum + t.quantity, 0) / consumable.stockLevel

      return {
        id: consumable.id,
        name: consumable.name,
        stockEfficiency: (consumable.stockLevel / consumable.reorderPoint) * 100,
        turnoverRate
      }
    })

    return {
      equipment: equipmentEfficiency,
      consumables: consumableEfficiency,
      overallScore: equipmentEfficiency.reduce(
        (sum, eq) => sum + eq.healthScore * eq.utilizationRate,
        0
      ) / (equipmentEfficiency.length || 1)
    }
  },

  generateCustomReport: async (options: {
    sections: ('inventory' | 'costs' | 'maintenance' | 'efficiency')[]
    timeframe: 'daily' | 'weekly' | 'monthly'
    includeRecommendations: boolean
  }) => {
    try {
      set({ loading: true })
      const sections: PDFReport['sections'] = []
      const recommendations: string[] = []

      if (options.sections.includes('inventory')) {
        const inventoryStatus = inventoryManager.generateInventoryReport(
          useEquipmentStore.getState().equipment,
          useInventoryStore.getState().consumables
        )
        sections.push({
          title: 'Inventory Status',
          content: inventoryStatus,
          type: 'table'
        })
        if (options.includeRecommendations) {
          recommendations.push(
            ...inventoryStatus.alerts.map(alert => alert.message)
          )
        }
      }

      if (options.sections.includes('costs')) {
        const costAnalytics = get().getCostAnalytics()
        sections.push({
          title: 'Cost Analysis',
          content: costAnalytics,
          type: 'chart'
        })
        if (options.includeRecommendations && costAnalytics.totalCost > 0) {
          recommendations.push(
            'Consider cost optimization for high-expense categories',
            'Review maintenance schedules for cost efficiency'
          )
        }
      }

      if (options.sections.includes('maintenance')) {
        const maintenanceAnalytics = get().getMaintenanceAnalytics()
        sections.push({
          title: 'Maintenance Status',
          content: maintenanceAnalytics,
          type: 'table'
        })
        if (options.includeRecommendations && maintenanceAnalytics.pendingMaintenance > 0) {
          recommendations.push(
            `Schedule maintenance for ${maintenanceAnalytics.pendingMaintenance} items`,
            'Review preventive maintenance procedures'
          )
        }
      }

      if (options.sections.includes('efficiency')) {
        const efficiencyMetrics = get().getOperationalEfficiencyMetrics()
        sections.push({
          title: 'Operational Efficiency',
          content: efficiencyMetrics,
          type: 'chart'
        })
        if (options.includeRecommendations && efficiencyMetrics.overallScore < 80) {
          recommendations.push(
            'Optimize equipment utilization rates',
            'Review operational procedures for efficiency improvements'
          )
        }
      }

      const report: PDFReport = {
        id: crypto.randomUUID(),
        type: 'operational',
        title: `Custom ${options.timeframe.charAt(0).toUpperCase() + options.timeframe.slice(1)} Report`,
        date: new Date().toISOString(),
        sections,
        summary: `Custom report covering ${options.sections.join(', ')}`,
        recommendations: options.includeRecommendations ? recommendations : undefined
      }

      get().addReport(report)
      return report
    } catch (error) {
      set({ error: 'Failed to generate custom report' })
      throw error
    } finally {
      set({ loading: false })
    }
  }
}))

// Selectors
export const useReports = () => useReportStore((state) => state.reports)
export const useSelectedReport = () => useReportStore((state) => state.selectedReport)
export const useReportLoading = () => useReportStore((state) => state.loading)
export const useReportError = () => useReportStore((state) => state.error)

// Custom hooks for analytics
export const useEquipmentAnalytics = () => {
  const utilization = useReportStore((state) => state.getEquipmentUtilization())
  const categoryDistribution = useReportStore((state) => state.getEquipmentCategoryDistribution())
  const maintenanceAnalytics = useReportStore((state) => state.getMaintenanceAnalytics())
  
  return {
    utilization,
    categoryDistribution,
    maintenanceAnalytics
  }
}

export const useCostAnalytics = () => useReportStore((state) => state.getCostAnalytics())
export const useEfficiencyMetrics = () => useReportStore((state) => state.getOperationalEfficiencyMetrics())