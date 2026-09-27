const MAX_FILENAME_PART_LENGTH = 80;
const MAX_UTF8_FILENAME_PART_LENGTH = 120;

export function sanitizeFilenamePart(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, MAX_FILENAME_PART_LENGTH);

  return normalized || "client";
}

function sanitizeUtf8FilenamePart(value: string) {
  const sanitized = value
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, MAX_UTF8_FILENAME_PART_LENGTH);

  return sanitized || "client";
}

export function buildPdfContentDisposition(prefix: string, clientName: string) {
  const safeClient = sanitizeFilenamePart(clientName);
  const utf8Client = sanitizeUtf8FilenamePart(clientName);
  const asciiBase = `${prefix}-${safeClient}`;
  const utf8Base = `${prefix}-${utf8Client}`;
  const asciiFallback = asciiBase.replace(/[^\x20-\x7E]/g, "_").slice(0, 200);
  const encoded = encodeURIComponent(`${utf8Base}.pdf`);

  return `attachment; filename="${asciiFallback}.pdf"; filename*=UTF-8''${encoded}`;
}
