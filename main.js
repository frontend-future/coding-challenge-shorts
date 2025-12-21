// import fs from "node:fs/promises";
// import path from "node:path";
// import process from "node:process";
// import { generateText } from "ai";
// import { openai } from "@ai-sdk/openai";
// import { getHighlighter, bundledThemes, bundledLanguages } from "shiki";
// import puppeteer from "puppeteer";
// import ffmpeg from "fluent-ffmpeg";
// import dotenv from "dotenv";
// dotenv.config();

// const DEFAULTS = {
//   theme: "nord",
//   width: 720,
//   padding: 64,
//   font: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
//   background: "radial-gradient(1200px circle at 10% 20%, #1f2937 0%, #0f172a 45%, #020617 100%)",
//   scale: 2,
//   fontSize: 18,
//   videoDuration: 10
// };

// const PROMPT = `You are helping me produce viral Instagram Reels for the brand @frontendfuture.

// 🎯 GOAL
// Generate 1 mini coding reel idea where:
// - shows a short JavaScript snippet
// - asks "What is the output?"
// - creates curiosity and comments
// - DO NOT reveal the correct answer anywhere

// 🧩 CODE SNIPPET REQUIREMENTS
// - Write a 3–5 line JavaScript snippet
// - Must include at least one console.log(...)
// - Must be curiosity-driven
// - Prefer interesting quirks:
//   * arrays
//   * objects
//   * numbers
//   * type coercion
//   * loops or conditions
//   * Math quirks
//   * conversions

// 📦 OUTPUT FORMAT
// Respond with ONLY valid JSON in this exact format (no markdown, no backticks):
// {
//   "difficulty": "EASY" | "MEDIUM" | "HARD",
//   "code": "the JavaScript code snippet",
//   "caption": "What is the output? Drop your guess below.\\n\\nWant free remote income coding training? Comment FREE TRAINING below. You must be following @frontendfuture or we cannot send it."
// }

// IMPORTANT:
// - Return ONLY the JSON object
// - No markdown code blocks
// - No explanations
// - No revealing the answer
// - Code should be clean and properly formatted`;

// async function generateSnippetWithAI(index) {
//   if (!process.env.OPENAI_API_KEY) {
//     throw new Error("Missing OPENAI_API_KEY");
//   }

//   console.log(`Generating snippet ${index + 1}...`);

//   const response = await generateText({
//     model: openai("gpt-4o"),
//     prompt: PROMPT,
//     maxTokens: 500,
//     temperature: 0.9
//   });

//   // Clean the response - remove any markdown code blocks
//   let cleanText = response.text.trim();
//   cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
//   const snippet = JSON.parse(cleanText);
//   return snippet;
// }

// async function renderSnippet(code, difficulty, outputPath, browser) {
//   const highlighter = await getHighlighter({ 
//     themes: ["nord"], 
//     langs: ["javascript"] 
//   });
  
//   const codeHtml = highlighter.codeToHtml(code, { 
//     lang: "javascript", 
//     theme: "nord" 
//   });

//   const lineCount = code.split("\n").length;
//   const lineHeight = DEFAULTS.fontSize * 1.6;
//   const estimatedHeight = estimateHeight({
//     lines: lineCount,
//     fontSize: DEFAULTS.fontSize,
//     lineHeight,
//     chromeHeight: 40,
//     codePadding: 24,
//     canvasPadding: DEFAULTS.padding
//   });

//   const page = await browser.newPage();
//   await page.setViewport({
//     width: Math.max(DEFAULTS.width + DEFAULTS.padding * 2, 320),
//     height: Math.max(estimatedHeight + 200, 600),
//     deviceScaleFactor: DEFAULTS.scale
//   });

//   const html = buildHtml({
//     codeHtml,
//     width: DEFAULTS.width,
//     padding: DEFAULTS.padding,
//     background: DEFAULTS.background,
//     font: DEFAULTS.font,
//     fontSize: DEFAULTS.fontSize,
//     difficulty
//   });

//   await page.setContent(html, { waitUntil: "load" });
//   await page.screenshot({ path: outputPath, fullPage: false });
//   await page.close();

//   console.log(`  ✓ Rendered: ${outputPath}`);
// }

