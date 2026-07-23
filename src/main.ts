import './style.css'
import {
  ARCADE_HEIGHT,
  ARCADE_WIDTH,
  clampDimension,
  convertImage,
  resolveTargetSize,
  type ConversionResult,
  type SizeMode,
  type TransparencyMode,
} from './converter'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="topbar">
    <a class="brand" href="/" aria-label="Arcade Sprite Lab">
      <span class="brand-mark" aria-hidden="true">A</span>
      <span>Arcade Sprite Lab</span>
    </a>
  </header>

  <main>
    <section class="intro">
      <h1>Image to MakeCode Arcade sprite</h1>
    </section>

    <section class="workspace">
      <div class="panel controls-panel">
        <label class="dropzone" id="dropzone" for="file-input">
          <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" />
          <span class="upload-icon" aria-hidden="true">↑</span>
          <strong>Choose image</strong>
          <span>or drop a PNG here</span>
          <small>PNG, JPG or WebP · up to 10 MB</small>
        </label>

        <div class="settings" aria-disabled="true" inert id="settings">
          <div class="field-group">
            <div class="field-label">
              <label>Sprite size</label>
              <span id="resolved-size">${ARCADE_WIDTH}×…</span>
            </div>
            <div class="size-options mode-options" role="group" aria-label="Size mode">
              <button type="button" class="is-active" data-mode="fit-width">Fit width ${ARCADE_WIDTH}</button>
              <button type="button" data-mode="fit-height">Fit height ${ARCADE_HEIGHT}</button>
              <button type="button" data-mode="original">Original</button>
              <button type="button" data-mode="custom">Custom size</button>
            </div>
          </div>

          <div class="field-grid custom-only" id="custom-size-fields" hidden>
            <label>
              Width
              <input id="width" type="number" min="1" max="500" value="160" inputmode="numeric" />
            </label>
            <label>
              Height
              <input id="height" type="number" min="1" max="500" value="120" inputmode="numeric" />
            </label>
          </div>

          <div class="field-grid single-field">
            <label>
              Sprite name
              <input id="variable-name" type="text" value="mySprite" spellcheck="false" />
            </label>
          </div>

          <div class="field-group">
            <div class="field-label">
              <label>Transparency</label>
            </div>
            <div class="size-options transparency-options" role="group" aria-label="Transparency">
              <button type="button" class="is-active" data-transparency="black">Black → .</button>
              <button type="button" data-transparency="white">White → .</button>
              <button type="button" data-transparency="none">Keep background</button>
              <button type="button" data-transparency="auto-edge">Edge flood fill</button>
            </div>
          </div>

          <label class="range-field">
            <span>
              Background sensitivity
              <output id="tolerance-value">40</output>
            </span>
            <input id="tolerance" type="range" min="0" max="180" value="40" />
          </label>

          <label class="toggle-row">
            <span>
              <strong>Dithering</strong>
            </span>
            <input id="dither" type="checkbox" />
          </label>
        </div>
      </div>

      <div class="panel result-panel">
        <div class="preview-grid">
          <figure>
            <figcaption>Source</figcaption>
            <div class="preview-stage">
              <span class="empty-preview" id="original-empty">Upload an image</span>
              <img id="original-preview" alt="Uploaded image" hidden />
            </div>
          </figure>
          <figure>
            <figcaption>
              Sprite
              <span id="sprite-meta">—</span>
            </figcaption>
            <div class="preview-stage pixel-stage" id="sprite-preview">
              <span class="empty-preview">Sprite preview</span>
            </div>
          </figure>
        </div>

        <div class="code-section">
          <div class="code-heading">
            <h2>MakeCode code</h2>
            <span class="code-status" id="code-status">Upload an image first</span>
          </div>
          <textarea id="code-output" readonly spellcheck="false" aria-label="MakeCode code"></textarea>
          <button class="primary-button" id="copy-button" type="button" disabled>
            Copy code
          </button>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <span>Arcade Sprite Lab</span>
  </footer>
