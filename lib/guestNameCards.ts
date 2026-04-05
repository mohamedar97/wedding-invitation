export type PrintableGuestCard = {
  key: string;
  name: string;
  tableNumber?: number;
  kind: "main" | "additional" | "custom";
  guestSide?: "groom" | "bride";
  slug?: string;
  guestId?: string;
  additionalGuestId?: string;
};

export const GUEST_NAME_CARD_SUBTITLE = "Thank you for coming";
export const GUEST_NAME_CARD_WIDTH_PX = 1240;
export const GUEST_NAME_CARD_HEIGHT_PX = 1748;
export const GUEST_NAME_CARD_WIDTH_MM = 105;
export const GUEST_NAME_CARD_HEIGHT_MM = 148;

export function containsArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

export function buildGuestCardPreviewHref({
  name,
  tableNumber,
}: {
  name: string;
  tableNumber?: number;
}) {
  const encodedName = encodeURIComponent(name.trim() || "Guest");
  const tableQuery =
    tableNumber !== undefined ? `?table=${encodeURIComponent(String(tableNumber))}` : "";

  return `/guest-card/${encodedName}${tableQuery}`;
}

export function slugifyFilenameSegment(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "guest";
}

export function buildGuestCardFilename(card: PrintableGuestCard) {
  const segments =
    card.kind === "custom"
      ? ["custom"]
      : [
          card.guestSide ? slugifyFilenameSegment(card.guestSide) : undefined,
          card.tableNumber !== undefined ? `table-${card.tableNumber}` : "no-table",
        ].filter(Boolean);

  return `${segments.join("-")}-${slugifyFilenameSegment(card.name)}.png`;
}
