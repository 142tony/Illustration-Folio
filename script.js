(function() {
  /* ---- 基礎 DOM 元素 ---- */
  const dot  = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  const galleryContainer = document.getElementById('gallery');
  const progressBar = document.getElementById('progress-bar');
  
  if (!dot || !ring || !progressBar || !galleryContainer) return; // Null Check

  // 動態抓取最新的作品列（以利後續編號與觀察）
  const getArtworkRows = () => galleryContainer.querySelectorAll('.artwork-row');

    /* ---- 游標追蹤 (GPU 加速 + 節流) ---- */
    let rx = window.innerWidth / 2, ry = window.innerHeight / 2;
    let mx = rx, my = ry;
    let tickScheduled = false;

    // 預先將 dot / ring 放入合成層 (GPU 加速)，使用 transform 取代 left/top
    if (dot) {
      dot.style.willChange = 'transform';
      dot.style.transform = `translate(${mx - 2.5}px, ${my - 2.5}px)`;
    }
    if (ring) {
      ring.style.willChange = 'transform';
      ring.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`;
    }

    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      // 使用 requestAnimationFrame 節流 DOM 寫入
      if (!tickScheduled) {
        tickScheduled = true;
        requestAnimationFrame(() => {
          if (dot) dot.style.transform = `translate(${mx - 2.5}px, ${my - 2.5}px)`;
          tickScheduled = false;
        });
      }
    }, { passive: true });

    (function trackRing() {
      rx += (mx - rx) * 0.13;
      ry += (my - ry) * 0.13;
      if (ring) ring.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`;
      requestAnimationFrame(trackRing);
    })();

  /* 游標 hover 事件綁定 */
  const attachHoverEffect = (element) => {
    if (!element) return;
    element.addEventListener('mouseenter', () => ring.classList.add('on-hover'));
    element.addEventListener('mouseleave', () => ring.classList.remove('on-hover'));
  };

  document.querySelectorAll('[data-hover]').forEach(attachHoverEffect);

  /* ---- 【新實作】動態生成編號、統計與進度條 ---- */
  const currentRows = getArtworkRows();
  const progressItems = [];

  // 1. 更新作品總數統計文字
  const workCountElem = document.getElementById('work-count');
  if (workCountElem) {
    workCountElem.textContent = '— ' + String(currentRows.length).padStart(2, '0') + ' Works';
  }

  // 2. 遍歷各個作品列：動態寫入編號並生成進度條縮圖
  currentRows.forEach((row, index) => {
    const displayIndex = String(index + 1).padStart(3, '0');
    
    // 動態更新 HTML 內的編號
    const indexDiv = row.querySelector('.artwork-index');
    if (indexDiv) {
      indexDiv.textContent = displayIndex;
    }

    // 取得圖片資訊以利生成縮圖
    const imgElement = row.querySelector('img');
    const src = imgElement ? imgElement.src : '';
    const isNsfw = row.classList.contains('nsfw-wrap');
    
    // 建立進度條縮圖按鈕並填入對應編號與結構
    const thumbBtn = document.createElement('div');
    thumbBtn.className = `progress-item ${isNsfw ? 'nsfw-thumb' : ''}`;
    thumbBtn.innerHTML = `<img src="${src}" alt="thumbnail-${displayIndex}">`;
    
    // 綁定點擊平滑滾動事件
    thumbBtn.addEventListener('click', () => {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    // 綁定自訂游標 Hover 效果
    attachHoverEffect(thumbBtn);
    
    progressBar.appendChild(thumbBtn);
    progressItems.push(thumbBtn);
  });

    /* ---- Intersection Observer (畫廊滾動浮現 & 同步進度條高亮) ---- */
  const obsOptions = { rootMargin: '-40% 0px -40% 0px', threshold: 0 };
  let cachedRows = Array.from(getArtworkRows());
  
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        
        const index = cachedRows.indexOf(e.target);
        if (index !== -1 && progressItems[index]) {
          progressItems.forEach(item => item.classList.remove('active'));
          progressItems[index].classList.add('active');
        }
      }
    });
  }, obsOptions);

  cachedRows.forEach((row, i) => {
    row.style.transitionDelay = (i % 3) * 0.05 + 's';
    obs.observe(row);
  });

  /* ---- Custom Modal & R-18 邏輯 ---- */
  const modal      = document.getElementById('age-modal');
  const backdrop   = document.getElementById('modal-backdrop');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn  = document.getElementById('modal-cancel');
  const nsfwBtn    = document.getElementById('nsfw-btn');
  const nsfwWraps  = document.querySelectorAll('.nsfw-wrap');
  const nsfwThumbs = document.querySelectorAll('.nsfw-thumb'); // 此時縮圖已生成，可正確抓取
  const timeLabel  = document.getElementById('modal-time');
  let revealed = false;

  if (modal && nsfwBtn) {
    const openModal = () => {
      if (timeLabel) timeLabel.textContent = new Date().toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit'});
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (confirmBtn) confirmBtn.focus();
    };

    const closeModal = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    const reveal = () => {
      nsfwWraps.forEach(w => w.classList.add('revealed'));
      nsfwThumbs.forEach(t => t.classList.add('revealed')); // 解除縮圖模糊
      revealed = true;
      nsfwBtn.textContent = 'R–18  ON';
      nsfwBtn.classList.add('active');
      closeModal();
    };

    const hide = () => {
      nsfwWraps.forEach(w => w.classList.remove('revealed'));
      nsfwThumbs.forEach(t => t.classList.remove('revealed')); // 恢復縮圖模糊
      revealed = false;
      nsfwBtn.textContent = 'R–18  OFF';
      nsfwBtn.classList.remove('active');
    };

    nsfwBtn.addEventListener('click', () => {
      if (!revealed) openModal();
      else hide();
    });

    if (confirmBtn) confirmBtn.addEventListener('click', reveal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

    /* ---- 磁性 FAB (節流避免 layout thrashing) ---- */
  const fabBtn = document.querySelector('.fab-btn');
  if (fabBtn) {
    let fabX = 0, fabY = 0, fabW = 0, fabH = 0;
    // 以 requestAnimationFrame 批次更新 FAB 尺寸資訊
    let fabUpdateScheduled = false;
    const updateFabRect = () => {
      fabUpdateScheduled = false;
      const r = fabBtn.getBoundingClientRect();
      fabX = r.left; fabY = r.top; fabW = r.width; fabH = r.height;
    };
    updateFabRect(); // 初始化
    // 定期更新尺寸 (scroll, resize 可能導致位置改變)
    window.addEventListener('scroll', () => {
      if (!fabUpdateScheduled) { fabUpdateScheduled = true; requestAnimationFrame(updateFabRect); }
    }, { passive: true });
    window.addEventListener('resize', updateFabRect, { passive: true });

    window.addEventListener('mousemove', e => {
      if (fabUpdateScheduled) return; // 避免與 Rect 更新競爭
      const cx = fabX + fabW / 2;
      const cy = fabY + fabH / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < 90) {
        fabBtn.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
      } else {
        fabBtn.style.transform = 'translate(0,0)';
      }
    }, { passive: true });
  }

    /* ---- 葉音璃 圖片輪播 (預載 + requestAnimationFrame) ---- */
  const yeImages = [
    'image/葉音璃/葉音璃-CG1-1.jpg',
    'image/葉音璃/葉音璃-CG1-2.jpg',
    'image/葉音璃/葉音璃-CG1-3.jpg',
    'image/葉音璃/葉音璃-CG1-4.jpg',
    'image/葉音璃/葉音璃-CG1-5.jpg'
  ];
  const yeImgElement = document.getElementById('ye-yin-li-cg');
  let yeCurrentIndex = 0;
  if (yeImgElement) {
    // 預載所有圖片
    const preloaded = [];
    yeImages.forEach((src, i) => {
      const pre = new Image();
      pre.src = src;
      preloaded[i] = pre;
    });

    let lastYeTime = 0;
    const yeTick = (now) => {
      if (yeImgElement && yeImgElement.isConnected) {
        if (now - lastYeTime >= 1000) {
          lastYeTime = now;
          yeCurrentIndex = (yeCurrentIndex + 1) % yeImages.length;
          yeImgElement.src = yeImages[yeCurrentIndex];
        }
        requestAnimationFrame(yeTick);
      }
    };
    requestAnimationFrame(yeTick);
  }

    /* ---- Hero Slider 自動編號 ─ 根據出現順序動態填入 hero-deco-num ---- */
  const heroSlides = document.querySelectorAll('.hero-slide');
  const navLeftBtn = document.querySelector('.hero-nav-btn-left');
  const navRightBtn = document.querySelector('.hero-nav-btn-right');
  let currentSlideIndex = 0;

  // 遍歷所有 hero-slide，將其內部的 hero-deco-num 依序填入兩位數編號
  let decoCounter = 1;
  heroSlides.forEach(slide => {
    const decoNums = slide.querySelectorAll('.hero-deco-num');
    decoNums.forEach(el => {
      el.textContent = String(decoCounter).padStart(2, '0');
      decoCounter++;
    });
  });

  const showSlide = (index) => {
    if (index < 0) {
      currentSlideIndex = heroSlides.length - 1;
    } else if (index >= heroSlides.length) {
      currentSlideIndex = 0;
    } else {
      currentSlideIndex = index;
    }

    heroSlides.forEach((slide, i) => {
      const video = slide.querySelector('.hero-video');
      if (i === currentSlideIndex) {
        slide.classList.add('active');
        if (video) video.play();
      } else {
        slide.classList.remove('active');
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  };

  const nextSlide = () => showSlide(currentSlideIndex + 1);
  const prevSlide = () => showSlide(currentSlideIndex - 1);

  if (navLeftBtn) navLeftBtn.addEventListener('click', prevSlide);
  if (navRightBtn) navRightBtn.addEventListener('click', nextSlide);

  /* ---- 手機版滑動切換邏輯 ---- */
  let touchStartX = 0;
  let touchEndX = 0;
  const slidesContainer = document.querySelector('.hero-slides-container');

  if (slidesContainer) {
    slidesContainer.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slidesContainer.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchStartX - touchEndX;
      if (Math.abs(swipeDistance) > 50) {
        if (swipeDistance > 0) nextSlide();
        else prevSlide();
      }
    }, { passive: true });
  }

  showSlide(0); // 初始化顯示第一個幻燈片

  /* ---- 影片聲音切換邏輯 ---- */
  const videoContainers = document.querySelectorAll('.hero-media-left');
  
  videoContainers.forEach(container => {
    const video = container.querySelector('.hero-video');
    const btn = container.querySelector('.mute-toggle-btn');
    if (!video || !btn) return;

    const iconMuted = btn.querySelector('.icon-muted');
    const iconUnmuted = btn.querySelector('.icon-unmuted');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      if (video.muted) {
        iconMuted.style.display = 'block';
        iconUnmuted.style.display = 'none';
      } else {
        iconMuted.style.display = 'none';
        iconUnmuted.style.display = 'block';
      }
    });

    btn.addEventListener('mouseenter', () => {
      if (ring) ring.classList.add('on-hover');
    });
    btn.addEventListener('mouseleave', () => {
      if (ring) ring.classList.remove('on-hover');
    });
  });

})();