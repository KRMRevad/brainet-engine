/**
 * Particle background canvas — ambient network effect
 */

export function initParticles() {
    const canvas = document.getElementById('particles-canvas')
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let particles = []
    let animFrame

    function resize() {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }

    function createParticles() {
        particles = []
        const count = Math.floor((canvas.width * canvas.height) / 15000)
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.5 + 0.5,
                color: getRandomColor(),
                alpha: Math.random() * 0.5 + 0.1,
            })
        }
    }

    function getRandomColor() {
        const colors = [
            '139, 92, 246',   // purple
            '96, 165, 250',   // blue
            '6, 182, 212',    // cyan
            '16, 185, 129',   // green
            '236, 72, 153',   // pink
        ]
        return colors[Math.floor(Math.random() * colors.length)]
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i]

            // Move
            p.x += p.vx
            p.y += p.vy

            // Wrap
            if (p.x < 0) p.x = canvas.width
            if (p.x > canvas.width) p.x = 0
            if (p.y < 0) p.y = canvas.height
            if (p.y > canvas.height) p.y = 0

            // Draw particle
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`
            ctx.fill()

            // Connect nearby particles
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j]
                const dx = p.x - p2.x
                const dy = p.y - p2.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 120) {
                    ctx.beginPath()
                    ctx.moveTo(p.x, p.y)
                    ctx.lineTo(p2.x, p2.y)
                    ctx.strokeStyle = `rgba(${p.color}, ${(1 - dist / 120) * 0.1})`
                    ctx.lineWidth = 0.5
                    ctx.stroke()
                }
            }
        }

        animFrame = requestAnimationFrame(draw)
    }

    resize()
    createParticles()
    draw()

    window.addEventListener('resize', () => {
        resize()
        createParticles()
    })
}