// function estimateHeight({ lines, fontSize, lineHeight, chromeHeight, codePadding, canvasPadding }) {
//   const codeHeight = lines * lineHeight + codePadding * 2;
//   return Math.ceil(codeHeight + chromeHeight + canvasPadding * 2 + 100);
// }

// function buildHtml({ codeHtml, width, padding, background, font, fontSize, difficulty }) {
//   return `<!doctype html>
// <html lang="en">
// <head>
//   <meta charset="utf-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1" />
//   <title>snippet</title>
//   <style>
//     :root {
//       --frame-radius: 16px;
//       --frame-bg: #0b1120;
//       --chrome-bg: linear-gradient(90deg, #0f172a 0%, #111827 100%);
//       --chrome-border: rgba(148, 163, 184, 0.16);
//       --shadow: 0 30px 60px rgba(2, 6, 23, 0.6);
//     }
//     * { box-sizing: border-box; }
//     body {
//       margin: 0;
//       min-height: 100vh;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       flex-direction: column;
//       gap: 48px;
//       background: ${background};
//       font-family: ${font};
//       padding: ${padding}px;
//     }
//     .header {
//       text-align: center;
//       color: #e2e8f0;
//     }
//     .header h1 {
//       font-size: 48px;
//       font-weight: 700;
//       margin: 0 0 16px 0;
//       letter-spacing: -0.02em;
//     }
//     .level {
//       font-size: 24px;
//       font-weight: 600;
//       color: #818cf8;
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//     }
//     .frame {
//       width: ${width}px;
//       background: var(--frame-bg);
//       border-radius: var(--frame-radius);
//       box-shadow: var(--shadow);
//       overflow: hidden;
//       border: 1px solid rgba(148, 163, 184, 0.18);
//     }
//     .chrome {
//       height: 40px;
//       display: flex;
//       align-items: center;
//       padding: 0 16px;
//       gap: 12px;
//       background: var(--chrome-bg);
//       border-bottom: 1px solid var(--chrome-border);
//       color: #cbd5f5;
//       font-size: 12px;
//       letter-spacing: 0.06em;
//       text-transform: uppercase;
//     }
//     .dots { display: flex; gap: 8px; }
//     .dot { width: 10px; height: 10px; border-radius: 999px; }
//     .dot.red { background: #f87171; }
//     .dot.yellow { background: #facc15; }
//     .dot.green { background: #4ade80; }
//     .code {
//       padding: 32px;
//       font-size: ${fontSize}px;
//       line-height: 1.6;
//       color: #e2e8f0;
//     }
//     .code pre,
//     .code code {
//       margin: 0;
//       white-space: pre;
//       font-family: inherit;
//     }
//     .code pre.shiki {
//       background: transparent !important;
//       padding: 0 !important;
//     }
//   </style>
// </head>
// <body>
//   <div class="header">
//     <h1>What Is The Output?</h1>
//     <div class="level">Level: ${difficulty}</div>
//   </div>
//   <div class="frame">
//     <div class="chrome">
//       <div class="dots">
//         <span class="dot red"></span>
//         <span class="dot yellow"></span>
//         <span class="dot green"></span>
//       </div>
//     </div>
//     <div class="code">
//       ${codeHtml}
//     </div>
//   </div>
// </body>
// </html>`;
// }

// async function createVideoFromImage(imagePath, outputVideo, duration) {
//   console.log("\nCreating video from image...");
  
//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(imagePath)
//       .loop(duration) // Loop the image for the specified duration
//       .inputOptions(['-framerate 30'])
//       .outputOptions([
//         '-c:v libx264',
//         '-t ' + duration,
//         '-pix_fmt yuv420p',
//         '-preset medium',
//         '-crf 23'
//       ])
//       .output(outputVideo)
//       .on('start', (commandLine) => {
//         console.log('FFmpeg command:', commandLine);
//       })
//       .on('progress', (progress) => {
//         if (progress.percent) {
//           process.stdout.write(`\rProgress: ${Math.round(progress.percent)}%`);
//         }
//       })
//       .on('end', () => {
//         console.log(`\n✓ Video created: ${outputVideo}`);
//         resolve();
//       })
//       .on('error', (err) => {
//         console.error('\nFFmpeg error:', err.message);
//         reject(new Error('Failed to create video. Make sure ffmpeg is installed.'));
//       })
//       .run();
//   });
// }

