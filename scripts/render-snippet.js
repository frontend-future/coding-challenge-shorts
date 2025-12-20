import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getHighlighter, bundledThemes, bundledLanguages } from "shiki";
import puppeteer from "puppeteer";

const DEFAULTS = {
  lang: "javascript",
  theme: "nord",
  width: 960,
  padding: 64,
  font: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  title: "snippet",
  output: "snippet.png",
  background: "radial-gradient(1200px circle at 10% 20%, #1f2937 0%, #0f172a 45%, #020617 100%)",
  scale: 2
};

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        opts[key] = true;
      } else {
        opts[key] = next;
        i += 1;
      }
    } else {
      opts._.push(arg);
    }
  }
  return opts;
}

function showHelp() {
  const lines = [
    "Usage:",
    "  node scripts/render-snippet.js --input <file> --output <file>",
    "  cat snippet.js | node scripts/render-snippet.js --lang js",
    "",
    "Options:",
    "  --input <path>     Read code from file (default: stdin)",
    "  --output <path>    Output image path (default: snippet.png)",
    "  --lang <id>        Language for highlighting (default: javascript)",
    "  --theme <id>       Shiki theme (default: nord)",
    "  --width <px>       Code frame width (default: 960)",
    "  --padding <px>     Canvas padding around frame (default: 64)",
    "  --background <css> Canvas background CSS (default: gradient)",
    "  --font <css>       Font-family for code (default: system monospace stack)",
    "  --font-size <px>  Code font size (default: 16)",
    "  --title <text>     Window title label (default: snippet)",
    "  --scale <number>   Device pixel ratio (default: 2)",
    "  --help             Show this help"
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
}

async function readInput(opts) {
  if (opts.input) {
    return fs.readFile(opts.input, "utf8");
  }
  if (opts._.length > 0) {
    return fs.readFile(opts._[0], "utf8");
  }
  if (process.stdin.isTTY) {
    throw new Error("No input provided. Use --input or pipe code via stdin.");
  }
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function toNumber(value, fallback) {
  if (value === undefined) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function estimateHeight({ lines, fontSize, lineHeight, chromeHeight, codePadding, canvasPadding }) {
  const codeHeight = lines * lineHeight + codePadding * 2;
  return Math.ceil(codeHeight + chromeHeight + canvasPadding * 2 + 40);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtml({
  codeHtml,
  width,
  padding,
  background,
  font,
  title,
  themeName,
  fontSize
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>snippet</title>
  <style>
    :root {
      --frame-radius: 16px;
      --frame-bg: #0b1120;
      --chrome-bg: linear-gradient(90deg, #0f172a 0%, #111827 100%);
      --chrome-border: rgba(148, 163, 184, 0.16);
      --shadow: 0 30px 60px rgba(2, 6, 23, 0.6);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0b1120;
      font-family: ${font};
    }
    .canvas {
      display: inline-block;
      padding: ${padding}px;
      background: ${background};
      border-radius: 28px;
    }
    .frame {
      width: ${width}px;
      background: var(--frame-bg);
      border-radius: var(--frame-radius);
      box-shadow: var(--shadow);
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .chrome {
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      background: var(--chrome-bg);
      border-bottom: 1px solid var(--chrome-border);
      color: #cbd5f5;
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .dots { display: flex; gap: 8px; }
    .dot { width: 10px; height: 10px; border-radius: 999px; }
    .dot.red { background: #f87171; }
    .dot.yellow { background: #facc15; }
    .dot.green { background: #4ade80; }
    .title { opacity: 0.7; }
    .code {
      padding: 24px;
      font-size: ${fontSize}px;
      line-height: 1.6;
      color: #e2e8f0;
    }
    .code pre,
    .code code {
      margin: 0;
      white-space: pre;
      font-family: inherit;
    }
    .code pre.shiki {
      background: transparent !important;
      padding: 0 !important;
    }
    .theme-label {
      margin-left: auto;
      opacity: 0.4;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="canvas">
    <div class="frame">
      <div class="chrome">
        <div class="dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="title">${escapeHtml(title)}</div>
        <div class="theme-label">${escapeHtml(themeName)}</div>
      </div>
      <div class="code">
        ${codeHtml}
      </div>
    </div>
  </div>
</body>
</html>`;
}

function resolveTheme(requested, fallback) {
  const available = Object.keys(bundledThemes);
  if (available.includes(requested)) return requested;
  if (available.includes(fallback)) return fallback;
  return available[0] || fallback;
}

function resolveLanguage(requested, fallback) {
  const available = Object.keys(bundledLanguages);
  const aliases = new Map([
    ["js", "javascript"],
    ["ts", "typescript"],
    ["py", "python"],
    ["rb", "ruby"],
    ["sh", "bash"]
  ]);
  const normalized = aliases.get(requested) || requested;
  if (available.includes(normalized)) return normalized;
  if (available.includes(fallback)) return fallback;
  return available[0] || fallback;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    showHelp();
    return;
  }

  const code = await readInput(opts);
  const requestedLang = opts.lang || DEFAULTS.lang;
  const requestedTheme = opts.theme || DEFAULTS.theme;
  const width = toNumber(opts.width, DEFAULTS.width);
  const padding = toNumber(opts.padding, DEFAULTS.padding);
  const font = opts.font || DEFAULTS.font;
  const title = opts.title || DEFAULTS.title;
  const background = opts.background || DEFAULTS.background;
  const output = opts.output || DEFAULTS.output;
  const scale = toNumber(opts.scale, DEFAULTS.scale);
  const fontSize = toNumber(opts["font-size"] || opts.fontSize || opts.fontsize, 16);

  const theme = resolveTheme(requestedTheme, DEFAULTS.theme);
  const lang = resolveLanguage(requestedLang, DEFAULTS.lang);
  if (requestedTheme && theme !== requestedTheme) {
    process.stderr.write(`Theme "${requestedTheme}" not found. Using "${theme}".\n`);
  }
  if (requestedLang && lang !== requestedLang) {
    process.stderr.write(`Language "${requestedLang}" not found. Using "${lang}".\n`);
  }

  const highlighter = await getHighlighter({ themes: [theme], langs: [lang] });
  const codeHtml = highlighter.codeToHtml(code, { lang, theme });

  const lineCount = code.split("\n").length;
  const lineHeight = fontSize * 1.6;
  const estimatedHeight = estimateHeight({
    lines: lineCount,
    fontSize,
    lineHeight,
    chromeHeight: 40,
    codePadding: 24,
    canvasPadding: padding
  });

  const browser = await puppeteer.launch({
    headless: "new"
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: Math.max(width + padding * 2, 320),
      height: Math.max(estimatedHeight, 480),
      deviceScaleFactor: scale
    });

    const html = buildHtml({
      codeHtml,
      width,
      padding,
      background,
      font,
      title,
      themeName: theme,
      fontSize
    });

    await page.setContent(html, { waitUntil: "load" });

    const clip = await page.evaluate(() => {
      const frame = document.querySelector(".frame");
      if (!frame) return null;
      const rect = frame.getBoundingClientRect();
      return {
        x: Math.floor(rect.x),
        y: Math.floor(rect.y),
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height)
      };
    });

    if (!clip) {
      throw new Error("Failed to locate canvas for screenshot.");
    }

    await fs.mkdir(path.dirname(output), { recursive: true });
    await page.screenshot({ path: output, clip });
  } finally {
    await browser.close();
  }

  process.stdout.write(`Wrote ${output}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
