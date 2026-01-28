<template>
  <canvas ref="canvas" class="fluid-canvas"></canvas>
</template>

<script setup lang="ts">
import { watch, ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 接收三组颜色（RGB）作为 fluid 背景主色
 */
const props = defineProps({
  colors: {
    type: Object as () => {
      c1: { r: number; g: number; b: number }
      c2: { r: number; g: number; b: number }
      c3: { r: number; g: number; b: number }
    },
    required: true
  }
})

const canvas = ref<HTMLCanvasElement>()
let gl: WebGLRenderingContext
let program: WebGLProgram
let animationId: number
let shaders: WebGLShader[] = []
let buffer: WebGLBuffer | null = null

// 当前 uniform 颜色（用于平滑过渡）
let currentColors = {
  c1: { r: 255, g: 130, b: 150 },
  c2: { r: 200, g: 80, b: 120 },
  c3: { r: 100, g: 100, b: 100 }
}

// 目标颜色
let targetColors = {
  c1: { r: 255, g: 130, b: 150 },
  c2: { r: 200, g: 80, b: 120 },
  c3: { r: 100, g: 100, b: 100 }
}

// 平滑过渡速度
const transitionSpeed = 0.05

// shader 代码（和你原来的 fragShaderSrc 相同）
// 流体背景核心程序
const fragShaderSrc = `
precision highp float;

uniform float u_time;      
uniform vec2 u_res;        
uniform vec3 u_c1;         
uniform vec3 u_c2;         
uniform vec3 u_c3;         

#define S(a,b,t) smoothstep(a,b,t)

mat2 Rot(float a){
    float s = sin(a); float c = cos(a);
    return mat2(c, -s, s, c);
}

// 伪随机函数，用于消除色带波纹 (Dithering)
float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453123);
}

vec2 hash(vec2 p){
    p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
    return fract(sin(p) * 43758.5453);
}

float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    float n = mix(
        mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)), f-vec2(0.0,0.0)),
            dot(-1.0+2.0*hash(i+vec2(1.0,0.0)), f-vec2(1.0,0.0)), u.x),
        mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)), f-vec2(0.0,1.0)),
            dot(-1.0+2.0*hash(i+vec2(1.0,1.0)), f-vec2(1.0,1.0)), u.x),
        u.y
    );
    return 0.5 + 0.5 * n;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_res.xy;
    float ratio = u_res.x / u_res.y;
    vec2 tuv = uv - 0.5;

    float degree = noise(vec2(u_time*0.1, tuv.x*tuv.y));
    tuv.y *= 1.0 / ratio;
    tuv *= Rot(radians((degree-0.5)*720.0 + 180.0));
    tuv.y *= ratio;

    float frequency = 5.0;
    float amplitude = 30.0;
    float speed = u_time*2.0;
    tuv.x += sin(tuv.y*frequency + speed)/amplitude;
    tuv.y += sin(tuv.x*frequency*1.5 + speed)/(amplitude*0.5);

    vec3 layer1 = mix(u_c3/255.0, u_c1/255.0, S(-0.3, 0.2, (tuv*Rot(radians(-5.0))).x));
    vec3 layer2 = mix(u_c2/255.0, u_c3/255.0, S(-0.3, 0.2, (tuv*Rot(radians(5.0))).x));
    
    vec3 col = mix(layer1, layer2, S(0.5, -0.3, tuv.y));

    // --- 优化后的亮度适配逻辑 ---
    float luminance = dot(col, vec3(0.299, 0.587, 0.114));
    
    // 调宽倍率区间：亮色背景压到 0.45，暗色背景基本不压(0.9)
    // 这样做既保证了白色歌词能看清，又减少了深色部分的断层波纹
    float adaptiveFactor = mix(0.45, 0.9, 1.0 - luminance);
    col *= adaptiveFactor;

    // 减弱 pow 的强度从 0.95 到 0.98，使颜色过渡更平滑
    col = pow(col, vec3(0.98));

    // --- Dithering 抖动算法 ---
    // 在每个像素上增加极微小的随机扰动，从视觉上消除色带波纹
    float dither = (random(uv) - 0.5) * (1.0 / 128.0);
    col += dither;

    gl_FragColor = vec4(col, 1.0);
}
`

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s))
  }
  shaders.push(s)
  return s
}

function init() {
  if (!canvas.value) return
  gl = canvas.value.getContext('webgl', { antialias: true })!

  const vs = createShader(
    gl,
    gl.VERTEX_SHADER,
    `attribute vec2 pos; void main(){ gl_Position = vec4(pos,0.0,1.0); }`
  )
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc)

  program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.useProgram(program)

  buffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

  const loc = gl.getAttribLocation(program, 'pos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
}

// 渲染
function render(time: number) {
  if (!gl) return // --- 平滑颜色过渡 ---
  ;['c1', 'c2', 'c3'].forEach((c) => {
    currentColors[c].r += (targetColors[c].r - currentColors[c].r) * transitionSpeed
    currentColors[c].g += (targetColors[c].g - currentColors[c].g) * transitionSpeed
    currentColors[c].b += (targetColors[c].b - currentColors[c].b) * transitionSpeed

    gl.uniform3f(
      gl.getUniformLocation(program, `u_${c}`),
      currentColors[c].r,
      currentColors[c].g,
      currentColors[c].b
    )
  })

  gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time * 0.001)
  gl.uniform2f(gl.getUniformLocation(program, 'u_res'), canvas.value!.width, canvas.value!.height)

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  animationId = requestAnimationFrame(render)
}

function resizeCanvas() {
  if (!canvas.value) return
  const c = canvas.value
  const dpr = window.devicePixelRatio || 1
  c.width = window.innerWidth * dpr
  c.height = window.innerHeight * dpr
  c.style.width = window.innerWidth + 'px'
  c.style.height = window.innerHeight + 'px'
  if (gl) gl.viewport(0, 0, c.width, c.height)
}

function cleanup() {
  cancelAnimationFrame(animationId)

  if (gl) {
    shaders.forEach((s) => gl.deleteShader(s))
    shaders = []

    if (program) {
      gl.deleteProgram(program)
      program = null as any
    }

    if (buffer) {
      gl.deleteBuffer(buffer)
      buffer = null
    }

    const ext = gl.getExtension('WEBGL_lose_context')
    if (ext) ext.loseContext()
    gl = null as any
  }

  // 清理颜色对象引用
  currentColors = {
    c1: { r: 0, g: 0, b: 0 },
    c2: { r: 0, g: 0, b: 0 },
    c3: { r: 0, g: 0, b: 0 }
  }
  targetColors = {
    c1: { r: 0, g: 0, b: 0 },
    c2: { r: 0, g: 0, b: 0 },
    c3: { r: 0, g: 0, b: 0 }
  }

  window.removeEventListener('resize', resizeCanvas)
}

// 监听 props.colors，切歌时平滑更新
watch(
  () => props.colors,
  (newColors) => {
    targetColors = { ...newColors }
  },
  { deep: true }
)

onMounted(() => {
  resizeCanvas()
  init()
  animationId = requestAnimationFrame(render)
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style lang="less" scoped>
.fluid-canvas {
  position: fixed;
  inset: 0;
  background: #000;
}
</style>
