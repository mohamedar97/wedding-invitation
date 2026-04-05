import {
  containsArabic,
  GUEST_NAME_CARD_HEIGHT_MM,
  GUEST_NAME_CARD_HEIGHT_PX,
  GUEST_NAME_CARD_SUBTITLE,
  GUEST_NAME_CARD_WIDTH_MM,
  GUEST_NAME_CARD_WIDTH_PX,
} from "@/lib/guestNameCards";

type GuestNameCardProps = {
  name: string;
  tableNumber?: number;
  subtitle?: string;
  className?: string;
  embedAssets?: Partial<GuestNameCardEmbeddedAssets>;
};

export type GuestNameCardEmbeddedAssets = {
  topRightImageHref: string;
  bottomLeftImageHref: string;
  englishFontSrc: string;
  arabicFontSrc: string;
};

const TOP_RIGHT_IMAGE_WIDTH = 330;
const TOP_RIGHT_IMAGE_HEIGHT = 330;
const BOTTOM_LEFT_IMAGE_WIDTH = 420;
const BOTTOM_LEFT_IMAGE_HEIGHT = 420;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderGuestNameCardSvg({
  name,
  tableNumber,
  subtitle = GUEST_NAME_CARD_SUBTITLE,
  embedAssets,
}: Omit<GuestNameCardProps, "className">) {
  const isArabic = containsArabic(name);
  const fontFamily = isArabic
    ? "'GuestNameCardArabic', 'Times New Roman', serif"
    : "'GuestNameCardScript', 'Times New Roman', serif";
  const nameFontSize = isArabic ? 82 : 92;
  const titleY = tableNumber !== undefined ? 220 : 0;
  const dividerY = tableNumber !== undefined ? 275 : 0;
  const nameY = tableNumber !== undefined ? 590 : 540;
  const subtitleY = tableNumber !== undefined ? 900 : 850;
  const subtitleLines = subtitle
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const subtitleFontSize = 26;
  const subtitleLineHeight = 40;
  const subtitleStartY =
    subtitleY - ((subtitleLines.length - 1) * subtitleLineHeight) / 2;
  const topRightImageHref = embedAssets?.topRightImageHref ?? "/tr.webp";
  const bottomLeftImageHref = embedAssets?.bottomLeftImageHref ?? "/bl.webp";
  const englishFontFace = embedAssets?.englishFontSrc
    ? `
      @font-face {
        font-family: 'GuestNameCardScript';
        src: url('${embedAssets.englishFontSrc}') format('truetype');
      }
    `
    : "";
  const arabicFontFace = embedAssets?.arabicFontSrc
    ? `
      @font-face {
        font-family: 'GuestNameCardArabic';
        src: url('${embedAssets.arabicFontSrc}') format('truetype');
      }
    `
    : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${GUEST_NAME_CARD_WIDTH_PX}" height="${GUEST_NAME_CARD_HEIGHT_PX}" viewBox="0 0 ${GUEST_NAME_CARD_WIDTH_PX} ${GUEST_NAME_CARD_HEIGHT_PX}" role="img" aria-label="Guest name card for ${escapeXml(name)}">
      <defs>
        <style>
          ${englishFontFace}
          ${arabicFontFace}
        </style>
      </defs>
      <rect width="100%" height="100%" fill="#fbf6ef"/>
      <rect x="30" y="30" width="${GUEST_NAME_CARD_WIDTH_PX - 60}" height="${GUEST_NAME_CARD_HEIGHT_PX - 60}" rx="0" fill="none" stroke="#d6a251" stroke-width="6"/>
      <rect x="48" y="48" width="${GUEST_NAME_CARD_WIDTH_PX - 96}" height="${GUEST_NAME_CARD_HEIGHT_PX - 96}" rx="0" fill="none" stroke="#e2be7c" stroke-width="2"/>
      <image href="${topRightImageHref}" x="${GUEST_NAME_CARD_WIDTH_PX - TOP_RIGHT_IMAGE_WIDTH}" y="0" width="${TOP_RIGHT_IMAGE_WIDTH}" height="${TOP_RIGHT_IMAGE_HEIGHT}" preserveAspectRatio="xMaxYMin meet"/>
      <image href="${bottomLeftImageHref}" x="0" y="${GUEST_NAME_CARD_HEIGHT_PX - BOTTOM_LEFT_IMAGE_HEIGHT}" width="${BOTTOM_LEFT_IMAGE_WIDTH}" height="${BOTTOM_LEFT_IMAGE_HEIGHT}" preserveAspectRatio="xMinYMax meet"/>
      ${
        tableNumber !== undefined
          ? `
            <text x="${GUEST_NAME_CARD_WIDTH_PX / 2}" y="${titleY}" text-anchor="middle" fill="#8c5524" font-size="38" font-family="'Cormorant Garamond', 'Times New Roman', serif" letter-spacing="4">TABLE ${tableNumber}</text>
            <line x1="${GUEST_NAME_CARD_WIDTH_PX / 2 - 86}" y1="${dividerY}" x2="${GUEST_NAME_CARD_WIDTH_PX / 2 + 86}" y2="${dividerY}" stroke="#d6a251" stroke-width="3"/>
          `
          : ""
      }
      <text x="${GUEST_NAME_CARD_WIDTH_PX / 2}" y="${nameY}" text-anchor="middle" fill="#7c4016" font-size="${nameFontSize}" font-family="${fontFamily}" direction="${isArabic ? "rtl" : "ltr"}">${escapeXml(name)}</text>
      <text x="${GUEST_NAME_CARD_WIDTH_PX / 2}" y="${subtitleStartY}" text-anchor="middle" fill="#8c5524" font-size="${subtitleFontSize}" font-family="'Cormorant Garamond', 'Times New Roman', serif" letter-spacing="1">
        ${subtitleLines
          .map(
            (line, index) =>
              `<tspan x="${GUEST_NAME_CARD_WIDTH_PX / 2}" dy="${index === 0 ? 0 : subtitleLineHeight}">${escapeXml(line)}</tspan>`,
          )
          .join("")}
      </text>
    </svg>
  `.trim();
}

export default function GuestNameCard({
  name,
  tableNumber,
  subtitle = GUEST_NAME_CARD_SUBTITLE,
  className,
  embedAssets,
}: GuestNameCardProps) {
  return (
    <div
      className={className}
      style={{
        width: `${GUEST_NAME_CARD_WIDTH_MM}mm`,
        height: `${GUEST_NAME_CARD_HEIGHT_MM}mm`,
      }}
      dangerouslySetInnerHTML={{
        __html: renderGuestNameCardSvg({
          name,
          tableNumber,
          subtitle,
          embedAssets,
        }),
      }}
    />
  );
}
