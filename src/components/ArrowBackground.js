/**
 * ArrowBackground - Animated canvas background with rotating arrows
 * Brand identity visual element - arrows at 45� intervals (8 directions)
 */
export class ArrowBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('L Canvas element not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.arrows = [];
        this.animationId = null;

        // 8 directions at 45� intervals
        this.directions = [0, 45, 90, 135, 180, 225, 270, 315];

        this.init();
        console.log(' ArrowBackground initialized');
    }

    /**
     * Initialize canvas and start animation
     */
    init() {
        this.resizeCanvas();
        this.generateArrows(20); // Generate 20 arrows
        this.animate();

        // Resize canvas on window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.generateArrows(20); // Regenerate arrows on resize
        });
    }

    /**
     * Resize canvas to full window size
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Generate random arrows
     */
    generateArrows(count) {
        this.arrows = [];

        for (let i = 0; i < count; i++) {
            const direction = this.directions[Math.floor(Math.random() * this.directions.length)];

            this.arrows.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                direction: direction, // Rotation in degrees
                size: 20 + Math.random() * 40, // Size 20-60px
                speed: 0.2 + Math.random() * 0.5, // Speed 0.2-0.7
                opacity: 0.3 + Math.random() * 0.3 // Opacity 0.3-0.6 (higher for visibility)
            });
        }
    }

    /**
     * Draw a single arrow
     */
    drawArrow(arrow) {
        this.ctx.save();

        // Translate to arrow position
        this.ctx.translate(arrow.x, arrow.y);

        // Rotate to arrow direction
        this.ctx.rotate((arrow.direction * Math.PI) / 180);

        // Set style
        this.ctx.fillStyle = `rgba(255, 255, 255, ${arrow.opacity})`;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${arrow.opacity})`;
        this.ctx.lineWidth = 2;

        // Draw arrow shaft (rectangle)
        const shaftWidth = arrow.size * 0.2;
        const shaftLength = arrow.size * 0.6;
        this.ctx.fillRect(-shaftWidth / 2, -shaftLength / 2, shaftWidth, shaftLength);

        // Draw arrowhead (triangle)
        const headWidth = arrow.size * 0.4;
        const headLength = arrow.size * 0.4;

        this.ctx.beginPath();
        this.ctx.moveTo(0, -shaftLength / 2 - headLength); // Tip
        this.ctx.lineTo(-headWidth / 2, -shaftLength / 2); // Left base
        this.ctx.lineTo(headWidth / 2, -shaftLength / 2); // Right base
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * Move arrow in its direction
     */
    moveArrow(arrow) {
        const radians = (arrow.direction * Math.PI) / 180;
        arrow.x += Math.sin(radians) * arrow.speed;
        arrow.y -= Math.cos(radians) * arrow.speed;

        // Wrap around screen edges
        if (arrow.x < -100) arrow.x = this.canvas.width + 100;
        if (arrow.x > this.canvas.width + 100) arrow.x = -100;
        if (arrow.y < -100) arrow.y = this.canvas.height + 100;
        if (arrow.y > this.canvas.height + 100) arrow.y = -100;
    }

    /**
     * Animation loop
     */
    animate() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw each arrow
        this.arrows.forEach(arrow => {
            this.moveArrow(arrow);
            this.drawArrow(arrow);
        });

        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Stop animation
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            console.log('� ArrowBackground animation stopped');
        }
    }

    /**
     * Resume animation
     */
    start() {
        if (!this.animationId) {
            this.animate();
            console.log('� ArrowBackground animation started');
        }
    }
}
