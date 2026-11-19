export type CardTemplate = 'paper' | 'night' | 'cream';
export type CardAspectRatio = 'square' | 'story';

export interface ShareCardRenderOptions {
  category?: string;
  sectionTitle?: string;
  source?: string;
  text: string;
  citation?: string;
  template?: CardTemplate;
  aspectRatio?: CardAspectRatio;
}

interface ThemeConfig {
  bg: string;
  isGradient?: boolean;
  bgGradientEnd?: string;
  outerBorder: string;
  innerBorder: string;
  badgeBg: string;
  badgeText: string;
  mainText: string;
  subText: string;
  divider: string;
  signature: string;
}

const THEMES: Record<CardTemplate, ThemeConfig> = {
  paper: {
    bg: '#FAF9F5',
    outerBorder: '#A67C2E',
    innerBorder: 'rgba(166, 124, 46, 0.4)',
    badgeBg: '#0F5C4A',
    badgeText: '#FFFFFF',
    mainText: '#1A1F1C',
    subText: '#526058',
    divider: '#D6CEBE',
    signature: '#7A6B53',
  },
  night: {
    bg: '#0E1412',
    isGradient: true,
    bgGradientEnd: '#13221C',
    outerBorder: '#D4AF63',
    innerBorder: 'rgba(212, 175, 99, 0.4)',
    badgeBg: '#34A88B',
    badgeText: '#0E1412',
    mainText: '#F2F4F2',
    subText: '#94A39D',
    divider: '#2A3C34',
    signature: '#A6926D',
  },
  cream: {
    bg: '#F4EFE6',
    outerBorder: '#0F5C4A',
    innerBorder: 'rgba(15, 92, 74, 0.35)',
    badgeBg: '#A67C2E',
    badgeText: '#FFFFFF',
    mainText: '#18201C',
    subText: '#5A6860',
    divider: '#CEBFA8',
    signature: '#0F5C4A',
  },
};

// Word wrap helper with auto-sizing
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  // Normalize extra spaces
  const clean = text.replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export async function renderShareCardToCanvas(
  canvas: HTMLCanvasElement,
  options: ShareCardRenderOptions
): Promise<void> {
  const {
    category = '',
    sectionTitle = '',
    source = '',
    text,
    citation = '',
    template = 'paper',
    aspectRatio = 'square',
  } = options;

  // Wait for web fonts to load completely before drawing
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const width = 1080;
  const height = aspectRatio === 'square' ? 1080 : 1350;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const theme = THEMES[template] || THEMES.paper;

  // 1. Draw Background
  if (theme.isGradient && theme.bgGradientEnd) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, theme.bg);
    grad.addColorStop(1, theme.bgGradientEnd);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = theme.bg;
  }
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Islamic Decorative Double Frame
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  // Outer Border
  const outerMargin = 45;
  ctx.strokeStyle = theme.outerBorder;
  ctx.lineWidth = 4;
  ctx.strokeRect(
    outerMargin,
    outerMargin,
    width - outerMargin * 2,
    height - outerMargin * 2
  );

  // Inner Border
  const innerMargin = 58;
  ctx.strokeStyle = theme.innerBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    innerMargin,
    innerMargin,
    width - innerMargin * 2,
    height - innerMargin * 2
  );

  // Corner Ornaments (Islamic 8-point stars / diamonds)
  const drawCornerOrnament = (x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = theme.outerBorder;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Small Diamond
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 9, y);
    ctx.lineTo(x, y + 9);
    ctx.lineTo(x - 9, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  drawCornerOrnament(innerMargin, innerMargin);
  drawCornerOrnament(width - innerMargin, innerMargin);
  drawCornerOrnament(innerMargin, height - innerMargin);
  drawCornerOrnament(width - innerMargin, height - innerMargin);

  // 3. Top Header Badge
  const badgeY = 110;
  const badgeText = sectionTitle ? `${category} • ${sectionTitle}` : category;

  ctx.font = 'bold 24px "Thmanyah Sans", -apple-system, sans-serif';
  const badgeMetrics = ctx.measureText(badgeText);
  const badgePaddingX = 30;
  const badgeHeight = 44;
  const badgeWidth = Math.min(width - 200, badgeMetrics.width + badgePaddingX * 2);
  const badgeX = (width - badgeWidth) / 2;

  // Draw pill background
  ctx.fillStyle = theme.badgeBg;
  ctx.beginPath();
  const radius = badgeHeight / 2;
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, radius);
  ctx.fill();

  // Draw pill text
  ctx.fillStyle = theme.badgeText;
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, width / 2, badgeY + badgeHeight / 2 + 1);

  // 4. Main Body Text (Dynamic Font Sizing & Centering)
  const contentTop = badgeY + badgeHeight + 50;
  const contentBottom = height - 170;
  const availableHeight = contentBottom - contentTop;
  const maxTextWidth = width - 200;

  // Determine starting font size based on text length
  let fontSize = 42;
  if (text.length > 350) fontSize = 28;
  else if (text.length > 220) fontSize = 32;
  else if (text.length > 120) fontSize = 36;

  let lines: string[] = [];
  let lineHeight = fontSize * 1.95;

  // Auto-scale down if text overflows available area
  while (fontSize >= 20) {
    ctx.font = `bold ${fontSize}px "Amiri", "Traditional Arabic", serif`;
    lines = wrapText(ctx, text, maxTextWidth);
    const totalTextHeight = lines.length * (fontSize * 1.95);
    if (totalTextHeight <= availableHeight - 30) {
      lineHeight = fontSize * 1.95;
      break;
    }
    fontSize -= 2;
  }

  ctx.font = `bold ${fontSize}px "Amiri", "Traditional Arabic", serif`;
  ctx.fillStyle = theme.mainText;
  ctx.textBaseline = 'top';

  const totalLinesHeight = lines.length * lineHeight;
  // Center vertically in available content space
  let textStartY = contentTop + (availableHeight - totalLinesHeight) / 2;

  // If citation exists, make room for it
  if (citation) {
    textStartY -= 20;
  }

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], width / 2, textStartY + i * lineHeight);
  }

  // 5. Citation / Reference (if provided)
  if (citation) {
    ctx.font = '22px "Thmanyah Sans", -apple-system, sans-serif';
    ctx.fillStyle = theme.subText;
    ctx.textBaseline = 'top';
    const citationY = Math.min(
      contentBottom - 35,
      textStartY + totalLinesHeight + 25
    );
    ctx.fillText(`— ${citation}`, width / 2, citationY);
  }

  // 6. Bottom Separator & Signature Footer
  const footerY = height - 90;

  // Subtle separator line with center ornament
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 220, footerY - 24);
  ctx.lineTo(width / 2 + 220, footerY - 24);
  ctx.stroke();

  // Central decorative diamond
  ctx.fillStyle = theme.outerBorder;
  ctx.beginPath();
  const dX = width / 2;
  const dY = footerY - 24;
  ctx.moveTo(dX, dY - 4);
  ctx.lineTo(dX + 4, dY);
  ctx.lineTo(dX, dY + 4);
  ctx.lineTo(dX - 4, dY);
  ctx.closePath();
  ctx.fill();

  // Formal Platform Signature
  ctx.font = 'bold 20px "Thmanyah Sans", -apple-system, sans-serif';
  ctx.fillStyle = theme.signature;
  ctx.textBaseline = 'middle';
  const signatureText = source
    ? `منصة السنة • ${source}`
    : 'منصة السنة النبوية الشريفة';
  ctx.fillText(signatureText, width / 2, footerY);

  ctx.restore();
}
