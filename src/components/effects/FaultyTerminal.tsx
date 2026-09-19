import { Renderer, Program, Mesh, Color, Triangle } from "ogl"
import { useEffect, useRef, useMemo, useCallback } from "react"
import { createAnimationLoop } from "./animation-loop"
import "./FaultyTerminal.css"

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;
uniform float uLightMode;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;

  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545;

  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;

  mat2 modify2 = rotate(time * 0.08);
  f += amp * noise(p);

  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);

  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}

float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;

    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * vec2(iResolution.z, 1.0) * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;

        float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
        intensity += ripple;
    }

    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);

        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }

    p = fract(p);
    p *= uDigitSize;

    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);

    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;

    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);

    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec3 getColor(vec2 p){

    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;

    float displacement = displace(p);
    p.x += displacement;

    if (uGlitchAmount != 1.0) {
      float extra = displacement * (uGlitchAmount - 1.0);
      p.x += extra;
    }

    float middle = digit(p);

    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));

    vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }

    // Use the same aspect-correct coordinate space for cells and pointer.
    vec2 p = uv * vec2(iResolution.z, 1.0) * uScale;
    vec3 col = getColor(p);

    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }

    col *= uTint;
    col *= uBrightness;

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      col += (rnd - 0.5) * (uDither * 0.003922);
    }

    if (uLightMode > 0.5) {
      float energy = max(max(col.r, col.g), col.b);
      float coverage = clamp(smoothstep(0.0, 0.72, energy) * 0.9, 0.0, 0.9);
      vec3 ink = clamp(col * 0.42, 0.0, 0.76);
      col = mix(vec3(1.0), ink, coverage);
    }

    gl_FragColor = vec4(col, 1.0);
}
`

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim()
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  }
  const num = parseInt(h.slice(0, 6), 16)
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ]
}

export interface FaultyTerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  scale?: number
  gridMul?: [number, number]
  digitSize?: number
  timeScale?: number
  pause?: boolean
  scanlineIntensity?: number
  glitchAmount?: number
  flickerAmount?: number
  noiseAmp?: number
  chromaticAberration?: number
  dither?: number | boolean
  curvature?: number
  tint?: string
  mouseReact?: boolean
  mouseStrength?: number
  dpr?: number
  maxFps?: number
  maxPixels?: number
  pageLoadAnimation?: boolean
  brightness?: number
  lightMode?: boolean
}

export default function FaultyTerminal({
  scale = 1,
  gridMul = [2, 1],
  digitSize = 1.5,
  timeScale = 0.3,
  pause = false,
  scanlineIntensity = 0.3,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 1,
  chromaticAberration = 0,
  dither = 0,
  curvature = 0.2,
  tint = "#ffffff",
  mouseReact = true,
  mouseStrength = 0.2,
  dpr,
  maxFps = 30,
  maxPixels = 900_000,
  pageLoadAnimation = true,
  brightness = 1,
  lightMode = false,
  className = "",
  style,
  ...rest
}: FaultyTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const programRef = useRef<Program | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const mouseRef = useRef({ x: -10, y: -10 })
  const smoothMouseRef = useRef({ x: -10, y: -10 })
  const frozenTimeRef = useRef(0)
  const loadAnimationStartRef = useRef(0)
  const timeOffsetRef = useRef(Math.random() * 100)

  const tintVec = useMemo(() => hexToRgb(tint), [tint])
  const [gridX, gridY] = gridMul
  const ditherValue = useMemo(
    () => (typeof dither === "boolean" ? (dither ? 1 : 0) : dither),
    [dither]
  )
  const resolvedDpr = useMemo(
    () =>
      dpr ??
      (typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio || 1, 1)
        : 1),
    [dpr]
  )

  const handleMouseMove = useCallback((e: PointerEvent) => {
    // Coalesce pointer events; do layout reads only at the capped render rate.
    pointerRef.current =
      e.pointerType === "touch" ? null : { x: e.clientX, y: e.clientY }
  }, [])

  useEffect(() => {
    if (containerRef.current == null) return
    const ctn: HTMLDivElement = containerRef.current

    // Decorative content must not take down the page on devices without WebGL.
    let renderer: Renderer
    try {
      renderer = new Renderer({
        dpr: resolvedDpr,
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      })
      renderer.gl.clearColor(
        lightMode ? 1 : 0,
        lightMode ? 1 : 0,
        lightMode ? 1 : 0,
        1
      )
    } catch {
      return
    }
    rendererRef.current = renderer
    const gl = renderer.gl

    const geometry = new Triangle(gl)

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Color(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height
          ),
        },
        uScale: { value: scale },
        uGridMul: { value: new Float32Array([gridX, gridY]) },
        uDigitSize: { value: digitSize },
        uScanlineIntensity: { value: scanlineIntensity },
        uGlitchAmount: { value: glitchAmount },
        uFlickerAmount: { value: flickerAmount },
        uNoiseAmp: { value: noiseAmp },
        uChromaticAberration: { value: chromaticAberration },
        uDither: { value: ditherValue },
        uCurvature: { value: curvature },
        uTint: { value: new Color(tintVec[0], tintVec[1], tintVec[2]) },
        uMouse: {
          value: new Float32Array([
            smoothMouseRef.current.x,
            smoothMouseRef.current.y,
          ]),
        },
        uMouseStrength: { value: mouseStrength },
        uUseMouse: { value: mouseReact ? 1 : 0 },
        uPageLoadProgress: { value: pageLoadAnimation ? 0 : 1 },
        uUsePageLoadAnimation: { value: pageLoadAnimation ? 1 : 0 },
        uBrightness: { value: brightness },
        uLightMode: { value: lightMode ? 1 : 0 },
      },
    })
    programRef.current = program

    const mesh = new Mesh(gl, { geometry, program })

    let inView = false
    let contextLost = false
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    function resize() {
      const width = Math.max(1, ctn.offsetWidth)
      const height = Math.max(1, ctn.offsetHeight)
      // Cap actual framebuffer area, including on large and high-DPI displays.
      renderer.dpr = Math.min(
        resolvedDpr,
        Math.sqrt(maxPixels / (width * height))
      )
      renderer.setSize(width, height)
      program.uniforms.iResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        width / height
      )
      // Keep cell size in CSS pixels, independent of viewport shape or DPR cap.
      program.uniforms.uScale.value = (scale * height) / 600
    }

    const update = (t: number) => {
      if (pageLoadAnimation && loadAnimationStartRef.current === 0) {
        loadAnimationStartRef.current = t
      }

      if (!pause && !reducedMotion.matches) {
        const elapsed = (t * 0.001 + timeOffsetRef.current) * timeScale
        program.uniforms.iTime.value = elapsed
        frozenTimeRef.current = elapsed
      } else {
        program.uniforms.iTime.value = frozenTimeRef.current
      }

      if (pageLoadAnimation && loadAnimationStartRef.current > 0) {
        const animationDuration = 2000
        const animationElapsed = t - loadAnimationStartRef.current
        const progress = Math.min(animationElapsed / animationDuration, 1)
        program.uniforms.uPageLoadProgress.value = progress
      }

      if (mouseReact) {
        const pointer = pointerRef.current
        const rect = pointer ? ctn.getBoundingClientRect() : null
        if (
          pointer &&
          rect &&
          rect.width > 0 &&
          rect.height > 0 &&
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom
        ) {
          mouseRef.current = {
            x: (pointer.x - rect.left) / rect.width,
            y: 1 - (pointer.y - rect.top) / rect.height,
          }
          if (smoothMouseRef.current.x < 0)
            smoothMouseRef.current = { ...mouseRef.current }
        } else {
          mouseRef.current = { x: -10, y: -10 }
          smoothMouseRef.current = { x: -10, y: -10 }
        }
        const dampingFactor = 0.25
        const smoothMouse = smoothMouseRef.current
        const mouse = mouseRef.current
        smoothMouse.x += (mouse.x - smoothMouse.x) * dampingFactor
        smoothMouse.y += (mouse.y - smoothMouse.y) * dampingFactor

        const mouseUniform = program.uniforms.uMouse.value as Float32Array
        mouseUniform[0] = smoothMouse.x
        mouseUniform[1] = smoothMouse.y
      }

      renderer.render({ scene: mesh })
    }
    const loop = createAnimationLoop(update, maxFps)
    function syncPlayback() {
      loop.stop()
      if (!inView || document.hidden || contextLost) return
      if (pause || reducedMotion.matches) {
        program.uniforms.uPageLoadProgress.value = 1
        renderer.render({ scene: mesh })
      } else {
        loop.start()
      }
    }
    const resizeObserver = new ResizeObserver(() => {
      resize()
      syncPlayback()
    })
    resizeObserver.observe(ctn)
    resize()
    ctn.appendChild(gl.canvas)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      syncPlayback()
    })
    intersectionObserver.observe(ctn)
    const onContextLost = () => {
      contextLost = true
      loop.stop()
      // Keep the CSS fallback visible if the GPU context is reclaimed.
      gl.canvas.style.visibility = "hidden"
    }
    gl.canvas.addEventListener("webglcontextlost", onContextLost)
    document.addEventListener("visibilitychange", syncPlayback)
    reducedMotion.addEventListener("change", syncPlayback)

    const clearPointer = () => {
      pointerRef.current = null
    }
    // Listen through the text/buttons without intercepting clicks or scrolling.
    if (mouseReact) {
      window.addEventListener("pointermove", handleMouseMove, { passive: true })
      window.addEventListener("blur", clearPointer)
      document.addEventListener("pointerleave", clearPointer)
    }

    return () => {
      loop.stop()
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", syncPlayback)
      reducedMotion.removeEventListener("change", syncPlayback)
      gl.canvas.removeEventListener("webglcontextlost", onContextLost)
      if (mouseReact) {
        window.removeEventListener("pointermove", handleMouseMove)
        window.removeEventListener("blur", clearPointer)
        document.removeEventListener("pointerleave", clearPointer)
      }
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas)
      geometry.remove()
      program.remove()
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      loadAnimationStartRef.current = 0
      timeOffsetRef.current = Math.random() * 100
    }
  }, [
    resolvedDpr,
    maxFps,
    maxPixels,
    pause,
    timeScale,
    scale,
    gridX,
    gridY,
    digitSize,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    ditherValue,
    curvature,
    tintVec,
    mouseReact,
    mouseStrength,
    pageLoadAnimation,
    brightness,
    lightMode,
    handleMouseMove,
  ])

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`faulty-terminal-container ${className}`}
      style={style}
      {...rest}
    />
  )
}
