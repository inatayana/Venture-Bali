'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { parseCSV, importCSV } from '@/lib/csv';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: { key: string; header: string; required?: boolean; parse?: (value: string) => unknown }[];
  validateRow?: (row: Record<string, string>) => { valid: boolean; errors: string[] };
  onImportComplete?: (result: {
    success: boolean;
    data: T[];
    errors: { row: number; message: string }[];
    imported: number;
    skipped: number;
  }) => void;
  title?: string;
  description?: string;
}

export function ImportDialog<T>({
  open,
  onOpenChange,
  columns,
  validateRow,
  onImportComplete,
  title = 'Import Data',
  description = 'Upload a CSV file to import data',
}: ImportDialogProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });
  const [result, setResult] = useState<{
    success: boolean;
    data: T[];
    errors: { row: number; message: string }[];
    imported: number;
    skipped: number;
  } | null>(null);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(file);
    setResult(null);
    setErrors([]);

    // Preview first few rows
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length > 0) {
        setPreviewHeaders(rows[0]);
        setPreviewRows(rows.slice(1, 6)); // Show first 5 rows
      }
    };
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setImporting(true);
    setProgress({ loaded: 0, total: 0 });
    setResult(null);
    setErrors([]);

    try {
      const result = await importCSV<T>(file, columns, {
        validateRow,
        onProgress: setProgress,
      });

      setResult({
        success: result.success,
        data: result.data,
        errors: result.errors,
        imported: result.imported,
        skipped: result.skipped,
      });
      setErrors(result.errors);
      onImportComplete?.(result);

      if (result.success) {
        setTimeout(() => onOpenChange(false), 1500);
      }
    } catch (error) {
      setErrors([{ row: 0, message: error instanceof Error ? error.message : 'Import failed' }]);
    } finally {
      setImporting(false);
      setProgress({ loaded: 0, total: 0 });
    }
  }, [file, columns, validateRow, onImportComplete, onOpenChange]);

  const removeFile = () => {
    setFile(null);
    setPreviewRows([]);
    setPreviewHeaders([]);
    setResult(null);
    setErrors([]);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[80vh] overflow-hidden">
          {/* File Selection */}
          <div className="space-y-3">
            <Label htmlFor="csv-file" className="text-sm font-medium">
              CSV File
            </Label>
            <div className="relative">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => handleFileChange(e)}
                className="sr-only"
                disabled={importing}
              />
              <label
                htmlFor="csv-file"
                className={cn(
                  'flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg',
                  'cursor-pointer transition-colors',
                  file ? 'bg-green-50 border-green-500' : 'border-dashed border-muted-foreground/25',
                  'hover:bg-accent/50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="csv-file"
                  accept=".csv"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e)}
                  className="sr-only"
                  disabled={importing}
                />
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CSV files only · Max 10MB
                  </p>
                  {file && (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-xs text-red-600 hover:underline mt-1"
                    >
                      Remove file
                    </button>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* File Preview */}
          {file && previewHeaders.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3 max-h-48 overflow-auto">
              <p className="text-sm font-medium mb-2">Preview (first 5 rows)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      {previewHeaders.map((h) => (
                        <th key={h} className="px-2 py-1 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1 truncate max-w-[150px]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Column Mapping */}
          <div className="space-y-3">
            <Label className="font-medium">Column Mapping</Label>
            <p className="text-sm text-muted-foreground">
              Map CSV columns to import fields. Required fields are marked with *.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {columns.map((col) => (
                <div key={col.key} className="space-y-1">
                  <Label htmlFor={`map-${col.key}`} className="text-sm font-medium">
                    {col.header} {col.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <select
                    id={`map-${col.key}`}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={importing}
                  >
                    <option value="">-- Select column --</option>
                    {previewHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          {importing && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing...</span>
                  <span>{progress.loaded} / {progress.total}</span>
                </div>
                <Progress value={progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0} className="h-2" />
              </div>
            </>
          )}

          {/* Results */}
          {result && (
            <Alert className={cn(result.success ? 'border-green-500' : 'border-red-500')}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <AlertDescription className="flex-1">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {result.success ? 'Import completed successfully' : 'Import completed with errors'}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>✓ Imported: {result.imported}</span>
                      <span>⊘ Skipped: {result.skipped}</span>
                      {result.errors.length > 0 && (
                        <span className="text-red-600">✗ Errors: {result.errors.length}</span>
                      )}
                    </div>
                    {result.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          Show errors ({result.errors.length})
                        </summary>
                        <ul className="mt-1 space-y-1 text-xs text-red-600">
                          {result.errors.slice(0, 10).map((err, i) => (
                            <li key={i}>Row {err.row}: {err.message}</li>
                          ))}
                          {result.errors.length > 10 && (
                            <li className="text-muted-foreground">
                              ... and {result.errors.length - 10} more errors
                            </li>
                          )}
                        </ul>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Errors */}
          {errors.length > 0 && !result && (
            <Alert className="border-red-500">
              <AlertDescription>
                <ul className="space-y-1">
                  {errors.slice(0, 5).map((err, i) => (
                    <li key={i} className="text-sm text-red-600">
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                  {errors.length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      ... and {errors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !file}
          >
            {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}