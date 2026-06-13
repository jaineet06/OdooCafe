import confetti from "canvas-confetti";

export function celebrateDiscount() {
  const duration = 2200;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ["#c25b3a", "#d4a853", "#6b7f6b", "#3b2314", "#f5f0e8"],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ["#c25b3a", "#d4a853", "#6b7f6b", "#3b2314", "#f5f0e8"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.55 },
    colors: ["#c25b3a", "#d4a853", "#6b7f6b"],
  });
  frame();
}

export function celebratePayment() {
  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 35,
    origin: { y: 0.6 },
    colors: ["#6b7f6b", "#d4a853", "#c25b3a"],
  });
}
