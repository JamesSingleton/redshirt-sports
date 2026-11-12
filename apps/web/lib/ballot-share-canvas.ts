import type { BallotImageRow } from "@/lib/ballot-share";

export type BallotImageInput = {
  poll: string;
  season: string;
  week: number;
  voterName: string;
  voterOutlet: string;
  rows: BallotImageRow[];
  matchPercent: number;
  avgGap: number;
  pageUrl: string;
};

const W = 720;
const PAD = 32;
const HEADER_Y = 90;
const ROW_H = 32;
const ROW_START_Y = HEADER_Y + 90;
const FOOTER_H = 110;
const SPONSOR_H = 60;
const SCALE = 2;

const BG = "#FFFFFF";
const FG = "#1C1C28";
const PRIMARY = "#A13520";
const MUTED = "#6B6B80";
const ROW_STRIPE = "#F5F5F8";
const OUTLIER_BG = "rgba(197,169,61,0.15)";
const OUTLIER_BORDER = "#C5A93D";

function totalHeight(rowCount: number): number {
  return ROW_START_Y + rowCount * ROW_H + SPONSOR_H + FOOTER_H;
}

export function drawBallotImage(input: BallotImageInput): HTMLCanvasElement {
  const h = totalHeight(input.rows.length);
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, h);

  drawHeader(ctx, input);
  drawRows(ctx, input.rows);
  drawFooter(ctx, input, h);

  return canvas;
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  input: BallotImageInput,
): void {
  ctx.fillStyle = PRIMARY;
  ctx.fillRect(0, 0, W, 6);

  ctx.font = "bold 22px 'Arial Narrow', sans-serif";
  ctx.fillStyle = PRIMARY;
  ctx.textBaseline = "top";
  ctx.fillText("REDSHIRT SPORTS", PAD, 20);

  ctx.font = "600 13px sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText(
    `${input.poll} Top 25 \u00B7 ${input.season} Season \u00B7 Week ${input.week}`,
    PAD,
    50,
  );

  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = FG;
  ctx.fillText(input.voterName, PAD, 72);

  const nameWidth = ctx.measureText(input.voterName).width;
  if (input.voterOutlet) {
    ctx.font = "14px sans-serif";
    ctx.fillStyle = MUTED;
    ctx.fillText(` \u00B7 ${input.voterOutlet}`, PAD + nameWidth, 75);
  }

  ctx.fillStyle = "#E0E0E8";
  ctx.fillRect(PAD, ROW_START_Y - 38, W - PAD * 2, 1);

  ctx.font = "bold 11px sans-serif";
  ctx.fillStyle = MUTED;
  ctx.textBaseline = "bottom";
  ctx.fillText("RK", PAD + 8, ROW_START_Y - 8);
  ctx.fillText("TEAM", PAD + 56, ROW_START_Y - 8);
  ctx.textAlign = "right";
  ctx.fillText("DIFF", W - PAD - 8, ROW_START_Y - 8);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
}

function drawRows(ctx: CanvasRenderingContext2D, rows: BallotImageRow[]): void {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const y = ROW_START_Y + i * ROW_H;

    if (row.isOutlier) {
      ctx.fillStyle = OUTLIER_BG;
      ctx.fillRect(PAD, y, W - PAD * 2, ROW_H);
      ctx.strokeStyle = OUTLIER_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(PAD + 0.5, y + 0.5, W - PAD * 2 - 1, ROW_H - 1);
    } else if (i % 2 === 1) {
      ctx.fillStyle = ROW_STRIPE;
      ctx.fillRect(PAD, y, W - PAD * 2, ROW_H);
    }

    const cy = y + ROW_H / 2;

    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = FG;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText(String(row.rank), PAD + 40, cy);

    ctx.textAlign = "left";
    ctx.font = "500 14px sans-serif";
    ctx.fillStyle = FG;
    ctx.fillText(row.teamName, PAD + 56, cy);

    ctx.textAlign = "right";
    const diff = row.diffLabel;
    if (diff === "RV") {
      ctx.font = "600 12px sans-serif";
      ctx.fillStyle = MUTED;
    } else if (diff === "=") {
      ctx.font = "600 13px sans-serif";
      ctx.fillStyle = MUTED;
    } else if (diff.startsWith("+")) {
      ctx.font = "600 13px sans-serif";
      ctx.fillStyle = "#2D8A56";
    } else {
      ctx.font = "600 13px sans-serif";
      ctx.fillStyle = "#B53D2B";
    }
    ctx.fillText(diff, W - PAD - 8, cy);
    ctx.textAlign = "left";
  }
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  input: BallotImageInput,
  totalH: number,
): void {
  const footerY = totalH - FOOTER_H;

  ctx.fillStyle = "#F5F5F8";
  ctx.fillRect(0, footerY, W, FOOTER_H);

  ctx.fillStyle = "#E0E0E8";
  ctx.fillRect(0, footerY, W, 1);

  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = FG;
  ctx.textBaseline = "top";
  ctx.fillText(`${input.matchPercent}% agreement`, PAD, footerY + 16);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText(
    `Avg. gap ${input.avgGap.toFixed(1)} spots vs consensus`,
    PAD,
    footerY + 38,
  );

  ctx.font = "13px sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText(input.pageUrl, PAD, footerY + 62);

  ctx.fillStyle = PRIMARY;
  ctx.fillRect(0, totalH - 4, W, 4);
}

export function downloadBallotImage(
  input: BallotImageInput,
  filename: string,
): void {
  const canvas = drawBallotImage(input);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, "image/png");
}
