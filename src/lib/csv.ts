export interface CSVExportOptions<T> {
  data: T[];
  columns: { key: string; header: string; render?: (row: T) => string }[];
  filename?: string;
  delimiter?: string;
}

export interface CSVImportResult<T> {
  success: boolean;
  data: T[];
  errors: { row: number; message: string }[];
  imported: number;
  skipped: number;
}

export interface CSVImportOptions {
  file: File;
  columns: { key: string; header: string; required?: boolean; parse?: (value: string) => unknown }[];
  validateRow?: (row: Record<string, string>) => { valid: boolean; errors: string[] };
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

/**
 * Export data to CSV
 */
export function exportToCSV<T>({
  data,
  columns,
  filename = 'export.csv',
  delimiter = ',',
}: CSVExportOptions<T>): void {
  if (typeof window === 'undefined') {
    throw new Error('exportToCSV can only run in browser environment');
  }

  // Generate header
  const headers = columns.map((c) => escapeCSV(c.header)).join(delimiter);

  // Generate rows
  const rows = data.map((row: T) =>
    columns
      .map((col) => {
        const value = col.render ? col.render(row) : (row as Record<string, unknown>)[col.key];
        return escapeCSV(value);
      })
      .join(delimiter)
  );

  const csvContent = [headers, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV value
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Parse CSV file with progress
 */
export function parseCSVFile(
  file: File,
  onProgress?: (progress: { loaded: number; total: number }) => void
): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({ loaded: e.loaded, total: e.total });
      }
    };

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse CSV text into rows
 */
export function parseCSV(text: string, delimiter = ','): string[][] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _delimiter = delimiter;
  // Remove BOM if present
  text = text.replace(/^\uFEFF/, '');

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      // Row separator
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else if (char === '\r' && !inQuotes) {
      // Ignore carriage return
    } else {
      currentField += char;
    }
  }

  // Push the last field
  currentRow.push(currentField);

  // Push the last row
  if (currentRow.length > 0 || text.endsWith(',')) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Generate CSV from data
 */
export function generateCSV<T>(
  data: T[],
  columns: { key: string; header: string; render?: (row: T) => string }[]
): string {
  const headers = columns.map((c) => escapeCSV(c.header)).join(',');
  const rows = data.map((row: T) =>
    columns
      .map((col) => {
        const value = col.render ? col.render(row) : (row as Record<string, unknown>)[col.key];
        return escapeCSV(value);
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

/**
 * Export to file download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  if (typeof window === 'undefined') {
    throw new Error('downloadCSV can only run in browser environment');
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import CSV with validation
 */
export async function importCSV<T>(
  file: File,
  columns: { key: string; header: string; required?: boolean; parse?: (value: string) => unknown }[],
  options: {
    validateRow?: (row: Record<string, string>) => { valid: boolean; errors: string[] };
    onProgress?: (progress: { loaded: number; total: number }) => void;
  } = {}
): Promise<{
  success: boolean;
  data: T[];
  errors: { row: number; message: string }[];
  imported: number;
  skipped: number;
}> {
  const rows = await parseCSVFile(file, options.onProgress);

  if (rows.length < 2) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: 'CSV file is empty or has only headers' }],
      imported: 0,
      skipped: 0,
    };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Map headers to column keys
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header.trim()] = index;
  });

  const data: T[] = [];
  const errors: { row: number; message: string }[] = [];
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = i + 2; // +2 because 0-indexed and header row

    // Skip empty rows
    if (row.every((cell) => !cell.trim())) {
      skipped++;
      continue;
    }

    const rowData: Record<string, unknown> = {};

    // Map CSV columns to object
    for (const column of columns) {
      const headerIndex = headerMap[column.header];
      let value: unknown = headerIndex !== undefined ? row[headerIndex] : '';

      if (column.parse) {
        try {
          value = column.parse(String(value));
        } catch {
          value = row[headerIndex] || '';
        }
      }

      if (column.required && (!value || String(value).trim() === '')) {
        errors.push({ row: rowNumber, message: `Missing required field: ${column.header}` });
        skipped++;
        continue;
      }

      rowData[column.key] = value;
    }

    // Validate row if validator provided
    if (options.validateRow) {
      const validation = options.validateRow(rowData as Record<string, string>);
      if (!validation.valid) {
        errors.push({ row: rowNumber, message: validation.errors.join(', ') });
        skipped++;
        continue;
      }
    }

    data.push(rowData as T);
    imported++;
  }

  return {
    success: errors.length === 0,
    data,
    errors,
    imported,
    skipped,
  };
}