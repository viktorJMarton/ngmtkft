import './style.css';
import { ViewportObserver, listenToMediaQuery, observeSize, scrollCarousel, setupGalleryScrollMotion, setupReadableScroll } from './motion.js';

setupReadableScroll();

// Release the entrance animation's transform so normal card hover still works.
document.addEventListener('animationend', event => {
  if (event.target.classList.contains('reveal-visible')) {
    event.target.style.animation = 'none';
  }
});

document.querySelectorAll('.partner-group img').forEach(logo => {
  let touchTimer;
  logo.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return;
    window.clearTimeout(touchTimer);
    logo.classList.add('is-touched');
    const release = () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      touchTimer = window.setTimeout(() => logo.classList.remove('is-touched'), 650);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  }, { passive: true });
});

const menu = document.querySelector('#mobile-menu');
const toggle = document.querySelector('#menu-toggle');
if (menu && toggle) {
  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
  };

  toggle.addEventListener('click', () => setOpen(menu.hidden));
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setOpen(false));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  listenToMediaQuery(window.matchMedia('(min-width: 768px)'), () => {
    setOpen(false);
  });
}

const gallery = document.querySelector('#hero-gallery');
const carousel = document.querySelector('#hero-carousel');

if (gallery && carousel) {
  const slides = [...carousel.querySelectorAll('.carousel-item')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let visible = true;
  let timer;
  let carouselWidth = 0;

  const showSlide = (next) => {
    index = (next + slides.length) % slides.length;
    scrollCarousel(carousel, index * carousel.clientWidth, reducedMotion.matches);
  };
  const updateAutoplay = () => {
    window.clearInterval(timer);
    if (visible && !document.hidden) {
      timer = window.setInterval(() => showSlide(index + 1), 6000);
    }
  };
  carousel.addEventListener('scroll', () => {
    index = Math.round(carousel.scrollLeft / carousel.clientWidth);
  }, { passive: true });
  document.addEventListener('visibilitychange', updateAutoplay);
  window.addEventListener('pageshow', updateAutoplay);
  listenToMediaQuery(reducedMotion, updateAutoplay);
  const captions = [...carousel.querySelectorAll('.hero-caption')];
  observeSize(captions, () => {
    const tallest = Math.max(...captions.map(caption => caption.offsetHeight));
    carousel.style.setProperty('--hero-caption-space', `${Math.ceil(tallest * 0.6)}px`);
  });

  observeSize([carousel], () => {
    const width = carousel.clientWidth;
    if (width !== carouselWidth) {
      carouselWidth = width;
      carousel.scrollLeft = index * width;
    }
  });
  new ViewportObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateAutoplay();
  }).observe(gallery);
  updateAutoplay();
}

const servicesIntro = document.querySelector('.services-intro');
const servicesSection = document.querySelector('#szolgaltatasok');
const servicesHeading = servicesSection?.querySelector('h2');
const serviceCards = [...(servicesSection?.querySelectorAll('.service-card') ?? [])];
if (servicesHeading && serviceCards.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let headingStarted;
  servicesHeading.classList.add('service-heading-reveal', 'reveal-pending');
  serviceCards.forEach(card => card.classList.add('service-card-reveal', 'reveal-pending'));
  const revealHeading = () => {
    if (headingStarted !== undefined) return;
    headingStarted = performance.now();
    servicesHeading.classList.add('reveal-visible');
    revealObserver.unobserve(servicesHeading);
  };
  const revealObserver = new ViewportObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealHeading();
      if (entry.target !== servicesHeading) {
        const index = serviceCards.indexOf(entry.target);
        const delay = Math.max(0, 900 - (performance.now() - headingStarted)) + index * 180;
        entry.target.style.setProperty('--reveal-delay', `${delay}ms`);
        entry.target.classList.add('reveal-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealObserver.observe(servicesHeading);
  serviceCards.forEach(card => revealObserver.observe(card));
}
if (servicesIntro && servicesSection) {
  servicesIntro.classList.add('is-pending');
  let introObserver;
  let resizeFrame;
  const observeViewportCenter = () => {
    introObserver?.disconnect();
    const inset = Math.round(window.innerHeight * 0.4);
    introObserver = new ViewportObserver(([entry]) => {
      servicesIntro.classList.toggle('is-visible', entry.isIntersecting);
    }, { rootMargin: `-${inset}px 0px -${inset}px 0px`, threshold: 0 });
    introObserver.observe(servicesSection);
  };
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(observeViewportCenter);
  }, { passive: true });
  observeViewportCenter();
}

setupGalleryScrollMotion([...document.querySelectorAll('.reference-section')]);

