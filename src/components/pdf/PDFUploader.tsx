import { useState, useRef } from 'react'
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react'
import { PDFViewer } from './PDFViewer'

interface UploadedFile {
  id: string
  name: string
  status: 'processing' | 'success' | 'error'
  message?: string
  data?: any
}

export function PDFUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const processFile = async (file: File) => {
    const id = crypto.randomUUID()
    
    // Add file to list with processing status
    setFiles(prev => [...prev, {
      id,
      name: file.name,
      status: 'processing'
    }])

    try {
      // Here you would implement the actual PDF parsing logic
      // For now, we'll simulate processing with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500))

      setFiles(prev => prev.map(f => 
        f.id === id
          ? { ...f, status: 'success', message: 'File processed successfully' }
          : f
      ))
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === id
          ? { ...f, status: 'error', message: 'Failed to process file' }
          : f
      ))
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    )

    for (const file of files) {
      await processFile(file)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      for (const file of files) {
        await processFile(file)
      }
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    if (selectedFile?.id === id) {
      setSelectedFile(null)
    }
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Drag and drop PDF files here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 hover:text-blue-600"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Only PDF files are supported
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="application/pdf"
          multiple
          onChange={handleFileSelect}
        />
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Uploaded Files</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {files.map(file => (
              <li 
                key={file.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedFile?.id === file.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <File className="h-6 w-6 text-gray-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      {file.message && (
                        <p className={`text-xs ${
                          file.status === 'error' ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {file.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(file.status)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedFile && (
        <div className="bg-white rounded-lg shadow p-4">
          <PDFViewer file={selectedFile} />
        </div>
      )}
    </div>
  )
}