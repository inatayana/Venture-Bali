'use client';

import { useState, useCallback } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { generateCSV, downloadCSV } from '@/lib/csv';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

interface ExportDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: T[];
  columns: { key: string; header: string; render?: (row: T) => string }[];
  defaultFilename?: string;
  title?: string;
  description?: string;
}

export function ExportDialog<T>({
  open,
  onOpenChange,
  data,
  columns,
  defaultFilename = 'export.csv',
  title = 'Export Data',
  description = 'Select columns and export data as CSV',
}: ExportDialogProps<T>) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  );
  const [filename, setFilename] = useState(defaultFilename);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allColumnsSelected = columns.every((c) => selectedColumns.has(c.key));

  const handleColumnToggle = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allColumnsSelected) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(columns.map((c) => c.key)));
    }
  };

  const handleExport = useCallback(async () => {
    if (selectedColumns.size === 0) {
      setError('Please select at least one column');
      return;
    }

    if (!filename.endsWith('.csv')) {
      setFilename((prev) => `${prev}.csv`);
    }

    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const selectedCols = columns.filter((c) => selectedColumns.has(c.key));
      const csv = generateCSV(data, selectedCols);
      downloadCSV(csv, filename);
      setSuccess(true);
      setTimeout(() => onOpenChange(false), 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [columns, selectedColumns, data, filename, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <input
              type="text"
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="export.csv"
            />
          </div>

          {/* Column Selection */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium">Select Columns</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {allColumnsSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center gap-2">
                  <Checkbox
                    id={column.key}
                    checked={selectedColumns.has(column.key)}
                    onCheckedChange={() => handleColumnToggle(column.key)}
                  />
                  <Label htmlFor={column.key} className="text-sm cursor-pointer">
                    {column.header}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <span className="w-4 h-4" aria-hidden="true">⚠</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || selectedColumns.size === 0}
          >
            {exporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </DialogFooter>

        {success && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[#cdff00] text-brand-ink px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle className="w-5 h-5" />
            <span>Export complete!</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}