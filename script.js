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
        const scaleW = (container.clientWidth  || 600) / unscaled.width;
        const scaleH = (container.clientHeight || 250) / unscaled.height;
        const scale  = Math.min(scaleW, scaleH) * dpr;
        const vp = page.getViewport({ scale });
        canvas.width  = vp.width;
        canvas.height = vp.height;
        canvas.style.width  = (vp.width  / dpr) + 'px';
        canvas.style.height = (vp.height / dpr) + 'px';
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

// Image lightbox
const imgLb        = document.getElementById('img-lightbox');
const imgLbImg     = document.getElementById('img-lightbox-img');
const imgLbPag     = document.getElementById('img-lightbox-pagination');
const imgLbPrev    = document.getElementById('img-lightbox-prev');
const imgLbNext    = document.getElementById('img-lightbox-next');
let imgLbSlides    = [];
let imgLbIndex     = 0;
let imgLbShowFn    = null;

function updateImgLb() {
  const img = imgLbSlides[imgLbIndex].querySelector('img');
  imgLbImg.src = img.src;
  imgLbImg.alt = img.alt;
  const multi = imgLbSlides.length > 1;
  imgLbPag.style.display  = multi ? '' : 'none';
  imgLbPrev.style.display = multi ? '' : 'none';
  imgLbNext.style.display = multi ? '' : 'none';
  if (multi) imgLbPag.textContent = `${imgLbIndex + 1} / ${imgLbSlides.length}`;
}
function openImgLb(slides, index, showFn) {
  imgLbSlides = slides; imgLbIndex = index; imgLbShowFn = showFn;
  updateImgLb();
  imgLb.classList.add('open');
}
function closeImgLb() { imgLb.classList.remove('open'); }

imgLbPrev.addEventListener('click', () => {
  imgLbIndex = (imgLbIndex - 1 + imgLbSlides.length) % imgLbSlides.length;
  updateImgLb(); if (imgLbShowFn) imgLbShowFn(imgLbIndex);
});
imgLbNext.addEventListener('click', () => {
  imgLbIndex = (imgLbIndex + 1) % imgLbSlides.length;
  updateImgLb(); if (imgLbShowFn) imgLbShowFn(imgLbIndex);
});
document.getElementById('img-lightbox-close').addEventListener('click', closeImgLb);
imgLb.addEventListener('click', e => { if (e.target === imgLb) closeImgLb(); });
document.addEventListener('keydown', e => {
  if (!imgLb.classList.contains('open')) return;
  if (e.key === 'Escape') { closeImgLb(); return; }
  if (e.key === 'ArrowLeft')  imgLbPrev.click();
  if (e.key === 'ArrowRight') imgLbNext.click();
});

// Image carousels
document.querySelectorAll('.media-carousel').forEach(carousel => {
  const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
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

  slides.forEach((slide, i) => {
    const img = slide.querySelector('img');
    if (img) img.addEventListener('click', () => openImgLb(slides, i, show));
  });
});
