// ==========================================
// Chronicles of the Fallen Crown - Main Entry Point
// ==========================================

import { Game } from './game.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }

  const game = new Game(canvas);
  game.start();

  // Handle window resize
  function resizeCanvas() {
    const container = document.getElementById('game-container');
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    const aspect = 960 / 640;

    let width = maxWidth;
    let height = width / aspect;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspect;
    }

    container.style.width = width + 'px';
    container.style.height = height + 'px';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  console.log('Chronicles of the Fallen Crown initialized!');
});
