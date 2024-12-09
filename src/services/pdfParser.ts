import type { Equipment } from '@/types/equipment'

interface PDFExtractedData {
  equipment?: Partial<Equipment>[]
  costs?: {
    acquisition?: number
    operational?: number
    maintenance?: number
  }
  metadata?: {
    title?: string
    author?: string
    creationDate?: string
    keywords?: string[]
  }
  tables?: any[][]
}

export class PDFParserService {
  private static instance: PDFParserService

  private constructor() {}

  public static getInstance(): PDFParserService {
    if (!PDFParserService.instance) {
      PDFParserService.instance = new PDFParserService()
    }
    return PDFParserService.instance
  }

  async parsePDF(file: File): Promise<PDFExtractedData> {
    try {
      // Since content is not used by identifyEquipment or identifyCosts,
      // we can omit extracting it altogether.
      const [metadata, tables] = await Promise.all([
        this.extractMetadata(file),
        this.extractTables()
      ])

      // As we removed content extraction, we don’t call extractContent anymore.
      // If you need content in the future, you can reintroduce it.
      const equipment = this.identifyEquipment(tables)
      const costs = this.identifyCosts(tables)

      return {
        equipment,
        costs,
        metadata,
        tables
      }
    } catch (error) {
      console.error('Error parsing PDF:', error)
      throw new Error('Failed to parse PDF file')
    }
  }

  private async extractContent(file: File): Promise<string> {
    try {
      // Removed arrayBuffer since it’s not used
      await file.arrayBuffer()

      // Simulate content extraction
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return 'Sample extracted content'
    } catch (error) {
      console.error('Error extracting content:', error)
      throw new Error('Failed to extract PDF content')
    }
  }

  private async extractTables(): Promise<any[][]> {
    try {
      // Removed file parameter since we never use it in this method
      await new Promise(resolve => setTimeout(resolve, 500))

      return [
        ['Equipment', 'Category', 'Cost', 'Personnel'],
        ['Platform A', 'platform', '10000', '2'],
        ['Sensor B', 'sensor', '15000', '1'],
        ['Payload C', 'payload', '20000', '3']
      ]
    } catch (error) {
      console.error('Error extracting tables:', error)
      throw new Error('Failed to extract tables from PDF')
    }
  }

  private async extractMetadata(file: File): Promise<PDFExtractedData['metadata']> {
    try {
      // file is used for file.name, so we keep it
      return {
        title: file.name,
        author: 'System',
        creationDate: new Date().toISOString(),
        keywords: ['equipment', 'military', 'costs']
      }
    } catch (error) {
      console.error('Error extracting metadata:', error)
      throw new Error('Failed to extract PDF metadata')
    }
  }

  // Removed content parameter since it's not used
  private identifyEquipment(tables: any[][]): Partial<Equipment>[] {
    const equipment: Partial<Equipment>[] = []
    
    if (tables.length > 1) {
      const headers = tables[0].map((h: string) => h.toLowerCase())
      
      for (let i = 1; i < tables.length; i++) {
        const row = tables[i]
        const equipmentData: Partial<Equipment> = {
          name: row[headers.indexOf('equipment')] || '',
          category: row[headers.indexOf('category')] as any || 'platform',
          acquisitionCost: Number(row[headers.indexOf('cost')]) || 0,
          personnelRequired: Number(row[headers.indexOf('personnel')]) || 0,
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
          }
        }

        equipment.push(equipmentData)
      }
    }

    return equipment
  }

  // Removed content parameter since it's not used
  private identifyCosts(tables: any[][]): PDFExtractedData['costs'] {
    const totalEquipmentCost = tables.slice(1)
      .reduce((acc, row) => acc + (Number(row[2]) || 0), 0)

    return {
      acquisition: totalEquipmentCost,
      operational: totalEquipmentCost * 0.1, // Estimate operational costs
      maintenance: totalEquipmentCost * 0.05 // Estimate maintenance costs
    }
  }

  async validatePDF(file: File): Promise<{ 
    isValid: boolean;
    issues?: string[];
  }> {
    try {
      if (!file.type.includes('pdf')) {
        return {
          isValid: false,
          issues: ['File must be a PDF']
        }
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return {
          isValid: false,
          issues: ['File size must be less than 10MB']
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Error validating PDF:', error)
      return {
        isValid: false,
        issues: ['Failed to validate PDF file']
      }
    }
  }
}
