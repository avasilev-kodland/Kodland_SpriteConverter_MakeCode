export type SizeMode = 'fit-width' | 'fit-height' | 'original' | 'custom'

export type TransparencyMode = 'none' | 'black' | 'white' | 'auto-edge'

export type ConverterOptions = {
  sizeMode: SizeMode
  /** Used by custom mode. */
  width: number
  height: number
  transparency: TransparencyMode
  /** Distance threshold for black/white transparency and auto-edge flood fill. */
  backgroundTolerance: number
  dither: boolean
  variableName: string
}

export type ConversionResult = {
  code: string
  canvas: HTMLCanvasElement
  transparentPixels: number
  width: number
  height: number
}

type ArcadeColor = {
  symbol: string
  red: number
  green: number
  blue: number
  linear: [number, number, number]
  oklab: [number, number, number]
}

type PaletteSeed = {
  symbol: string
  red: number
  green: number
  blue: number
}

/** MakeCode Arcade screen size used by fit-width / fit-height modes. */
export const ARCADE_WIDTH = 160
export const ARCADE_HEIGHT = 120
export const MAX_SIZE = 500
export const MIN_SIZE = 1

// Index 0 is transparent in MakeCode; opaque palette starts at 1.
const PALETTE_SEED: readonly PaletteSeed[] = [
  { symbol: '1', red: 255, green: 255, blue: 255 },
  { symbol: '2', red: 255, green: 33, blue: 33 },
  { symbol: '3', red: 255, green: 147, blue: 196 },
  { symbol: '4', red: 255, green: 129, blue: 53 },
  { symbol: '5', red: 255, green: 246, blue: 9 },
  { symbol: '6', red: 36, green: 156, blue: 163 },
  { symbol: '7', red: 120, green: 220, blue: 82 },
  { symbol: '8', red: 0, green: 63, blue: 173 },
  { symbol: '9', red: 135, green: 242, blue: 255 },
  { symbol: 'a', red: 142, green: 46, blue: 196 },
  { symbol: 'b', red: 164, green: 131, blue: 159 },
  { symbol: 'c', red: 92, green: 64, blue: 108 },
  { symbol: 'd', red: 229, green: 205, blue: 196 },
  { symbol: 'e', red: 145, green: 70, blue: 61 },
  { symbol: 'f', red: 0, green: 0, blue: 0 },
]

const PALETTE: readonly ArcadeColor[] = PALETTE_SEED.map((seed) => {
  const linear: [number, number, number] = [
    srgbToLinear(seed.red),
    srgbToLinear(seed.green),
    srgbToLinear(seed.blue),
  ]
  return { ...seed, linear, oklab: linearToOklab(linear[0], linear[1], linear[2]) }
})

const TRANSPARENT_SYMBOL = '.'
const ALPHA_THRESHOLD = 16

export function sanitizeVariableName(value: string): string {
  const normalized = value.trim().replace(/[^\p{L}\p{N}_$]/gu, '_')
  if (!normalized) return 'mySprite'
  return /^[\p{L}_$]/u.test(normalized) ? normalized : `sprite_${normalized}`
}

export function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return 24
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)))
}

export function resolveTargetSize(
  sourceWidth: number,
  sourceHeight: number,
  options: Pick<ConverterOptions, 'sizeMode' | 'width' | 'height'>,
): { width: number; height: number } {
  const safeSourceWidth = Math.max(1, sourceWidth)
  const safeSourceHeight = Math.max(1, sourceHeight)

  switch (options.sizeMode) {
    case 'original':
      return {
        width: clampDimension(safeSourceWidth),
        height: clampDimension(safeSourceHeight),
      }
    case 'fit-width': {
      const factor = ARCADE_WIDTH / safeSourceWidth
      return {
        width: ARCADE_WIDTH,
        height: clampDimension(safeSourceHeight * factor),
      }
    }
    case 'fit-height': {
      const factor = ARCADE_HEIGHT / safeSourceHeight
      return {
        width: clampDimension(safeSourceWidth * factor),
        height: ARCADE_HEIGHT,
      }
    }
    case 'custom':
    default:
      return {
        width: clampDimension(options.width),
        height: clampDimension(options.height),
      }
  }
}

export function convertImage(
  image: HTMLImageElement,
  options: ConverterOptions,
): ConversionResult {
  const { width, height } = resolveTargetSize(
    image.naturalWidth,
    image.naturalHeight,
    options,
  )

  const pixels = renderToTarget(image, width, height)
  const mask = detectTransparency(
    pixels,
    width,
    height,
    options.transparency,
    options.backgroundTolerance,
  )
  const { symbols, preview, transparentPixels } = quantize(
    pixels,
    width,
    height,
    mask,
    options.dither,
  )

  const rows: string[] = []
  for (let y = 0; y < height; y += 1) {
    rows.push(`    ${symbols.slice(y * width, y * width + width).join(' ')}`)
  }

  const previewCanvas = createCanvas(width, height)
  getContext(previewCanvas).putImageData(preview, 0, 0)

  const variableName = sanitizeVariableName(options.variableName)
  const code = `let ${variableName} = sprites.create(img\`\n${rows.join('\n')}\n\`, SpriteKind.Player)`

  return { code, canvas: previewCanvas, transparentPixels, width, height }
}

