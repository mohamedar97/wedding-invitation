export function normalizeInternationalPhone(value: string) {
  const trimmed = value.trim().replace(/\s+/g, "");

  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  if (trimmed.startsWith("whatsapp:")) {
    const rest = trimmed.slice("whatsapp:".length).trim();
    return rest.startsWith("+") ? trimmed : `whatsapp:+2${rest}`;
  }

  return `+2${trimmed}`;
}

export function normalizeWhatsappAddress(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("WhatsApp address is required.");
  }

  if (trimmed.startsWith("whatsapp:")) {
    return normalizeInternationalPhone(trimmed);
  }

  return `whatsapp:${normalizeInternationalPhone(trimmed)}`;
}
