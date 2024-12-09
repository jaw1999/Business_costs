import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface PDFViewerProps {
  file: {
    id: string
    name: string
    data?: any
  }
}

export function PDFViewer({ file }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    // In a real implementation, you would load and render the PDF here
    // using a library like pdf.js
    setTotalPages(1)
    setCurrentPage(1)
    setScale(1)
    setRotation(0)
  }, [file])

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5))
  }

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={previousPage}
            disabled={currentPage === 1}
            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={rotate}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* PDF rendering would go here */}
          <div className="text-white text-center">
            <p>PDF preview not available in this demo</p>
            <p className="text-sm text-gray-400">{file.name}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900">Extracted Information</h4>
        <p className="text-sm text-gray-500 mt-1">
          No information has been extracted from this PDF yet.
        </p>
      </div>
    </div>
  )
}