/**
 * Draws the source into the target size.
 * Pixel-art / near-1:1 → nearest-neighbour.
 * Large photo downscales → progressive area-like filtering.
 * Modes stretch to the exact target size.
 */
function renderToTarget(
  image: HTMLImageElement,
  width: number,
  height: number,
): ImageData {
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
  const scaleX = width / sourceWidth
  const scaleY = height / sourceHeight
  const isPixelArtLike = detectPixelArtLikeness(image)
  const nearlyNative =
    Math.abs(scaleX - 1) < 0.08 && Math.abs(scaleY - 1) < 0.08
  const useNearest =
    isPixelArtLike || nearlyNative || (scaleX >= 0.85 && scaleY >= 0.85)

  const scaled = scaleImage(image, width, height, useNearest)
  return getContext(scaled).getImageData(0, 0, width, height)
}

function scaleImage(
  source: CanvasImageSource,
  width: number,
  height: number,
  nearest: boolean,
): HTMLCanvasElement {
  if (nearest) {
    const canvas = createCanvas(width, height)
    const context = getContext(canvas)
    context.imageSmoothingEnabled = false
    context.drawImage(source, 0, 0, width, height)
    return canvas
  }

  // Progressive halving ≈ area filter; keeps photo detail when shrinking a lot.
  let current =
    source instanceof HTMLCanvasElement
      ? source
      : (() => {
          const canvas = createCanvas(
            (source as HTMLImageElement).naturalWidth ||
              (source as HTMLImageElement).width,
            (source as HTMLImageElement).naturalHeight ||
              (source as HTMLImageElement).height,
          )
          drawSmooth(
            getContext(canvas),
            source,
            canvas.width,
            canvas.height,
          )
          return canvas
        })()

  let currentWidth = current.width
  let currentHeight = current.height

  while (currentWidth > width * 2 || currentHeight > height * 2) {
    const nextWidth = Math.max(width, Math.floor(currentWidth / 2))
    const nextHeight = Math.max(height, Math.floor(currentHeight / 2))
    const next = createCanvas(nextWidth, nextHeight)
    drawSmooth(getContext(next), current, nextWidth, nextHeight)
    current = next
    currentWidth = nextWidth
    currentHeight = nextHeight
  }

  const finalCanvas = createCanvas(width, height)
  drawSmooth(getContext(finalCanvas), current, width, height)
  return finalCanvas
}

/**
 * Heuristic: already-pixel images (few colours, small-ish) should never be
 * blurred by bicubic downscaling.
 */
function detectPixelArtLikeness(image: HTMLImageElement): boolean {
  const sampleSize = 64
  const canvas = createCanvas(sampleSize, sampleSize)
  const context = getContext(canvas)
  context.imageSmoothingEnabled = false
  context.drawImage(image, 0, 0, sampleSize, sampleSize)
  const data = context.getImageData(0, 0, sampleSize, sampleSize).data
  const colours = new Set<number>()

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_THRESHOLD) continue
    // Quantise to 5 bits/channel to absorb JPEG noise on flat pixel art.
    const key =
      ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3)
    colours.add(key)
    if (colours.size > 48) return false
  }

  const maxSide = Math.max(image.naturalWidth, image.naturalHeight)
  return colours.size <= 48 && maxSide <= 512
}

