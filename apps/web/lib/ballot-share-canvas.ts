import {
  BALLOT_SHARE_SITE_HOST,
  type BallotShareInput,
  type BallotShareTeam,
  ballotShareTitle,
} from "@/lib/ballot-share";

// Logical size (4:5, which X and Instagram show uncropped); drawn at 2x.
const W = 1080;
const H = 1350;
const SCALE = 2;
const PAD = 48;

const HEADER_H = 232;
const ACCENT_H = 6;
const FOOTER_H = 76;
const COL_GAP = 20;
const ROW_GAP = 10;

const PAGE_BG = "#F4F3EF";
const HEADER_BG = "#111117";
const BRAND_RED = "#E4002B";
const INK = "#16161D";
const MUTED = "#6C6C7A";
const ON_DARK_MUTED = "#B4B4C2";
const CARD_BG = "#FFFFFF";
const CARD_BORDER = "#E3E1DA";

const LOGO_BOX = 48;

function loadImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    // Sanity's CDN sends CORS headers; without this the canvas is tainted
    // and can't be exported.
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws `img` centred in a `box`-sized square, keeping its aspect ratio. */
function drawContained(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  box: number,
): void {
  const ratio = img.naturalWidth / img.naturalHeight || 1;
  const w = ratio >= 1 ? box : box * ratio;
  const h = ratio >= 1 ? box / ratio : box;
  ctx.drawImage(img, x + (box - w) / 2, y + (box - h) / 2, w, h);
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}…`;
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  input: BallotShareInput,
  wordmark: HTMLImageElement | null,
  font: string,
): void {
  ctx.fillStyle = HEADER_BG;
  ctx.fillRect(0, 0, W, HEADER_H);
  ctx.fillStyle = BRAND_RED;
  ctx.fillRect(0, HEADER_H - ACCENT_H, W, ACCENT_H);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  if (wordmark) {
    const h = 40;
    const w = (wordmark.naturalWidth / wordmark.naturalHeight || 6) * h;
    ctx.drawImage(wordmark, PAD, 40, w, h);
  } else {
    ctx.font = `800 34px ${font}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("REDSHIRT SPORTS", PAD, 74);
  }

  ctx.font = `800 46px ${font}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(fitText(ctx, ballotShareTitle(input), W - PAD * 2), PAD, 148);

  const byline = [input.voterName, input.voterOutlet]
    .filter(Boolean)
    .join(", ");
  const subline = [`${input.season} season`, byline]
    .filter(Boolean)
    .join("  ·  ");
  ctx.font = `500 24px ${font}`;
  ctx.fillStyle = ON_DARK_MUTED;
  ctx.fillText(fitText(ctx, subline, W - PAD * 2), PAD, 192);
}

function drawTeamRow(
  ctx: CanvasRenderingContext2D,
  team: BallotShareTeam,
  logo: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  font: string,
): void {
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.strokeStyle = CARD_BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  const cy = y + h / 2;

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = `800 28px ${font}`;
  ctx.fillStyle = team.rank === 1 ? BRAND_RED : INK;
  ctx.fillText(String(team.rank), x + 36, cy + 1);

  const logoX = x + 72;
  const logoY = cy - LOGO_BOX / 2;
  if (logo) {
    drawContained(ctx, logo, logoX, logoY, LOGO_BOX);
  } else {
    ctx.beginPath();
    ctx.arc(logoX + LOGO_BOX / 2, cy, LOGO_BOX / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ECEAE4";
    ctx.fill();
    ctx.font = `700 14px ${font}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(team.abbreviation.slice(0, 4).toUpperCase(), logoX + 24, cy);
  }

  ctx.textAlign = "left";
  ctx.font = `600 25px ${font}`;
  ctx.fillStyle = INK;
  const nameX = logoX + LOGO_BOX + 18;
  ctx.fillText(fitText(ctx, team.name, x + w - 18 - nameX), nameX, cy + 1);
}

function drawFooter(ctx: CanvasRenderingContext2D, font: string): void {
  const y = H - FOOTER_H / 2;
  ctx.textBaseline = "middle";
  ctx.font = `700 22px ${font}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.fillText(BALLOT_SHARE_SITE_HOST, PAD, y);
  ctx.font = `500 22px ${font}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  ctx.fillText("@_redshirtsports", W - PAD, y);
  ctx.textAlign = "left";
}

/** Renders the ballot card. Browser-only (canvas + image loading). */
export async function renderBallotShareImage(
  input: BallotShareInput,
): Promise<Blob> {
  // Match the site's typeface once its web fonts have loaded.
  await document.fonts?.ready;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";

  const [wordmark, ...logos] = await Promise.all([
    loadImage(input.wordmarkUrl),
    ...input.teams.map((t) => loadImage(t.logoUrl)),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = PAGE_BG;
  ctx.fillRect(0, 0, W, H);

  drawHeader(ctx, input, wordmark ?? null, font);

  const perColumn = Math.ceil(input.teams.length / 2) || 1;
  const top = HEADER_H + 28;
  const bottom = H - FOOTER_H;
  const rowH = Math.min(
    76,
    (bottom - top - ROW_GAP * (perColumn - 1)) / perColumn,
  );
  const colW = (W - PAD * 2 - COL_GAP) / 2;

  input.teams.forEach((team, i) => {
    const col = i < perColumn ? 0 : 1;
    const row = col === 0 ? i : i - perColumn;
    drawTeamRow(
      ctx,
      team,
      logos[i] ?? null,
      PAD + col * (colW + COL_GAP),
      top + row * (rowH + ROW_GAP),
      colW,
      rowH,
      font,
    );
  });

  drawFooter(ctx, font);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not export image")),
      "image/png",
    );
  });
}
