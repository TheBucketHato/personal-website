// Mobile nav toggle
const toggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  toggle.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  });
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id], footer[id]');
const navItems = document.querySelectorAll('.nav-links a:not(.nav-cta)');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navItems.forEach(item => {
        item.classList.toggle(
          'active',
          item.getAttribute('href') === '#' + entry.target.id
        );
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));

// PDF slide carousels
const pdfCarousels = document.querySelectorAll('.pdf-carousel');
if (pdfCarousels.length > 0 && typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const lightbox    = document.getElementById('pdf-lightbox');
  const lbCanvas    = document.getElementById('lightbox-canvas');
  const lbCtx       = lbCanvas.getContext('2d');
  const lbPagination = document.getElementById('lightbox-pagination');
  const lbPrev      = document.getElementById('lightbox-prev');
  const lbNext      = document.getElementById('lightbox-next');
  let activePdfDoc  = null;
  let activePage    = 1;
  let activeRender  = null;

  function renderLightboxPage(pageNum) {
    activePdfDoc.getPage(pageNum).then(page => {
      const dpr = window.devicePixelRatio || 1;
      const unscaled = page.getViewport({ scale: 1 });
      const scale = Math.min(
        window.innerWidth  * 0.88 / unscaled.width,
        window.innerHeight * 0.82 / unscaled.height
      ) * dpr;
      const vp = page.getViewport({ scale });
      lbCanvas.width  = vp.width;
      lbCanvas.height = vp.height;
      lbCanvas.style.width  = (vp.width  / dpr) + 'px';
      lbCanvas.style.height = (vp.height / dpr) + 'px';
      return page.render({ canvasContext: lbCtx, viewport: vp }).promise;
    }).then(() => {
      lbPagination.textContent = `${pageNum} / ${activePdfDoc.numPages}`;
    });
  }

  function openLightbox(pdfDoc, page, renderFn) {
    activePdfDoc = pdfDoc;
    activePage   = page;
    activeRender = renderFn;
    renderLightboxPage(activePage);
    lightbox.classList.add('open');
  }

  function closeLightbox() { lightbox.classList.remove('open'); }

  lbPrev.addEventListener('click', () => {
    if (activePage > 1) { activePage--; renderLightboxPage(activePage); if (activeRender) activeRender(activePage); }
  });
  lbNext.addEventListener('click', () => {
    if (activePdfDoc && activePage < activePdfDoc.numPages) { activePage++; renderLightboxPage(activePage); if (activeRender) activeRender(activePage); }
  });
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (activePage > 1) { activePage--; renderLightboxPage(activePage); if (activeRender) activeRender(activePage); }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (activePdfDoc && activePage < activePdfDoc.numPages) { activePage++; renderLightboxPage(activePage); if (activeRender) activeRender(activePage); }
    }
  });

  pdfCarousels.forEach(container => {
    const canvas  = container.querySelector('.pdf-canvas');
    const ctx     = canvas.getContext('2d');
    const pagination = container.querySelector('.carousel-pagination');
    const prevBtn = container.querySelector('.carousel-button.prev');
    const nextBtn = container.querySelector('.carousel-button.next');
    let pdfDoc    = null;
    let currentPage = 1;
    let rendering = false;

    function renderPage(pageNum) {
      if (rendering) return;
      rendering = true;
      currentPage = pageNum;
      pdfDoc.getPage(pageNum).then(page => {
        const dpr = window.devicePixelRatio || 1;
        const unscaled = page.getViewport({ scale: 1 });
        const scale = (container.clientWidth || 600) / unscaled.width * dpr;
        const vp = page.getViewport({ scale });
        canvas.width  = vp.width;
        canvas.height = vp.height;
        canvas.style.width  = '100%';
        canvas.style.height = 'auto';
        return page.render({ canvasContext: ctx, viewport: vp }).promise;
      }).then(() => {
        rendering = false;
        pagination.textContent = `${pageNum} / ${pdfDoc.numPages}`;
      });
    }

    pdfjsLib.getDocument(container.dataset.pdf).promise.then(doc => {
      pdfDoc = doc;
      renderPage(1);
      prevBtn.addEventListener('click', () => { if (currentPage > 1) renderPage(currentPage - 1); });
      nextBtn.addEventListener('click', () => { if (currentPage < pdfDoc.numPages) renderPage(currentPage + 1); });
    }).catch(() => { pagination.textContent = 'Could not load PDF'; });

    canvas.addEventListener('click', () => { if (pdfDoc) openLightbox(pdfDoc, currentPage, renderPage); });

    container.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentPage > 1) renderPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1);
      }
    });
  });
}

// Image carousels
document.querySelectorAll('.media-carousel').forEach(carousel => {
  const slides = carousel.querySelectorAll('.carousel-slide');
  const pagination = carousel.querySelector('.carousel-pagination');
  let current = 0;

  function show(index) {
    slides[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (pagination) pagination.textContent = `${current + 1}/${slides.length}`;
  }

  slides[0].classList.add('active');

  carousel.querySelector('.prev').addEventListener('click', () => show(current - 1));
  carousel.querySelector('.next').addEventListener('click', () => show(current + 1));

  if (slides.length <= 1) {
    carousel.querySelector('.prev').style.display = 'none';
    carousel.querySelector('.next').style.display = 'none';
    if (pagination) pagination.style.display = 'none';
  }
});
