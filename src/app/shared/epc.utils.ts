const EPC_PATTERN = /^[0-9A-Fa-f]+$/;

export function isValidEpc(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const v = value.trim();
  if (v.length < 8 || v.length > 96 || v.length % 2 !== 0) {
    return false;
  }
  return EPC_PATTERN.test(v);
}

export function normalizeEpc(value: string): string {
  return value ? value.trim().toUpperCase() : '';
}
