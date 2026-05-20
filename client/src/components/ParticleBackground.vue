<template>
  <canvas ref="canvasRef" class="particle-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
let animationId = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()

  const mouse = { x: canvas.width / 2, y: canvas.height / 2 }
  const dots = []
  const dotCount = 80
  const maxDist = 100
  const mouseRadius = 140

  function randColor(min) {
    return Math.floor(Math.random() * 200 + min)
  }

  class Dot {
    constructor() {
      this.x = Math.random() * canvas.width
      this.y = Math.random() * canvas.height
      this.vx = (Math.random() - 0.5) * 0.6
      this.vy = (Math.random() - 0.5) * 0.6
      this.r = Math.random() * 2 + 1
      this.color = [randColor(100), randColor(150), randColor(200)]
    }

    draw() {
      ctx.beginPath()
      ctx.fillStyle = `rgba(${this.color[0]},${this.color[1]},${this.color[2]},0.6)`
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
      ctx.fill()
    }

    move() {
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1
      this.x += this.vx
      this.y += this.vy
    }
  }

  for (let i = 0; i < dotCount; i++) {
    dots.push(new Dot())
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const dot of dots) {
      dot.move()
      dot.draw()
    }

    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x
        const dy = dots[i].y - dots[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < maxDist) {
          const mx = dots[i].x - mouse.x
          const my = dots[i].y - mouse.y
          const mDist = Math.sqrt(mx * mx + my * my)

          if (mDist < mouseRadius) {
            const alpha = (1 - dist / maxDist) * 0.3
            ctx.beginPath()
            ctx.strokeStyle = `rgba(${dots[i].color[0]},${dots[i].color[1]},${dots[i].color[2]},${alpha})`
            ctx.lineWidth = 0.5
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.stroke()
          }
        }
      }
    }

    animationId = requestAnimationFrame(animate)
  }

  animate()

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
  })

  window.addEventListener('mouseleave', () => {
    mouse.x = canvas.width / 2
    mouse.y = canvas.height / 2
  })

  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.particle-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  background: #1a1a2e;
}
</style>
