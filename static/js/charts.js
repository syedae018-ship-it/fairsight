/**
 * FairSight Chart.js Configuration
 * All charts use dark theme styling
 */

const chartColors = {
    violet: '#7c3aed',
    cyan: '#06b6d4',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6',
    orange: '#f97316',
    blue: '#3b82f6'
};

const colorPalette = [
    chartColors.violet,
    chartColors.cyan,
    chartColors.green,
    chartColors.yellow,
    chartColors.red,
    chartColors.pink,
    chartColors.indigo,
    chartColors.teal,
    chartColors.orange,
    chartColors.blue
];

// Global Chart.js defaults for dark theme
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Sora', sans-serif";

/**
 * Map group names to specific brand colors.
 * Male → violet, Female → cyan, others cycle through accent palette.
 */
function getGroupColors(labels) {
    const nameColorMap = {
        'male': '#7c3aed',
        'female': '#06b6d4',
        'm': '#7c3aed',
        'f': '#06b6d4'
    };
    const accentCycle = ['#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#3b82f6'];
    let accentIdx = 0;

    return labels.map(label => {
        const key = label.toString().trim().toLowerCase();
        if (nameColorMap[key]) return nameColorMap[key];
        return accentCycle[accentIdx++ % accentCycle.length];
    });
}

/**
 * Shared dark tooltip config used by both charts
 */
const darkTooltip = {
    backgroundColor: '#0f1729',
    titleColor: '#f1f5f9',
    bodyColor: '#f1f5f9',
    borderColor: '#7c3aed',
    borderWidth: 1,
    padding: 14,
    cornerRadius: 10,
    titleFont: { family: "'Sora', sans-serif", weight: '600', size: 13 },
    bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
    displayColors: true,
    boxPadding: 6
};

/**
 * Render a horizontal bar chart showing selection rate by group
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - {group_name: selection_rate} where rate is 0-1
 */
function renderSelectionRateChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = Object.keys(data);
    const values = Object.values(data).map(v => +(v * 100).toFixed(1));
    const barColors = getGroupColors(labels);

    // Plugin: draw percentage label at end of each bar
    const barLabelPlugin = {
        id: 'barEndLabels',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            chart.data.datasets.forEach((dataset, dsIndex) => {
                const meta = chart.getDatasetMeta(dsIndex);
                meta.data.forEach((bar, index) => {
                    const val = dataset.data[index];
                    ctx.save();
                    ctx.font = "600 12px 'JetBrains Mono', monospace";
                    ctx.fillStyle = '#f1f5f9';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    const x = bar.x + 8;
                    const y = bar.y;
                    ctx.fillText(val + '%', x, y);
                    ctx.restore();
                });
            });
        }
    };

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Selection Rate (%)',
                data: values,
                backgroundColor: barColors,
                borderColor: 'transparent',
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.65,
                categoryPercentage: 0.8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            layout: {
                padding: { right: 50 }  // room for end-labels
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...darkTooltip,
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (ctx) => ' ' + ctx.parsed.x + '%'
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    border: { display: false },
                    grid: {
                        color: 'rgba(255,255,255,0.06)',
                        drawTicks: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: "'Sora', sans-serif", size: 11 },
                        padding: 8,
                        callback: (v) => v + '%'
                    }
                },
                y: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: "'Sora', sans-serif", size: 13, weight: '500' },
                        padding: 8
                    }
                }
            }
        },
        plugins: [barLabelPlugin]
    });
}

/**
 * Render a donut chart showing dataset composition
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - {group_name: count}
 */
function renderCompositionChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = Object.keys(data);
    const values = Object.values(data);

    const donutColors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b'];
    const bgColors = labels.map((_, i) => donutColors[i % donutColors.length]);

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderColor: 'transparent',
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 20,
                        font: { family: "'Sora', sans-serif", size: 13 },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    ...darkTooltip,
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((context.parsed / total) * 100).toFixed(1);
                            return ` ${context.label}: ${context.parsed.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render an animated half-circle gauge showing fairness score 0-100
 * Uses Chart.js doughnut with center-text plugin, counts up from 0
 * @param {string} canvasId - Canvas element ID
 * @param {number} score - Fairness score 0-100
 */
function renderFairnessGauge(canvasId, score) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    score = Math.max(0, Math.min(100, Math.round(score)));

    function getGaugeColor(val) {
        if (val < 50) return '#ef4444';
        if (val < 75) return '#f59e0b';
        return '#10b981';
    }

    const gaugeColor = getGaugeColor(score);
    const remaining = 100 - score;

    // Animation state
    let currentDisplay = 0;
    const animDuration = 1500; // ms
    let animStart = null;

    // Easing function (ease-out cubic)
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Center text plugin — draws score number + label on the canvas
    const centerTextPlugin = {
        id: 'fairnessGaugeCenterText',
        afterDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;

            const centerX = (chartArea.left + chartArea.right) / 2;
            // Position text in the bottom-center of the half circle
            const centerY = chartArea.bottom - 8;

            const displayVal = Math.round(currentDisplay);
            const activeColor = getGaugeColor(displayVal);

            // Score number
            ctx.save();
            ctx.font = "700 3rem 'JetBrains Mono', monospace";
            ctx.fillStyle = activeColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(displayVal, centerX, centerY - 4);

            // Label
            ctx.font = "500 0.8rem 'Sora', sans-serif";
            ctx.fillStyle = '#94a3b8';
            ctx.textBaseline = 'top';
            ctx.fillText('Fairness Score', centerX, centerY + 2);
            ctx.restore();
        }
    };

    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 100], // start at 0, animate up
                backgroundColor: [gaugeColor, 'rgba(255,255,255,0.05)'],
                borderColor: ['transparent', 'transparent'],
                borderWidth: 0,
                circumference: 180,
                rotation: -90
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            animation: false,
            layout: {
                padding: { top: 0, bottom: 0, left: 0, right: 0 }
            }
        },
        plugins: [centerTextPlugin]
    });

    // Animate score count-up and arc fill
    function animateGauge(timestamp) {
        if (!animStart) animStart = timestamp;
        const elapsed = timestamp - animStart;
        const progress = Math.min(elapsed / animDuration, 1);
        const easedProgress = easeOutCubic(progress);

        currentDisplay = easedProgress * score;
        const currentScore = currentDisplay;
        const currentRemaining = 100 - currentScore;
        const currentColor = getGaugeColor(Math.round(currentDisplay));

        chart.data.datasets[0].data = [currentScore, currentRemaining];
        chart.data.datasets[0].backgroundColor = [currentColor, 'rgba(255,255,255,0.05)'];
        chart.update('none');

        if (progress < 1) {
            requestAnimationFrame(animateGauge);
        }
    }

    requestAnimationFrame(animateGauge);
}
