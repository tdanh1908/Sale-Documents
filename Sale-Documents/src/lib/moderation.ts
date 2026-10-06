export function moderateText(text: string): 'flagged' | 'pending' {
  if (!text) return 'pending';
  
  // Chuẩn hóa tiếng Việt, loại bỏ dấu
  let normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Thay thế đ
  normalized = normalized.replace(/đ/g, "d").replace(/Đ/g, "D");
  normalized = normalized.toLowerCase();
  
  // Loại bỏ các ký tự đặc biệt, khoảng trắng (chỉ giữ lại a-z và 0-9)
  const alphanumeric = normalized.replace(/[^a-z0-9]/g, "");

  // Mảng từ cấm mẫu (bad words)
  const badWords = ["vcl", "dcm", "vl", "dit", "d1t", "lol", "cc", "fuck", "shit", "lon"];

  for (const word of badWords) {
    if (alphanumeric.includes(word)) {
      return 'flagged';
    }
  }

  return 'pending';
}
