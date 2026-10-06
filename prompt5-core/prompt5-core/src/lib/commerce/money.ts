/** Định dạng tiền Việt: 59000 -> "59.000đ" (không phụ thuộc Intl để kết quả giống nhau mọi máy). */
export function formatVND(amount: number): string {
  const n = Math.round(amount);
  const sign = n < 0 ? '-' : '';
  return sign + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}
