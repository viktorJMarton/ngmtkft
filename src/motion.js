// Use a viewport check as well as the native observer: transformed elements and
// Safari's changing browser toolbar must not leave content permanently hidden.
export class ViewportObserver {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.targets = new Map();
    this.options = options;
    this.frame = 0;
    this.schedule = () => {
      if (!this.frame) this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.check();
      });
    };
    if ('IntersectionObserver' in window) {
      this.native = new IntersectionObserver(entries => this.deliver(entries), { ...options, threshold: 0 });
    }
    window.addEventListener('scroll', this.schedule, { passive: true });
    window.addEventListener('resize', this.schedule, { passive: true });
    window.addEventListener('pageshow', this.schedule);
    window.visualViewport?.addEventListener('resize', this.schedule);
  }
  deliver(entries) {
    const changes = entries.filter(entry => {
      if (!this.targets.has(entry.target) || this.targets.get(entry.target) === entry.isIntersecting) return false;
      this.targets.set(entry.target, entry.isIntersecting);
      return true;
    });
    if (changes.length) this.callback(changes);
  }
  check() {
    const margins = (this.options.rootMargin || '0px 0px 0px 0px').split(' ').map(parseFloat);
    const height = window.innerHeight;
    this.deliver([...this.targets.keys()].map(target => {
      const rect = target.getBoundingClientRect();
      return { target, isIntersecting: rect.bottom > -margins[0] && rect.top < height + (margins[2] || 0) && rect.right > 0 && rect.left < window.innerWidth };
    }));
  }
  observe(target) {
    this.targets.set(target, undefined);
    this.native?.observe(target);
    this.schedule();
  }
  unobserve(target) {
    this.targets.delete(target);
    this.native?.unobserve(target);
    if (!this.targets.size) this.disconnect();
  }
  disconnect() {
    this.native?.disconnect();
    this.targets.clear();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    window.removeEventListener('scroll', this.schedule);
    window.removeEventListener('resize', this.schedule);
    window.removeEventListener('pageshow', this.schedule);
    window.visualViewport?.removeEventListener('resize', this.schedule);
  }
}

export function listenToMediaQuery(query, callback) {
  if (query.addEventListener) query.addEventListener('change', callback);
  else query.addListener(callback);
}

export function observeSize(targets, callback) {
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(callback);
    targets.forEach(target => observer.observe(target));
  } else {
    window.addEventListener('resize', callback, { passive: true });
    window.addEventListener('load', callback);
    requestAnimationFrame(callback);
  }
}

export function setupReadableScroll() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let destination = window.scrollY;
  let previousTime = 0;
  let lastWritten = window.scrollY;
  const limit = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    destination = window.scrollY;
  };
  const animate = now => {
    const elapsed = Math.min(32, Math.max(1, now - previousTime));
    previousTime = now;
    // A scrollbar drag, keyboard navigation or an anchor always takes priority.
    if (Math.abs(window.scrollY - lastWritten) > 40) {
      stop();
      return;
    }
    destination = Math.max(0, Math.min(limit(), destination));
    const remaining = destination - window.scrollY;
    const maxSpeed = window.innerWidth < 768 ? 1000 : 1300;
    const step = Math.sign(remaining) * Math.min(Math.abs(remaining), maxSpeed * elapsed / 1000);
    window.scrollTo(0, window.scrollY + step);
    lastWritten = window.scrollY;
    if (Math.abs(destination - lastWritten) > 1) frame = requestAnimationFrame(animate);
    else stop();
  };
  const queue = delta => {
    if (!frame) {
      destination = window.scrollY;
      lastWritten = window.scrollY;
      previousTime = performance.now();
    }
    if (Math.sign(delta) !== Math.sign(destination - window.scrollY)) destination = window.scrollY;
    const runway = Math.min(450, window.innerHeight * .55);
    destination = Math.max(0, Math.min(limit(), Math.max(window.scrollY - runway, Math.min(window.scrollY + runway, destination + delta))));
    if (!frame) frame = requestAnimationFrame(animate);
  };
  const usesNativeScroll = target => {
    if (!(target instanceof Element)) return false;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return true;
    for (let node = target; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      if (node.scrollHeight > node.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(node).overflowY)) return true;
    }
    return false;
  };
  window.addEventListener('wheel', event => {
    if (event.defaultPrevented || reducedMotion.matches || event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || usesNativeScroll(event.target)) return;
    if (!event.cancelable) return;
    const unit = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? window.innerHeight : 1;
    const delta = event.deltaY * unit;
    if (!delta) return;
    event.preventDefault();
    queue(Math.sign(delta) * Math.min(Math.abs(delta), 160));
  }, { passive: false });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('pointerdown', stop, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stop();
  });
  window.addEventListener('pageshow', stop);
  listenToMediaQuery(reducedMotion, stop);
}

