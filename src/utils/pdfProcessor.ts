import { Equipment, Consumable } from '@/types/equipment'

interface ExtractedData {
  equipment?: Partial<Equipment>[]
  consumables?: Partial<Consumable>[]
  costs?: {
    acquisition?: number
    operational?: number
    maintenance?: number
  }
  metadata?: {
    title?: string
    author?: string
    date?: string
    keywords?: string[]
  }
}

interface TableData {
  headers: string[]
  rows: string[][]
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    // In a real implementation, you would use pdf.js or a similar library
    // This is a placeholder implementation
    return 'Sample extracted text'
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

export const extractTablesFromPDF = async (file: File): Promise<TableData[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    // In a real implementation, you would use pdf.js or similar
    // This is a placeholder implementation
    return [{
      headers: ['Name', 'Category', 'Cost'],
      rows: [['Sample Item', 'platform', '1000']]
    }]
  } catch (error) {
    console.error('Error extracting tables from PDF:', error)
    throw new Error('Failed to extract tables from PDF')
  }
}

export const identifyEquipment = (text: string, tables: TableData[]): Partial<Equipment>[] => {
  const equipment: Partial<Equipment>[] = []

  // Look for equipment information in tables
  tables.forEach(table => {
    const nameIndex = table.headers.findIndex(h => 
      h.toLowerCase().includes('name') || 
      h.toLowerCase().includes('equipment')
    )
    const categoryIndex = table.headers.findIndex(h => 
      h.toLowerCase().includes('category') || 
      h.toLowerCase().includes('type')
    )
    const costIndex = table.headers.findIndex(h => 
      h.toLowerCase().includes('cost') || 
      h.toLowerCase().includes('price')
    )

    if (nameIndex >= 0) {
      table.rows.forEach(row => {
        const equipmentData: Partial<Equipment> = {
          name: row[nameIndex],
          category: categoryIndex >= 0 ? 
            row[categoryIndex].toLowerCase() as Equipment['category'] : 
            'platform',
          acquisitionCost: costIndex >= 0 ? 
            parseFloat(row[costIndex].replace(/[^0-9.-]+/g, '')) : 
            0,
          dateAdded: new Date().toISOString(),
          quantity: 1,
          inUse: 0,
          degradation: {
            type: 'cycles',
            maxValue: 100,
            currentValue: 100,
            replacementCost: 0,
            degradationRate: 1,
            lastUpdated: new Date().toISOString()
          },
          personnelRequired: 1,
          consumables: []
        }
        equipment.push(equipmentData)
      })
    }
  })

  return equipment
}

export const identifyConsumables = (text: string, tables: TableData[]): Partial<Consumable>[] => {
  const consumables: Partial<Consumable>[] = []

  tables.forEach(table => {
    const nameIndex = table.headers.findIndex(h => 
      h.toLowerCase().includes('consumable') || 
      h.toLowerCase().includes('supply')
    )
    const unitIndex = table.headers.findIndex(h => 
      h.toLowerCase().includes('unit')
    )
    const costIndex = table.headers.findIndex(h => 
      h.toLowerCase().includes('cost') || 
      h.toLowerCase().includes('price')
    )

    if (nameIndex >= 0) {
      table.rows.forEach(row => {
        const consumableData: Partial<Consumable> = {
          name: row[nameIndex],
          unit: unitIndex >= 0 ? row[unitIndex] : 'unit',
          costPerUnit: costIndex >= 0 ? 
            parseFloat(row[costIndex].replace(/[^0-9.-]+/g, '')) : 
            0,
          stockLevel: 0,
          minimumStock: 10,
          reorderPoint: 20
        }
        consumables.push(consumableData)
      })
    }
  })

  return consumables
}

export const extractCosts = (text: string, tables: TableData[]): Partial<ExtractedData['costs']> => {
  const costs: Partial<ExtractedData['costs']> = {}

  // Look for cost information in tables
  tables.forEach(table => {
    const costTypeIndex = table.headers.findIndex(h => 
      h.toLowerCase().includes('type') || 
      h.toLowerCase().includes('category')
    )
    const amountIndex = table.headers.findIndex(h => 
      h.toLowerCase().includes('amount') || 
      h.toLowerCase().includes('cost')
    )

    if (costTypeIndex >= 0 && amountIndex >= 0) {
      table.rows.forEach(row => {
        const costType = row[costTypeIndex].toLowerCase()
        const amount = parseFloat(row[amountIndex].replace(/[^0-9.-]+/g, ''))

        if (costType.includes('acquisition')) costs.acquisition = amount
        if (costType.includes('operational')) costs.operational = amount
        if (costType.includes('maintenance')) costs.maintenance = amount
      })
    }
  })

  return costs
}

export const extractMetadata = async (file: File): Promise<ExtractedData['metadata']> => {
  try {
    // In a real implementation, you would use pdf.js to extract metadata
    return {
      title: file.name,
      author: 'Unknown',
      date: new Date().toISOString(),
      keywords: []
    }
  } catch (error) {
    console.error('Error extracting metadata:', error)
    throw new Error('Failed to extract metadata from PDF')
  }
}

export const processPDF = async (file: File): Promise<ExtractedData> => {
  try {
    const [text, tables, metadata] = await Promise.all([
      extractTextFromPDF(file),
      extractTablesFromPDF(file),
      extractMetadata(file)
    ])

    return {
      equipment: identifyEquipment(text, tables),
      consumables: identifyConsumables(text, tables),
      costs: extractCosts(text, tables),
      metadata
    }
  } catch (error) {
    console.error('Error processing PDF:', error)
    throw new Error('Failed to process PDF')
  }
}