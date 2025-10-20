import React, { useState } from 'react';
import api from '../services/api';

interface PDFSummaryData {
  extractedText: string;
  summary: string;
  questions: Array<{
    id: string;
    question: string;
    answer: string;
    type: string;
    source: string;
  }>;
  metadata: {
    fileName: string;
    fileSize: number;
    totalPages: number;
    textLength: number;
  };
}

interface PDFUploaderProps {
  onPDFProcessed: (data: PDFSummaryData) => void;
  onTextExtracted: (text: string) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onPDFProcessed, onTextExtracted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        alert('Please upload a PDF file only.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processPDF = async (extractOnly: boolean = false) => {
    if (!file) {
      alert('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const endpoint = extractOnly ? '/pdf/extract-text' : '/pdf/extract-and-summarize';
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        if (extractOnly) {
          onTextExtracted(response.data.data.text);
        } else {
          onPDFProcessed(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Error processing PDF file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Upload & Processing</h3>
      
      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          <div>
            <p className="text-gray-600 mb-2">
              Drag and drop your PDF file here, or click to select
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Choose PDF File
            </label>
          </div>
          
          {file && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {file && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => processPDF(true)}
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Extract Text Only'}
          </button>
          <button
            onClick={() => processPDF(false)}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Extract + Summarize + Questions'}
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Processing your PDF...</span>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;