const scrollAnimations = new WeakMap();
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};

export function setupGalleryScrollMotion(sections) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const states = sections.map(section => ({
    section,
    layout: section.querySelector('.reference-layout'),
    copy: section.querySelector('.reference-copy'),
    label: section.querySelector('.eyebrow'),
    heading: section.querySelector('h2'),
    description: section.querySelector('.reference-copy > p:last-child'),
    anchor: section.querySelector('.reference-gallery'),
    card: section.querySelector('.project-card'),
  })).filter(state => state.layout && state.copy && state.anchor && state.card);
  if (!states.length) return;
  states.forEach(state => {
    state.label?.classList.add('gallery-scroll-label');
    state.heading?.classList.add('gallery-scroll-heading');
    state.description?.classList.add('gallery-scroll-copy');
    state.card.classList.add('gallery-scroll-card');
  });
  let frame = 0;
  const paint = (element, opacity, transform) => {
    if (!element) return;
    element.style.opacity = String(opacity);
    element.style.transform = transform;
  };
  const render = () => {
    frame = 0;
    const height = window.innerHeight;
    // Read stable, untransformed anchors before writing any animated styles.
    const positions = states.map(state => ({
      copyTop: state.copy.getBoundingClientRect().top,
      galleryTop: state.anchor.getBoundingClientRect().top,
    }));
    states.forEach((state, index) => {
      const position = positions[index];
      const complete = reducedMotion.matches;
      const copyProgress = (height * .9 - position.copyTop) / (height * .55);
      const label = complete ? 1 : smooth(copyProgress / .35);
      const heading = complete ? 1 : smooth((copyProgress - .18) / .47);
      const description = complete ? 1 : smooth((copyProgress - .32) / .5);
      const card = complete ? 1 : smooth((height * .92 - position.galleryTop) / (height * .42));
      paint(state.label, label, `translate3d(${64 * (1 - label)}px, 0, 0) scale(${3 - 2 * label})`);
      paint(state.heading, heading, `translate3d(${-40 * (1 - heading)}px, 0, 0)`);
      paint(state.description, description, `translate3d(0, ${14 * (1 - description)}px, 0)`);
      paint(state.card, card, `translate3d(0, ${32 * (1 - card)}px, 0) scale(${.96 + .04 * card})`);
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  listenToMediaQuery(reducedMotion, schedule);
  observeSize(states.map(state => state.layout), schedule);
  schedule();
}

export function scrollCarousel(element, left, immediate = false, onComplete = () => {}) {
  scrollAnimations.get(element)?.();
  const destination = Math.max(0, Math.min(element.scrollWidth - element.clientWidth, left));
  if (immediate) {
    element.scrollLeft = destination;
    onComplete();
    return;
  }
  const from = element.scrollLeft;
  const started = performance.now();
  const snap = element.style.scrollSnapType;
  element.style.scrollSnapType = 'none';
  let frame;
  const stop = () => {
    cancelAnimationFrame(frame);
    element.style.scrollSnapType = snap;
    element.removeEventListener('pointerdown', stop);
    element.removeEventListener('touchstart', stop);
    scrollAnimations.delete(element);
  };
  const animate = now => {
    const progress = Math.min(1, (now - started) / 550);
    element.scrollLeft = from + (destination - from) * (1 - Math.pow(1 - progress, 3));
    if (progress < 1) frame = requestAnimationFrame(animate);
    else {
      stop();
      onComplete();
    }
  };
  element.addEventListener('pointerdown', stop, { passive: true });
  element.addEventListener('touchstart', stop, { passive: true });
  scrollAnimations.set(element, stop);
  frame = requestAnimationFrame(animate);
}
