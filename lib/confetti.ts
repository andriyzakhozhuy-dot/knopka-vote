const COLORS = ['#F5C518', '#E4572E', '#2E6FD9', '#63B05C', '#1FADA3'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  life: number;
}

export function burstConfetti(): void {
  const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight / 2;
  const particles: Particle[] = [];

  for (let i = 0; i < 90; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 7;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 4 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0,
    });
  }

  function animate() {
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
    let alive = false;
    particles.forEach((p) => {
      if (p.life > 90) return;
      alive = true;
      p.vy += 0.14;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;
      ctx!.save();
      ctx!.globalAlpha = Math.max(0, 1 - p.life / 90);
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    });
    if (alive) requestAnimationFrame(animate);
    else ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
  }

  requestAnimationFrame(animate);
}
