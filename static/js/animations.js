/**
 * FairSight — Minimal Scroll Animations
 * Only fade-up on scroll. No particles, no magnetic buttons, no tilt, no colored effects.
 */
document.addEventListener('DOMContentLoaded', function () {
    // IntersectionObserver for fade-up elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stagger based on sibling index
                const siblings = entry.target.parentElement ? Array.from(entry.target.parentElement.children) : [];
                const idx = siblings.indexOf(entry.target);
                const delay = Math.max(0, idx) * 80;
                setTimeout(() => entry.target.classList.add('visible'), delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
});