// async function main() {
//   const outputDir = "./output";
//   const imagePath = path.join(outputDir, "snippet.png");
//   const videoPath = path.join(outputDir, "reel.mp4");
//   const captionPath = path.join(outputDir, "caption.txt");

//   // Create output directory
//   await fs.mkdir(outputDir, { recursive: true });

//   const duration = DEFAULTS.videoDuration; // 1 minute

//   console.log(`Generating 1 code snippet for a ${duration}s video...\n`);

//   const browser = await puppeteer.launch({ headless: "new" });

//   try {
//     // Generate single snippet
//     const snippet = await generateSnippetWithAI(0);
    
//     // Render the image
//     await renderSnippet(snippet.code, snippet.difficulty, imagePath, browser);

//     // Save caption to file
//     const captionContent = 
//       `==================== REEL ====================\n` +
//       `DIFFICULTY: ${snippet.difficulty}\n\n` +
//       `CODE:\n${snippet.code}\n\n` +
//       `CAPTION:\n${snippet.caption}\n`;
    
//     await fs.writeFile(captionPath, captionContent);
//     console.log(`✓ Caption saved: ${captionPath}`);

//     // Create video from the single image
//     await createVideoFromImage(imagePath, videoPath, duration);

//     console.log("\n" + "=".repeat(60));
//     console.log("✨ ALL DONE!");
//     console.log("=".repeat(60));
//     console.log(`Video: ${videoPath}`);
//     console.log(`Caption: ${captionPath}`);
//     console.log(`Image: ${imagePath}`);
//   } finally {
//     await browser.close();
//   }
// }

// main().catch((err) => {
//   console.error("Error:", err.message);
//   process.exit(1);
// });


import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getHighlighter, bundledThemes, bundledLanguages } from "shiki";
import puppeteer from "puppeteer";
import ffmpeg from "fluent-ffmpeg";
import dotenv from "dotenv";
dotenv.config();

const DEFAULTS = {
  theme: "nord",
  width: 1080,  // Instagram Reel width
  height: 1920, // Instagram Reel height (9:16 aspect ratio)
  padding: 80,
  font: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  background: "radial-gradient(1200px circle at 10% 20%, #1f2937 0%, #0f172a 45%, #020617 100%)",
  scale: 2,
  fontSize: 24,
  videoDuration: 10
};

const PROMPT = `You are helping me produce viral Instagram Reels for the brand @frontendfuture.

🎯 GOAL
Generate 1 mini coding reel idea where:
- shows a short JavaScript snippet
- asks "What is the output?"
- creates curiosity and comments
- DO NOT reveal the correct answer anywhere

🧩 CODE SNIPPET REQUIREMENTS
- Write a 3–5 line JavaScript snippet
- Must include at least one console.log(...)
- Must be curiosity-driven
- Prefer interesting quirks:
  * arrays
  * objects
  * numbers
  * type coercion
  * loops or conditions
  * Math quirks
  * conversions

📦 OUTPUT FORMAT
Respond with ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "code": "the JavaScript code snippet",
  "caption": "What is the output? Drop your guess below.\\n\\nWant free remote income coding training? Comment FREE TRAINING below. You must be following @frontendfuture or we cannot send it."
}

IMPORTANT:
- Return ONLY the JSON object
- No markdown code blocks
- No explanations
- No revealing the answer
- Code should be clean and properly formatted`;

