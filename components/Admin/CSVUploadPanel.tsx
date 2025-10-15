'use client';

import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

type CSVUploadPanelProps = {
  targetTable: 'questions' | 'competition_questions';
  onUploadComplete?: () => void;
};

type ParsedRow = {
  [key: string]: any;
  _rowNumber?: number;
  _isValid?: boolean;
  _errors?: string[];
};

type UploadResult = {
  success: boolean;
  uploaded?: number;
  failed?: number;
  errors?: any[];
  message?: string;
  totalRows?: number;
  validCount?: number;
  errorCount?: number;
};

export default function CSVUploadPanel({ targetTable, onUploadComplete }: CSVUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tableName = targetTable === 'questions' ? 'Free Quiz Questions' : 'Competition Questions';

  /**
   * Download CSV template
   */
  const handleDownloadTemplate = () => {
    const headers = [
      'question_text',
      'category',
      'difficulty',
      'choice1',
      'choice2',
      'choice3',
      'choice4',
      'correct_answer',
      'explanation',
      'status'
    ];

    const exampleRows = [
      [
        'What is the capital of France?',
        'Geography',
        'Easy',
        'London',
        'Berlin',
        'Paris',
        'Madrid',
        'Paris',
        'Paris is the capital and largest city of France.',
        'true'
      ],
      [
        'Who painted the Mona Lisa?',
        'Arts & Literature',
        'Medium',
        'Leonardo da Vinci',
        'Michelangelo',
        'Raphael',
        'Donatello',
        'Leonardo da Vinci',
        'The Mona Lisa was painted by Leonardo da Vinci in the early 16th century.',
        'true'
      ],
      [
        'What is the largest planet in our solar system?',
        'Science',
        'Easy',
        'Mars',
        'Jupiter',
        'Saturn',
        'Earth',
        'Jupiter',
        'Jupiter is the largest planet in our solar system.',
        'true'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${targetTable}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Template downloaded successfully');
  };

  /**
   * Parse CSV file
   */
  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: ParsedRow = { _rowNumber: i };
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row);
    }

    return rows;
  };

  /**
   * Parse a single CSV line (handles quoted values)
   */
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  /**
   * Handle file selection
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);

    // Parse file
    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        toast.error('No valid data found in CSV file');
        return;
      }

      setParsedData(data);
      toast.success(`Parsed ${data.length} rows from CSV`);
    } catch (err) {
      toast.error('Failed to parse CSV file');
      console.error('CSV parse error:', err);
    }
  };

  /**
   * Handle file drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        input.files = dataTransfer.files;
        handleFileChange({ target: input } as any);
      }
    } else {
      toast.error('Please drop a CSV file');
    }
  };

  /**
   * Upload questions
   */
  const handleUpload = async () => {
    if (!file || parsedData.length === 0) {
      toast.error('Please select a CSV file first');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await fetch('/api/admin/questions/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvData: parsedData,
          targetTable
        })
      });

      const result = await response.json();

      setUploadResult(result);

      if (result.success) {
        toast.success(`Successfully uploaded ${result.uploaded} questions!`);
        
        // Clear form
        setParsedData([]);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Callback
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        toast.error(`Upload failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload questions');
      setUploadResult({
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Clear selection
   */
  const handleClear = () => {
    setFile(null);
    setParsedData([]);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload CSV - {tableName}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Import multiple questions from a CSV file
          </p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Template
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Download the CSV template to see the required format</li>
          <li>• Required fields: question_text, category, difficulty, 4 choices, correct_answer</li>
          <li>• Valid difficulties: Easy, Medium, Hard</li>
          <li>• Valid categories: History, Geography, Sports, Science, Entertainment, Arts & Literature, General Knowledge</li>
          <li>• Correct answer must match one of the four choices exactly</li>
          <li>• All validation happens before upload - no partial imports</li>
        </ul>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id={`csv-upload-${targetTable}`}
        />
        
        <label htmlFor={`csv-upload-${targetTable}`} className="cursor-pointer">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">CSV files only</p>
        </label>

        {file && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{file.name}</span>
            <span className="text-gray-500">({parsedData.length} rows)</span>
          </div>
        )}
      </div>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Preview ({parsedData.length} rows)</h3>
            <p className="text-xs text-gray-600 mt-1">Showing first 5 rows</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Question</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Difficulty</th>
                  <th className="px-4 py-2 text-left">Choices</th>
                  <th className="px-4 py-2 text-left">Answer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 max-w-xs truncate" title={row.question_text}>
                      {row.question_text}
                    </td>
                    <td className="px-4 py-2">{row.category}</td>
                    <td className="px-4 py-2">{row.difficulty}</td>
                    <td className="px-4 py-2 text-xs">
                      {row.choice1 && (
                        <div className="space-y-0.5">
                          <div>{row.choice1}</div>
                          <div>{row.choice2}</div>
                          <div>{row.choice3}</div>
                          <div>{row.choice4}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium text-green-700">
                      {row.correct_answer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      {parsedData.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload {parsedData.length} Questions
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div
          className={`rounded-lg p-4 ${
            uploadResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {uploadResult.success ? (
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${uploadResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
              </h3>
              <p className={`text-sm mt-1 ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {uploadResult.message}
              </p>
              
              {/* Stats */}
              {uploadResult.success && uploadResult.uploaded !== undefined && (
                <div className="mt-2 text-sm text-green-700">
                  <div>✓ Uploaded: {uploadResult.uploaded} questions</div>
                  {uploadResult.failed !== undefined && uploadResult.failed > 0 && (
                    <div>✗ Failed: {uploadResult.failed} questions</div>
                  )}
                </div>
              )}

              {/* Validation Errors */}
              {!uploadResult.success && uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-3 max-h-60 overflow-y-auto">
                  <div className="text-sm font-medium text-red-900 mb-2">
                    Validation Errors ({uploadResult.errorCount || uploadResult.errors.length}):
                  </div>
                  <div className="space-y-1">
                    {uploadResult.errors.slice(0, 10).map((error: any, idx: number) => (
                      <div key={idx} className="text-xs text-red-700 bg-red-100 rounded px-2 py-1">
                        Row {error.row}: <span className="font-medium">{error.field}</span> - {error.error}
                        {error.value && <span className="text-red-600"> (got: "{error.value}")</span>}
                      </div>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <div className="text-xs text-red-600 italic">
                        ...and {uploadResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