`

const fileInput = getElement<HTMLInputElement>('file-input')
const dropzone = getElement<HTMLLabelElement>('dropzone')
const settings = getElement<HTMLDivElement>('settings')
const widthInput = getElement<HTMLInputElement>('width')
const heightInput = getElement<HTMLInputElement>('height')
const variableInput = getElement<HTMLInputElement>('variable-name')
const ditherInput = getElement<HTMLInputElement>('dither')
const toleranceInput = getElement<HTMLInputElement>('tolerance')
const toleranceValue = getElement<HTMLOutputElement>('tolerance-value')
const customSizeFields = getElement<HTMLDivElement>('custom-size-fields')
const resolvedSize = getElement<HTMLSpanElement>('resolved-size')
const originalPreview = getElement<HTMLImageElement>('original-preview')
const originalEmpty = getElement<HTMLSpanElement>('original-empty')
const spritePreview = getElement<HTMLDivElement>('sprite-preview')
const spriteMeta = getElement<HTMLSpanElement>('sprite-meta')
const codeOutput = getElement<HTMLTextAreaElement>('code-output')
const copyButton = getElement<HTMLButtonElement>('copy-button')
const codeStatus = getElement<HTMLSpanElement>('code-status')
const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'))
const transparencyButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('[data-transparency]'),
)

let image: HTMLImageElement | null = null
let objectUrl: string | null = null
let latestResult: ConversionResult | null = null
let sizeMode: SizeMode = 'fit-width'
let transparency: TransparencyMode = 'black'

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0]
  if (file) void loadFile(file)
})

for (const eventName of ['dragenter', 'dragover']) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault()
    dropzone.classList.add('is-dragging')
  })
}

for (const eventName of ['dragleave', 'drop']) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault()
    dropzone.classList.remove('is-dragging')
  })
}

dropzone.addEventListener('drop', (event) => {
  const file = event.dataTransfer?.files[0]
  if (file) void loadFile(file)
})

for (const button of modeButtons) {
  button.addEventListener('click', () => {
    sizeMode = button.dataset.mode as SizeMode
    syncModeUi()
    render()
  })
}

for (const button of transparencyButtons) {
  button.addEventListener('click', () => {
    transparency = button.dataset.transparency as TransparencyMode
    for (const item of transparencyButtons) {
      item.classList.toggle('is-active', item === button)
    }
    render()
  })
}

for (const input of [widthInput, heightInput, variableInput, ditherInput, toleranceInput]) {
  input.addEventListener('input', () => {
    toleranceValue.value = toleranceInput.value
    if (sizeMode === 'custom') {
      widthInput.value = String(clampDimension(Number(widthInput.value)))
      heightInput.value = String(clampDimension(Number(heightInput.value)))
    }
    render()
  })
}

copyButton.addEventListener('click', async () => {
  if (!latestResult) return

  try {
    await navigator.clipboard.writeText(latestResult.code)
  } catch {
    codeOutput.select()
    document.execCommand('copy')
  }

  copyButton.textContent = 'Copied'
  copyButton.classList.add('is-success')
  window.setTimeout(() => {
    copyButton.textContent = 'Copy code'
    copyButton.classList.remove('is-success')
  }, 1800)
})

syncModeUi()

async function loadFile(file: File): Promise<void> {
  const maxBytes = 10 * 1024 * 1024
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
  if (!allowedTypes.has(file.type)) {
    showError('Use a PNG, JPG, or WebP file.')
    return
  }
  if (file.size > maxBytes) {
    showError('File is larger than 10 MB.')
    return
  }

  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = URL.createObjectURL(file)

  const loadedImage = new Image()
  loadedImage.decoding = 'async'
  loadedImage.src = objectUrl

  try {
    await loadedImage.decode()
  } catch {
    showError('Could not read the image.')
    return
  }

  image = loadedImage
  originalPreview.src = objectUrl
  originalPreview.hidden = false
  originalEmpty.hidden = true
  settings.removeAttribute('aria-disabled')
  settings.removeAttribute('inert')
  dropzone.classList.add('has-file')
  dropzone.querySelector('strong')!.textContent = file.name
  dropzone.querySelector<HTMLElement>('small')!.textContent =
    `${loadedImage.naturalWidth}×${loadedImage.naturalHeight} · ${formatBytes(file.size)}`

  const maxSide = Math.max(loadedImage.naturalWidth, loadedImage.naturalHeight)
  if (maxSide <= 320 && loadedImage.naturalWidth !== loadedImage.naturalHeight) {
    sizeMode = 'original'
  } else if (maxSide <= 128) {
    sizeMode = 'original'
  } else {
    sizeMode = 'fit-width'
  }
  syncModeUi()
  render()
}

function render(): void {
  if (!image) return

  try {
    const target = resolveTargetSize(image.naturalWidth, image.naturalHeight, {
      sizeMode,
      width: Number(widthInput.value),
      height: Number(heightInput.value),
    })
    resolvedSize.textContent = `${target.width}×${target.height}`

    latestResult = convertImage(image, {
      sizeMode,
      width: Number(widthInput.value),
      height: Number(heightInput.value),
      variableName: variableInput.value,
      transparency,
      backgroundTolerance: Number(toleranceInput.value),
      dither: ditherInput.checked,
    })

    spritePreview.replaceChildren(latestResult.canvas)
    spriteMeta.textContent =
      `${latestResult.width}×${latestResult.height} · ${latestResult.transparentPixels} transparent`
    codeOutput.value = latestResult.code
    copyButton.disabled = false
    codeStatus.textContent = 'Ready'
    codeStatus.classList.remove('is-error')
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Could not convert the image.')
  }
}

function syncModeUi(): void {
  for (const button of modeButtons) {
    button.classList.toggle('is-active', button.dataset.mode === sizeMode)
  }
  customSizeFields.hidden = sizeMode !== 'custom'
}

function showError(message: string): void {
  latestResult = null
  copyButton.disabled = true
  codeStatus.textContent = message
  codeStatus.classList.add('is-error')
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) throw new Error(`Element #${id} not found`)
  return element as T
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
