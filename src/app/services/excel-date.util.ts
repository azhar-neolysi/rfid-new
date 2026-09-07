import * as XLSX from 'xlsx';

export function normalizeExcelDate(v: any, fallback: string | null = null): string | null {
  if (v === null || v === undefined || v === '') return fallback;
  if (v instanceof Date && !isNaN(v.getTime())) {
    return (
      v.getFullYear() +
      '-' +
      String(v.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(v.getDate()).padStart(2, '0')
    );
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{4}\/\d{2}\/\d{2}/.test(s)) {
    return s.slice(0, 10).split('/').join('-');
  }
  if (/^\d+(\.\d+)?$/.test(s)) {
    const dc = XLSX.SSF.parse_date_code(Number(s));
    if (dc) {
      return dc.y + '-' + String(dc.m).padStart(2, '0') + '-' + String(dc.d).padStart(2, '0');
    }
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }
  return fallback;
}