function detectTransparency(
  pixels: ImageData,
  width: number,
  height: number,
  mode: TransparencyMode,
  tolerance: number,
): Uint8Array {
  const data = pixels.data
  const mask = new Uint8Array(width * height)

  for (let i = 0; i < mask.length; i += 1) {
    if (data[i * 4 + 3] < ALPHA_THRESHOLD) mask[i] = 1
  }

  if (mode === 'none') return mask

  if (mode === 'black' || mode === 'white') {
    const target: [number, number, number] =
      mode === 'black' ? [0, 0, 0] : [255, 255, 255]
    const toleranceSquared = tolerance * tolerance
    for (let i = 0; i < mask.length; i += 1) {
      if (mask[i]) continue
      if (withinTolerance(data, i, target, toleranceSquared)) mask[i] = 1
    }
    return mask
  }

  // auto-edge: flood fill from borders (safe for solid studio backgrounds).
  const reference = averageBorderColor(data, width, height, mask)
  if (!reference) return mask

  const toleranceSquared = tolerance * tolerance
  const stack: number[] = []

  const trySeed = (index: number): void => {
    if (mask[index]) return
    if (withinTolerance(data, index, reference, toleranceSquared)) {
      mask[index] = 1
      stack.push(index)
    }
  }

  for (let x = 0; x < width; x += 1) {
    trySeed(x)
    trySeed((height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    trySeed(y * width)
    trySeed(y * width + width - 1)
  }

  while (stack.length > 0) {
    const index = stack.pop() as number
    const x = index % width
    const y = (index - x) / width
    if (x > 0) trySeed(index - 1)
    if (x < width - 1) trySeed(index + 1)
    if (y > 0) trySeed(index - width)
    if (y < height - 1) trySeed(index + width)
  }

  return mask
}

function quantize(
  pixels: ImageData,
  width: number,
  height: number,
  mask: Uint8Array,
  dither: boolean,
): { symbols: string[]; preview: ImageData; transparentPixels: number } {
  const data = pixels.data
  const linear = new Float32Array(width * height * 3)
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) continue
    linear[i * 3] = srgbToLinear(data[i * 4])
    linear[i * 3 + 1] = srgbToLinear(data[i * 4 + 1])
    linear[i * 3 + 2] = srgbToLinear(data[i * 4 + 2])
  }

  const symbols = new Array<string>(width * height)
  const preview = new ImageData(width, height)
  let transparentPixels = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      const previewOffset = index * 4

      if (mask[index]) {
        symbols[index] = TRANSPARENT_SYMBOL
        preview.data[previewOffset + 3] = 0
        transparentPixels += 1
        continue
      }

      const red = clamp01(linear[index * 3])
      const green = clamp01(linear[index * 3 + 1])
      const blue = clamp01(linear[index * 3 + 2])
      const color = nearestColor(red, green, blue)

      symbols[index] = color.symbol
      preview.data[previewOffset] = color.red
      preview.data[previewOffset + 1] = color.green
      preview.data[previewOffset + 2] = color.blue
      preview.data[previewOffset + 3] = 255

      if (dither) {
        diffuseError(linear, mask, width, height, x, y, [
          red - color.linear[0],
          green - color.linear[1],
          blue - color.linear[2],
        ])
      }
    }
  }

  return { symbols, preview, transparentPixels }
}

function diffuseError(
  linear: Float32Array,
  mask: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  error: [number, number, number],
): void {
  const spread = (nx: number, ny: number, factor: number): void => {
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) return
    const index = ny * width + nx
    if (mask[index]) return
    linear[index * 3] += error[0] * factor
    linear[index * 3 + 1] += error[1] * factor
    linear[index * 3 + 2] += error[2] * factor
  }

  spread(x + 1, y, 7 / 16)
  spread(x - 1, y + 1, 3 / 16)
  spread(x, y + 1, 5 / 16)
  spread(x + 1, y + 1, 1 / 16)
}

function nearestColor(red: number, green: number, blue: number): ArcadeColor {
  const [targetL, targetA, targetB] = linearToOklab(red, green, blue)
  let nearest = PALETTE[0]
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const color of PALETTE) {
    const deltaL = targetL - color.oklab[0]
    const deltaA = targetA - color.oklab[1]
    const deltaB = targetB - color.oklab[2]
    const distance = deltaL * deltaL + deltaA * deltaA + deltaB * deltaB
    if (distance < nearestDistance) {
      nearest = color
      nearestDistance = distance
    }
  }

  return nearest
}

function averageBorderColor(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mask: Uint8Array,
): [number, number, number] | null {
  let red = 0
  let green = 0
  let blue = 0
  let count = 0

  const sample = (index: number): void => {
    if (mask[index]) return
    red += data[index * 4]
    green += data[index * 4 + 1]
    blue += data[index * 4 + 2]
    count += 1
  }

  for (let x = 0; x < width; x += 1) {
    sample(x)
    sample((height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    sample(y * width)
    sample(y * width + width - 1)
  }

  if (count === 0) return null
  return [red / count, green / count, blue / count]
}

function withinTolerance(
  data: Uint8ClampedArray,
  index: number,
  reference: [number, number, number],
  toleranceSquared: number,
): boolean {
  const red = data[index * 4] - reference[0]
  const green = data[index * 4 + 1] - reference[1]
  const blue = data[index * 4 + 2] - reference[2]
  return red * red + green * green + blue * blue <= toleranceSquared
}

function drawSmooth(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
): void {
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, width, height)
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Браузер не поддерживает Canvas 2D.')
  return context
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function srgbToLinear(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function linearToOklab(
  red: number,
  green: number,
  blue: number,
): [number, number, number] {
  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue

  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)

  return [
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  ]
}