const processSection = document.querySelector('#rolunk');
const processLabel = processSection?.querySelector('.eyebrow');
const processHeading = processSection?.querySelector('h2');
const processCopy = processHeading?.nextElementSibling;
const processSteps = [...(processSection?.querySelectorAll('ol > li') ?? [])];
if (processLabel && processHeading && processCopy && processSteps.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let sequenceStarted;
  let typingStarted;
  const typingDuration = 2400;
  const text = processCopy.textContent;
  const characters = Array.from(text);
  const accessibleCopy = document.createElement('span');
  accessibleCopy.className = 'sr-only';
  accessibleCopy.textContent = text;
  const placeholder = document.createElement('span');
  placeholder.className = 'process-copy-placeholder';
  placeholder.setAttribute('aria-hidden', 'true');
  placeholder.textContent = text;
  const typedCopy = document.createElement('span');
  typedCopy.className = 'process-typed-copy';
  typedCopy.setAttribute('aria-hidden', 'true');
  processCopy.classList.add('process-copy');
  processCopy.replaceChildren(accessibleCopy, placeholder, typedCopy);
  processLabel.classList.add('references-label-reveal', 'reveal-pending');
  processHeading.classList.add('references-heading-reveal', 'reveal-pending');
  processSteps.forEach(step => step.classList.add('process-step-reveal', 'reveal-pending'));
  const startSequence = () => {
    if (sequenceStarted !== undefined) return;
    sequenceStarted = performance.now();
    processLabel.classList.add('reveal-visible');
    processHeading.classList.add('reveal-visible');
    processObserver.unobserve(processLabel);
    processObserver.unobserve(processHeading);
  };
  const startTyping = () => {
    if (typingStarted !== undefined) return;
    typingStarted = Math.max(performance.now(), sequenceStarted + 1750);
    const type = now => {
      const progress = Math.max(0, Math.min(1, (now - typingStarted) / typingDuration));
      typedCopy.textContent = characters.slice(0, Math.floor(characters.length * progress)).join('');
      if (progress < 1) window.requestAnimationFrame(type);
    };
    window.requestAnimationFrame(type);
    processObserver.unobserve(processCopy);
  };
  const processObserver = new ViewportObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      startSequence();
      const index = processSteps.indexOf(entry.target);
      if (entry.target === processCopy || index !== -1) startTyping();
      if (index !== -1) {
        const delay = Math.max(0, typingStarted + typingDuration - performance.now()) + index * 220;
        entry.target.style.setProperty('--reveal-delay', `${delay}ms`);
        entry.target.classList.add('reveal-visible');
        processObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  [processLabel, processHeading, processCopy, ...processSteps].forEach(element => processObserver.observe(element));
}

document.querySelectorAll('[data-work-gallery]').forEach(workGallery => {
  const workCarousel = workGallery.querySelector('.work-carousel');
  const workPrevious = workGallery.querySelector('[data-work-prev]');
  const workNext = workGallery.querySelector('[data-work-next]');
  if (workCarousel && workPrevious && workNext) {
    const slides = [...workCarousel.querySelectorAll('.carousel-item')];
    const title = workGallery.querySelector('[data-work-title]');
    const description = workGallery.querySelector('[data-work-description]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0;
    let width = workCarousel.clientWidth;
    const looping = slides.length > 1;
    const makeClone = slide => {
      const clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('aria-label');
      clone.dataset.loopClone = 'true';
      clone.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
      return clone;
    };
    if (looping) {
      workCarousel.prepend(makeClone(slides[slides.length - 1]));
      workCarousel.append(makeClone(slides[0]));
    }
    const physicalSlides = [...workCarousel.querySelectorAll('.carousel-item')];
    const position = physical => physicalSlides[physical].offsetLeft - physicalSlides[0].offsetLeft;
    if (looping) workCarousel.scrollLeft = position(1);
    let autoplayTimer;
    let settleTimer;
    let moving = false;
    let visible = false;
    const updateAutoplay = () => {
      window.clearInterval(autoplayTimer);
      if (visible && !document.hidden && slides.length > 1) {
        autoplayTimer = window.setInterval(() => move(1, false), 6000);
      }
    };
    const update = () => {
      const physical = Math.round(workCarousel.scrollLeft / width);
      index = looping ? ((physical - 1) % slides.length + slides.length) % slides.length : 0;
      workPrevious.disabled = !looping;
      workNext.disabled = !looping;
      title.textContent = slides[index].dataset.title;
      description.textContent = slides[index].dataset.description;
    };
    const settleLoop = () => {
      if (!looping || moving) return;
      const physical = Math.round(workCarousel.scrollLeft / width);
      if (physical < 0 || physical >= physicalSlides.length || Math.abs(workCarousel.scrollLeft - position(physical)) > 2) return;
      if (physical === 0) workCarousel.scrollLeft = position(slides.length);
      else if (physical === slides.length + 1) workCarousel.scrollLeft = position(1);
      update();
    };
    const move = (direction, manual = true) => {
      if (!looping) return;
      settleLoop();
      const current = Math.max(1, Math.min(slides.length, Math.round(workCarousel.scrollLeft / width)));
      moving = true;
      scrollCarousel(workCarousel, position(current + direction), reducedMotion.matches, () => {
        moving = false;
        settleLoop();
      });
      if (manual) updateAutoplay();
    };
    if (slides.length > 1) workGallery.querySelector('[data-work-controls]').classList.replace('hidden', 'flex');
    workPrevious.addEventListener('click', () => move(-1));
    workNext.addEventListener('click', () => move(1));
    workCarousel.addEventListener('scroll', () => {
      update();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settleLoop, 160);
    }, { passive: true });
    const interact = () => {
      moving = false;
      updateAutoplay();
    };
    workCarousel.addEventListener('pointerdown', interact, { passive: true });
    workCarousel.addEventListener('touchstart', interact, { passive: true });
    document.addEventListener('visibilitychange', updateAutoplay);
    window.addEventListener('pageshow', updateAutoplay);
    listenToMediaQuery(reducedMotion, updateAutoplay);
    new ViewportObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateAutoplay();
    }).observe(workCarousel);
    workCarousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    observeSize([workCarousel], () => {
      const nextWidth = workCarousel.clientWidth;
      if (nextWidth !== width) {
        width = nextWidth;
        moving = false;
        scrollCarousel(workCarousel, position(looping ? index + 1 : 0), true);
      }
      update();
    });
    update();
  }

});
