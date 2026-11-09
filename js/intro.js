// Homepage introduction video with the browser's own controls (seek bar, pause, volume, full screen).
// It starts muted when it scrolls into view (browsers only allow muted autoplay) and pauses when it leaves;
// "Sound on" restarts it from the beginning with sound; the speed buttons set the playback rate.
(function () {
  const v = document.getElementById('intro-video');
  if (!v) return;
  const sound = document.getElementById('intro-sound');
  const speeds = document.getElementById('intro-speed');
  const ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  let heard = false, userPaused = false, autoPausing = false;

  function renderSound() {
    sound.hidden = heard || !v.muted;
    sound.innerHTML = ICON_OFF + '<span>Sound on</span>';
    sound.setAttribute('aria-label', 'Turn sound on and play from the beginning');
  }
  sound.addEventListener('click', () => {
    heard = true; userPaused = false; v.currentTime = 0; v.muted = false;
    v.play().catch(() => {}); renderSound();
  });
  v.addEventListener('volumechange', () => { if (!v.muted) heard = true; renderSound(); });

  // remember a pause made by the viewer, so scrolling does not restart the video
  v.addEventListener('pause', () => { if (!autoPausing && !v.ended) userPaused = true; autoPausing = false; });
  v.addEventListener('play', () => { userPaused = false; });

  // speed buttons, kept in step with the browser's own speed menu
  const RATES = [0.75, 1, 1.25, 1.5, 2];
  speeds.innerHTML = '<span>Speed</span>' + RATES.map((r) =>
    `<button type="button" data-rate="${r}" aria-pressed="${r === 1}">${r}×</button>`).join('');
  speeds.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (b) v.playbackRate = +b.dataset.rate;
  });
  v.addEventListener('ratechange', () => speeds.querySelectorAll('button').forEach((b) =>
    b.setAttribute('aria-pressed', +b.dataset.rate === v.playbackRate)));

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((en) => {
      if (!v.muted || userPaused || v.ended) return;
      if (en.intersectionRatio < 0.25) { if (!v.paused) { autoPausing = true; v.pause(); } }
      else if (v.paused) v.play().catch(() => {});
    }), { threshold: [0, 0.25, 0.5] }).observe(v);
  }
  v.muted = true; renderSound();
})();
