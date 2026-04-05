"use client";

import {
  type GuestNameCardEmbeddedAssets,
  renderGuestNameCardSvg,
} from "@/components/GuestNameCard";
import {
  buildGuestCardFilename,
  type PrintableGuestCard,
  GUEST_NAME_CARD_HEIGHT_MM,
  GUEST_NAME_CARD_HEIGHT_PX,
  GUEST_NAME_CARD_WIDTH_MM,
  GUEST_NAME_CARD_WIDTH_PX,
} from "@/lib/guestNameCards";

const assetCache = new Map<string, Promise<string>>();
const PDF_MARGIN_MM = 7;

function fetchAsDataUrl(path: string) {
  if (!assetCache.has(path)) {
    assetCache.set(
      path,
      fetch(path)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to load asset: ${path}`);
          }

          const blob = await response.blob();

          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
        })
        .catch((error) => {
          assetCache.delete(path);
          throw error;
        }),
    );
  }

  return assetCache.get(path)!;
}

export async function loadGuestNameCardEmbeddedAssets(): Promise<GuestNameCardEmbeddedAssets> {
  const [
    topRightImageHref,
    bottomLeftImageHref,
    englishFontSrc,
    arabicFontSrc,
  ] = await Promise.all([
    fetchAsDataUrl("/tr.webp"),
    fetchAsDataUrl("/bl.webp"),
    fetchAsDataUrl("/above-the-beyond-script.ttf"),
    fetchAsDataUrl("/UKIJDiY.ttf"),
  ]);

  return {
    topRightImageHref,
    bottomLeftImageHref,
    englishFontSrc,
    arabicFontSrc,
  };
}

async function svgMarkupToJpegBlob(svgMarkup: string) {
  const svgBlob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Failed to load SVG image."));
      nextImage.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = GUEST_NAME_CARD_WIDTH_PX;
    canvas.height = GUEST_NAME_CARD_HEIGHT_PX;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is not available.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to export PDF preview image."));
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        0.98,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function triggerDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function createCrc32Table() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

const crc32Table = createCrc32Table();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return {
    dosDate,
    dosTime,
  };
}

function encodeFileName(fileName: string) {
  return new TextEncoder().encode(fileName);
}

function writeUint16(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function concatUint8Arrays(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}

export function createZipArchive(
  files: Array<{ fileName: string; data: Uint8Array }>,
) {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;
  const { dosDate, dosTime } = getDosDateTime();

  for (const file of files) {
    const fileNameBytes = encodeFileName(file.fileName);
    const checksum = crc32(file.data);

    const localHeader = new Uint8Array(30 + fileNameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, dosTime);
    writeUint16(localHeader, 12, dosDate);
    writeUint32(localHeader, 14, checksum);
    writeUint32(localHeader, 18, file.data.length);
    writeUint32(localHeader, 22, file.data.length);
    writeUint16(localHeader, 26, fileNameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(fileNameBytes, 30);

    localChunks.push(localHeader, file.data);

    const centralHeader = new Uint8Array(46 + fileNameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, dosTime);
    writeUint16(centralHeader, 14, dosDate);
    writeUint32(centralHeader, 16, checksum);
    writeUint32(centralHeader, 20, file.data.length);
    writeUint32(centralHeader, 24, file.data.length);
    writeUint16(centralHeader, 28, fileNameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(fileNameBytes, 46);
    centralChunks.push(centralHeader);

    offset += localHeader.length + file.data.length;
  }

  const centralDirectory = concatUint8Arrays(centralChunks);
  const endOfCentralDirectory = new Uint8Array(22);
  writeUint32(endOfCentralDirectory, 0, 0x06054b50);
  writeUint16(endOfCentralDirectory, 4, 0);
  writeUint16(endOfCentralDirectory, 6, 0);
  writeUint16(endOfCentralDirectory, 8, files.length);
  writeUint16(endOfCentralDirectory, 10, files.length);
  writeUint32(endOfCentralDirectory, 12, centralDirectory.length);
  writeUint32(endOfCentralDirectory, 16, offset);
  writeUint16(endOfCentralDirectory, 20, 0);

  return concatUint8Arrays([
    ...localChunks,
    centralDirectory,
    endOfCentralDirectory,
  ]);
}

async function exportCardToPngBlob(
  card: PrintableGuestCard,
  embeddedAssets: GuestNameCardEmbeddedAssets,
) {
  const svgMarkup = renderGuestNameCardSvg({
    name: card.name,
    tableNumber: card.tableNumber,
    embedAssets: embeddedAssets,
  });

  return await svgMarkupToJpegBlob(svgMarkup);
}

function mmToPoints(value: number) {
  return (value * 72) / 25.4;
}

function escapePdfString(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function concatBytes(chunks: Uint8Array[]) {
  return concatUint8Arrays(chunks);
}

function createPdfDocument({
  imageBytes,
  imageWidthPx,
  imageHeightPx,
  pageWidthMm,
  pageHeightMm,
  imageXPt,
  imageYPt,
  imageWidthPt,
  imageHeightPt,
  title,
}: {
  imageBytes: Uint8Array;
  imageWidthPx: number;
  imageHeightPx: number;
  pageWidthMm: number;
  pageHeightMm: number;
  imageXPt: number;
  imageYPt: number;
  imageWidthPt: number;
  imageHeightPt: number;
  title: string;
}) {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  function pushString(value: string) {
    const bytes = encoder.encode(value);
    parts.push(bytes);
    currentOffset += bytes.length;
  }

  function pushBytes(value: Uint8Array) {
    parts.push(value);
    currentOffset += value.length;
  }

  function beginObject(objectNumber: number) {
    offsets[objectNumber] = currentOffset;
    pushString(`${objectNumber} 0 obj\n`);
  }

  function endObject() {
    pushString("endobj\n");
  }

  const pageWidthPt = mmToPoints(pageWidthMm);
  const pageHeightPt = mmToPoints(pageHeightMm);
  const contentStream = `0.984 0.965 0.937 rg
0 0 ${pageWidthPt.toFixed(3)} ${pageHeightPt.toFixed(3)} re
f
q
${imageWidthPt.toFixed(3)} 0 0 ${imageHeightPt.toFixed(3)} ${imageXPt.toFixed(3)} ${imageYPt.toFixed(3)} cm
/Im0 Do
Q`;

  pushString("%PDF-1.3\n%\u00e2\u00e3\u00cf\u00d3\n");

  beginObject(1);
  pushString("<< /Type /Catalog /Pages 2 0 R >>\n");
  endObject();

  beginObject(2);
  pushString("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n");
  endObject();

  beginObject(3);
  pushString(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt.toFixed(3)} ${pageHeightPt.toFixed(3)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\n`,
  );
  endObject();

  beginObject(4);
  pushString(
    `<< /Type /XObject /Subtype /Image /Width ${imageWidthPx} /Height ${imageHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
  );
  pushBytes(imageBytes);
  pushString("\nendstream\n");
  endObject();

  beginObject(5);
  const contentBytes = encoder.encode(contentStream);
  pushString(`<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushString("\nendstream\n");
  endObject();

  beginObject(6);
  pushString(
    `<< /Title (${escapePdfString(title)}) /Producer (Codex) /Creator (Wedding Invitation Admin) >>\n`,
  );
  endObject();

  const xrefOffset = currentOffset;
  const objectCount = 6;
  pushString(`xref\n0 ${objectCount + 1}\n`);
  pushString("0000000000 65535 f \n");

  for (let objectNumber = 1; objectNumber <= objectCount; objectNumber += 1) {
    pushString(`${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`);
  }

  pushString(
    `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return new Blob([concatBytes(parts)], { type: "application/pdf" });
}

async function exportCardToPdfBlob(
  card: PrintableGuestCard,
  embeddedAssets: GuestNameCardEmbeddedAssets,
) {
  const jpegBlob = await exportCardToPngBlob(card, embeddedAssets);
  const imageBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const pageWidthMm = GUEST_NAME_CARD_WIDTH_MM + PDF_MARGIN_MM * 2;
  const pageHeightMm = GUEST_NAME_CARD_HEIGHT_MM + PDF_MARGIN_MM * 2;

  return createPdfDocument({
    imageBytes,
    imageWidthPx: GUEST_NAME_CARD_WIDTH_PX,
    imageHeightPx: GUEST_NAME_CARD_HEIGHT_PX,
    pageWidthMm,
    pageHeightMm,
    imageXPt: mmToPoints(PDF_MARGIN_MM),
    imageYPt: mmToPoints(PDF_MARGIN_MM),
    imageWidthPt: mmToPoints(GUEST_NAME_CARD_WIDTH_MM),
    imageHeightPt: mmToPoints(GUEST_NAME_CARD_HEIGHT_MM),
    title: `${card.name} name card`,
  });
}

function buildGuestCardPdfFilename(card: PrintableGuestCard) {
  return buildGuestCardFilename(card).replace(/\.png$/, ".pdf");
}

export async function downloadSingleGuestCardPdf(
  card: PrintableGuestCard,
  embeddedAssets: GuestNameCardEmbeddedAssets,
) {
  const pdfBlob = await exportCardToPdfBlob(card, embeddedAssets);
  triggerDownload(pdfBlob, buildGuestCardPdfFilename(card));
}

export async function downloadGuestCardPdfZip(
  cards: PrintableGuestCard[],
  embeddedAssets: GuestNameCardEmbeddedAssets,
) {
  const files: Array<{ fileName: string; data: Uint8Array }> = [];

  for (const card of cards) {
    const pdfBlob = await exportCardToPdfBlob(card, embeddedAssets);
    files.push({
      fileName: buildGuestCardPdfFilename(card),
      data: new Uint8Array(await pdfBlob.arrayBuffer()),
    });
  }

  const zipBytes = createZipArchive(files);
  const zipBlob = new Blob([zipBytes], { type: "application/zip" });
  triggerDownload(zipBlob, "guest-name-card-pdfs.zip");
}
