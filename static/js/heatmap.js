/**
 * FairSight Heatmap Component
 * Renders a visual grid indicating bias distribution
 */

function renderHeatmap(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const groups = Object.keys(data);
    const rates = Object.values(data);
    
    if (groups.length === 0) return;

    // Handle responsive sizing
    function resize() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const padding = 20;
        const width = canvas.width - (padding * 2);
        const height = canvas.height - (padding * 2);
        
        // Determine grid layout based on number of groups
        let cols, rows;
        if (groups.length <= 2) { cols = groups.length; rows = 1; }
        else if (groups.length <= 4) { cols = 2; rows = 2; }
        else if (groups.length <= 6) { cols = 3; rows = 2; }
        else { cols = Math.ceil(Math.sqrt(groups.length)); rows = Math.ceil(groups.length / cols); }
        
        const cellGap = 12;
        const cellWidth = (width - (cellGap * (cols - 1))) / cols;
        const cellHeight = (height - (cellGap * (rows - 1))) / rows;
        
        const maxRate = Math.max(...rates) || 1;
        const minRate = Math.min(...rates) || 0;
        
        groups.forEach((group, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + (col * (cellWidth + cellGap));
            const y = padding + (row * (cellHeight + cellGap));
            const rate = rates[i];
            
            // Color based on disparity from maxRate (simplified for visual impact)
            // If close to max rate -> green. If far -> red.
            const ratio = maxRate > 0 ? rate / maxRate : 1;
            let color;
            if (ratio < 0.8) {
                // Biased (Red)
                color = `rgba(239, 68, 68, ${0.4 + (1 - ratio)})`;
            } else if (ratio <= 1.2) {
                // Fair (Green)
                color = `rgba(16, 185, 129, ${0.4 + ratio/2})`;
            } else {
                // Reverse (Yellow)
                color = `rgba(245, 158, 11, ${0.4 + (ratio - 1)})`;
            }

            // Draw cell
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x, y, cellWidth, cellHeight, 8);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw text
            ctx.fillStyle = '#ffffff';
            ctx.font = '600 14px "Space Grotesk", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Group name
            ctx.fillText(group, x + cellWidth/2, y + cellHeight/2 - 10);
            
            // Rate
            ctx.font = '400 12px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(`${(rate * 100).toFixed(1)}%`, x + cellWidth/2, y + cellHeight/2 + 10);
        });
    }

    // Initial draw and resize listener
    resize();
    window.addEventListener('resize', resize);
    
    // Simple fade-in animation
    canvas.style.opacity = '0';
    let opacity = 0;
    const fade = setInterval(() => {
        opacity += 0.05;
        canvas.style.opacity = opacity;
        if (opacity >= 1) clearInterval(fade);
    }, 30);
}
