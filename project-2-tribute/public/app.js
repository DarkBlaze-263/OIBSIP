// Subtle scroll and interaction for tribute page
document.querySelectorAll('.bio-card').forEach((card, i) => {
  card.style.animationDelay = `${i * 0.1}s`;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('.bio-card, .legacy-list li, .quote').forEach((el) => {
  el.classList.add('animate-in');
  observer.observe(el);
});

// Add CSS for animate-in via style tag so we don't need to edit CSS
const style = document.createElement('style');
style.textContent = `
  .animate-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .animate-in.visible { opacity: 1; transform: translateY(0); }
  .legacy-list li { transition-delay: 0.1s; }
`;
document.head.appendChild(style);
