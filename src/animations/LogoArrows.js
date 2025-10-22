// Logo Arrows Animation - Chaotic moving arrows behind logo with glow effect
export class LogoArrowsAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.arrows = [];
        this.numArrows = 8;

        // Setup canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize arrows
        this.initArrows();

        // Start animation
        this.animate();

        console.log('✅ Logo arrows animation initialized');
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;
    }

    initArrows() {
        this.arrows = [];
        for (let i = 0; i < this.numArrows; i++) {
            this.arrows.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 4, // -2 to 2 px/frame
                vy: (Math.random() - 0.5) * 4,
                opacity: 0.6 + Math.random() * 0.4,
                opacityDelta: (Math.random() - 0.5) * 0.02,
                size: 20 + Math.random() * 15 // 20-35px
            });
        }
    }

    update() {
        this.arrows.forEach(arrow => {
            // Update position
            arrow.x += arrow.vx;
            arrow.y += arrow.vy;

            // Bounce off walls
            if (arrow.x < 0 || arrow.x > this.width) {
                arrow.vx *= -1;
                arrow.x = Math.max(0, Math.min(this.width, arrow.x));
            }
            if (arrow.y < 0 || arrow.y > this.height) {
                arrow.vy *= -1;
                arrow.y = Math.max(0, Math.min(this.height, arrow.y));
            }

            // Pulsate opacity
            arrow.opacity += arrow.opacityDelta;
            if (arrow.opacity < 0.6 || arrow.opacity > 1.0) {
                arrow.opacityDelta *= -1;
            }
        });
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw arrows with background illumination
        this.arrows.forEach(arrow => {
            const angle = Math.atan2(arrow.vy, arrow.vx);

            this.ctx.save();
            this.ctx.translate(arrow.x, arrow.y);

            // BACKGROUND LIGHT HALOS - these actually illuminate the background
            // Large outer halo (creates ambient light on background)
            const gradient1 = this.ctx.createRadialGradient(0, 0, 0, 0, 0, arrow.size * 4);
            gradient1.addColorStop(0, `rgba(255, 223, 0, ${arrow.opacity * 0.4})`);
            gradient1.addColorStop(0.3, `rgba(244, 200, 16, ${arrow.opacity * 0.25})`);
            gradient1.addColorStop(0.6, `rgba(244, 200, 16, ${arrow.opacity * 0.1})`);
            gradient1.addColorStop(1, 'rgba(244, 200, 16, 0)');
            this.ctx.fillStyle = gradient1;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, arrow.size * 4, 0, Math.PI * 2);
            this.ctx.fill();

            // Medium halo (brighter, closer to arrow)
            const gradient2 = this.ctx.createRadialGradient(0, 0, 0, 0, 0, arrow.size * 2.5);
            gradient2.addColorStop(0, `rgba(255, 255, 200, ${arrow.opacity * 0.6})`);
            gradient2.addColorStop(0.4, `rgba(255, 223, 0, ${arrow.opacity * 0.4})`);
            gradient2.addColorStop(0.7, `rgba(244, 200, 16, ${arrow.opacity * 0.2})`);
            gradient2.addColorStop(1, 'rgba(244, 200, 16, 0)');
            this.ctx.fillStyle = gradient2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, arrow.size * 2.5, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner bright halo (white/yellow intense light)
            const gradient3 = this.ctx.createRadialGradient(0, 0, 0, 0, 0, arrow.size * 1.5);
            gradient3.addColorStop(0, `rgba(255, 255, 255, ${arrow.opacity * 0.8})`);
            gradient3.addColorStop(0.5, `rgba(255, 255, 200, ${arrow.opacity * 0.6})`);
            gradient3.addColorStop(1, `rgba(255, 223, 0, ${arrow.opacity * 0.3})`);
            this.ctx.fillStyle = gradient3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, arrow.size * 1.5, 0, Math.PI * 2);
            this.ctx.fill();

            // Now draw the arrow on top
            this.ctx.rotate(angle);

            // Arrow with glow
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = `rgba(255, 255, 255, ${arrow.opacity})`;
            this.ctx.font = `${arrow.size}px Arial`;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${arrow.opacity * 0.9})`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('→', 0, 0);

            // Core arrow - bright yellow
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = `rgba(255, 223, 0, ${arrow.opacity})`;
            this.ctx.fillStyle = `rgba(255, 223, 0, ${arrow.opacity})`;
            this.ctx.fillText('→', 0, 0);

            this.ctx.restore();
        });
    }

    animate() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}
