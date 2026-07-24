# Arcade Sprite Lab

Client-side image → MakeCode Arcade sprite converter.

## Features

- Fit to Arcade width (160), height (120), keep original size, or set a custom size
- Nearest-neighbour for pixel art, progressive downscale for photos
- MakeCode Arcade 16-color palette (OKLab matching)
- Transparency: black → `.`, white → `.`, keep background, or edge flood fill
- Optional Floyd–Steinberg dithering
- Output: `hero.setImage(img\`...\`)` — replaces the image of an existing sprite in the project
- Runs entirely in the browser

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run start
```

## Railway

1. Create a new service from the GitHub repo.
2. If the app lives in a monorepo subfolder, set Root Directory to `makecode-sprite-converter`. For a dedicated repo, leave Root Directory empty.
3. Railway runs `npm run build` and `npm run start` from `railway.json`.
4. Node **20+** is required (Vite 8). The repo pins Node 22 via `.nvmrc`, `engines`, and `nixpacks.toml`.
5. Add a public domain under Settings → Networking.

No environment variables required.

### Embed on Kodland

Use `https://…` in `<embed src>`. The server must **not** send `frame-ancestors` /
`X-Frame-Options`: the platform nests embeds in a sandboxed iframe, and those
headers cause `ERR_BLOCKED_BY_RESPONSE` even with `frame-ancestors *`.

