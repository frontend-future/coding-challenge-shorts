# Code Snippet Image

A tiny Node.js CLI that renders a code snippet into a ray.so-style image using Shiki + Puppeteer.

## Setup

```bash
npm install
```

## Usage

Render from a file:

```bash
node scripts/render-snippet.js --input ./example.js --lang js --theme nord --output out.png
```

Render from stdin:

```bash
cat ./example.js | node scripts/render-snippet.js --lang js --theme nord --output out.png
```

Optional flags:

```bash
node scripts/render-snippet.js \
  --input ./example.js \
  --lang js \
  --theme nord \
  --width 720 \
  --padding 64 \
  --background "radial-gradient(1200px circle at 10% 20%, #1f2937 0%, #0f172a 45%, #020617 100%)" \
  --font-size 16 \
  --scale 2 \
  --transparent-frame \
  --output out.png
```

## TODO

- [ ] add todo's