function getTimestampedFolder() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `output_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

async function generateSnippetWithAI(index) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  console.log(`Generating snippet ${index + 1}...`);

  const response = await generateText({
    model: openai("gpt-4o"),
    prompt: PROMPT,
    maxTokens: 500,
    temperature: 0.9
  });

  // Clean the response - remove any markdown code blocks
  let cleanText = response.text.trim();
  cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const snippet = JSON.parse(cleanText);
  return snippet;
}

async function renderSnippet(code, difficulty, outputPath, browser) {
  const highlighter = await getHighlighter({ 
    themes: ["nord"], 
    langs: ["javascript"] 
  });
  
  const codeHtml = highlighter.codeToHtml(code, { 
    lang: "javascript", 
    theme: "nord" 
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: DEFAULTS.width,
    height: DEFAULTS.height,
    deviceScaleFactor: DEFAULTS.scale
  });

  const html = buildHtml({
    codeHtml,
    width: DEFAULTS.width,
    height: DEFAULTS.height,
    padding: DEFAULTS.padding,
    background: DEFAULTS.background,
    font: DEFAULTS.font,
    fontSize: DEFAULTS.fontSize,
    difficulty
  });

  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: outputPath, fullPage: false });
  await page.close();

  console.log(`  ✓ Rendered: ${outputPath}`);
}

function buildHtml({ codeHtml, width, height, padding, background, font, fontSize, difficulty }) {
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
      width: ${width}px;
      height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 60px;
      background: ${background};
      font-family: ${font};
      padding: ${padding}px;
    }
    .header {
      text-align: center;
      color: #e2e8f0;
    }
    .header h1 {
      font-size: 64px;
      font-weight: 700;
      margin: 0 0 24px 0;
      letter-spacing: -0.02em;
    }
    .level {
      font-size: 32px;
      font-weight: 600;
      color: #818cf8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .frame {
      width: ${width - padding * 2}px;
      background: var(--frame-bg);
      border-radius: var(--frame-radius);
      box-shadow: var(--shadow);
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .chrome {
      height: 50px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 16px;
      background: var(--chrome-bg);
      border-bottom: 1px solid var(--chrome-border);
      color: #cbd5f5;
      font-size: 14px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .dots { display: flex; gap: 10px; }
    .dot { width: 14px; height: 14px; border-radius: 999px; }
    .dot.red { background: #f87171; }
    .dot.yellow { background: #facc15; }
    .dot.green { background: #4ade80; }
    .code {
      padding: 40px;
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
  </style>
</head>
<body>
  <div class="header">
    <h1>What Is The Output?</h1>
    <div class="level">Level: ${difficulty}</div>
  </div>
  <div class="frame">
    <div class="chrome">
      <div class="dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
    </div>
    <div class="code">
      ${codeHtml}
    </div>
  </div>
</body>
</html>`;
}

async function createVideoFromImage(imagePath, outputVideo, duration) {
  console.log("\nCreating video from image...");
  
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .loop(duration)
      .inputOptions(['-framerate 30'])
      .outputOptions([
        '-c:v libx264',
        '-t ' + duration,
        '-pix_fmt yuv420p',
        '-vf scale=1080:1920', // Ensure 9:16 aspect ratio
        '-preset medium',
        '-crf 23'
      ])
      .output(outputVideo)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\rProgress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`\n✓ Video created: ${outputVideo}`);
        resolve();
      })
      .on('error', (err) => {
        console.error('\nFFmpeg error:', err.message);
        reject(new Error('Failed to create video. Make sure ffmpeg is installed.'));
      })
      .run();
  });
}

async function main() {
  const outputDir = `./${getTimestampedFolder()}`;
  const imagePath = path.join(outputDir, "snippet.png");
  const videoPath = path.join(outputDir, "reel.mp4");
  const captionPath = path.join(outputDir, "caption.txt");

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`\n📁 Output directory: ${outputDir}\n`);

  const duration = DEFAULTS.videoDuration;

  console.log(`Generating 1 code snippet for a ${duration}s video...\n`);

  const browser = await puppeteer.launch({ headless: "new" });

  try {
    // Generate single snippet
    const snippet = await generateSnippetWithAI(0);
    
    // Render the image
    await renderSnippet(snippet.code, snippet.difficulty, imagePath, browser);

    // Save caption to file
    const captionContent = 
      `==================== REEL ====================\n` +
      `DIFFICULTY: ${snippet.difficulty}\n\n` +
      `CODE:\n${snippet.code}\n\n` +
      `CAPTION:\n${snippet.caption}\n`;
    
    await fs.writeFile(captionPath, captionContent);
    console.log(`✓ Caption saved: ${captionPath}`);

    // Create video from the single image
    await createVideoFromImage(imagePath, videoPath, duration);

    console.log("\n" + "=".repeat(60));
    console.log("✨ ALL DONE!");
    console.log("=".repeat(60));
    console.log(`📁 Folder: ${outputDir}`);
    console.log(`🎥 Video: ${videoPath}`);
    console.log(`📝 Caption: ${captionPath}`);
    console.log(`🖼️  Image: ${imagePath}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});