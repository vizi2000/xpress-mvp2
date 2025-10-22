// Logo Background Glow - Simple illuminated background behind logo
export class LogoArrowsAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.opacity = 0.5;
        this.opacityDelta = 0.005;

        // Setup canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Start animation
        this.animate();

        console.log('✅ Logo background glow initialized');
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;
    }

    update() {
        // Gentle pulsating opacity
        this.opacity += this.opacityDelta;
        if (this.opacity < 0.3 || this.opacity > 0.7) {
            this.opacityDelta *= -1;
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Center position (where logo is)
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Large radial gradient to illuminate background
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(this.width, this.height) * 0.6
        );

        gradient.addColorStop(0, `rgba(255, 223, 0, ${this.opacity * 0.4})`);
        gradient.addColorStop(0.2, `rgba(244, 200, 16, ${this.opacity * 0.3})`);
        gradient.addColorStop(0.5, `rgba(244, 200, 16, ${this.opacity * 0.15})`);
        gradient.addColorStop(1, 'rgba(244, 200, 16, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    animate() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}
