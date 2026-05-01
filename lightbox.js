/**
 * 畫廊專用：自定義燈箱 (Lightbox) 腳本
 * 包含滑鼠滾輪縮放、點擊拖曳平移功能，並支援縮小自動置中
 */
(function() {
  // 1. 動態注入燈箱專用的 CSS
  const style = document.createElement('style');
  style.textContent = `
    .lightbox-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(28, 23, 16, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 9500; 
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: none; 
    }
    .lightbox-overlay.active {
      opacity: 1;
      pointer-events: all;
    }
    .lightbox-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .lightbox-img {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      transform-origin: center center;
      transition: transform 0.15s ease-out; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .lightbox-close {
      position: absolute;
      top: 2.5rem;
      right: 3.5rem;
      background: transparent;
      color: #ede8db; 
      border: 1px solid rgba(237, 232, 219, 0.3);
      border-radius: 50%;
      width: 44px;
      height: 44px;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9501;
      cursor: none;
      transition: all 0.3s;
    }
    .lightbox-close:hover {
      background: #b8292f; 
      border-color: #b8292f;
      color: #f4f0e6;
      transform: scale(1.1);
    }
    .lightbox-hint {
      position: absolute;
      bottom: 2.5rem;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'DM Mono', monospace;
      color: rgba(244, 240, 230, 0.5);
      font-size: 0.65rem;
      letter-spacing: 0.3em;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // 2. 建立燈箱的 DOM 元素
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  
  const container = document.createElement('div');
  container.className = 'lightbox-container';
  
  const img = document.createElement('img');
  img.className = 'lightbox-img';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.innerHTML = '✕';

  const hint = document.createElement('div');
  hint.className = 'lightbox-hint';
  hint.textContent = 'SCROLL TO ZOOM · DRAG TO MOVE';

  container.appendChild(img);
  overlay.appendChild(container);
  overlay.appendChild(closeBtn);
  overlay.appendChild(hint);
  document.body.appendChild(overlay);

  // 3. 狀態變數 (縮放與拖曳)
  let scale = 1;
  let isDragging = false;
  let startX, startY;
  let translateX = 0, translateY = 0;

  // 4. 更新圖片的變形狀態
  const updateTransform = () => {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  };

  const resetLightbox = () => {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform();
  };

  // 5. 開啟/關閉邏輯
  const openLightbox = (src) => {
    img.src = src;
    resetLightbox();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; 
  };

  const closeLightbox = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { img.src = ''; }, 300);
  };

  // 6. 綁定基本事件
  closeBtn.addEventListener('click', closeLightbox);
  container.addEventListener('click', (e) => {
    if (e.target === container) closeLightbox();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeLightbox();
  });

  // 7. 滑鼠滾輪縮放邏輯 (Zoom) - 【已優化：縮回中心點】
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSensitivity = 0.15; // 稍微調高靈敏度讓縮放更順
    const oldScale = scale;

    // deltaY < 0 代表往上滾 (放大)，反之縮小
    if (e.deltaY < 0) {
      scale += zoomSensitivity;
    } else {
      scale -= zoomSensitivity;
    }
    
    // 限制縮放比例 (最小 1 倍，最大 5 倍) -> 這樣縮到底就是原本大小
    scale = Math.min(Math.max(1, scale), 5);

    // 核心邏輯：控制縮小時回到中心
    if (scale === 1) {
      // 當縮放比例回到 1 時，強制平移座標歸零（完美置中）
      translateX = 0;
      translateY = 0;
    } else {
      // 放大或縮小時，讓目前的偏移量也等比例縮放，這樣縮小時畫面會自然往中心收攏
      const ratio = scale / oldScale;
      translateX *= ratio;
      translateY *= ratio;
    }

    updateTransform();
  }, { passive: false });

  // 8. 滑鼠拖曳平移邏輯 (Pan)
  img.addEventListener('mousedown', (e) => {
    e.preventDefault(); 
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    img.style.transition = 'none'; 
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      img.style.transition = 'transform 0.15s ease-out'; 
    }
  });

  // 9. 與自訂游標 (水墨圈圈) 進行連動
  const curRing = document.getElementById('cur-ring');
  const addHoverEffect = () => { if(curRing) curRing.classList.add('on-hover'); };
  const removeHoverEffect = () => { if(curRing) curRing.classList.remove('on-hover'); };
  
  closeBtn.addEventListener('mouseenter', addHoverEffect);
  closeBtn.addEventListener('mouseleave', removeHoverEffect);
  img.addEventListener('mouseenter', addHoverEffect);
  img.addEventListener('mouseleave', removeHoverEffect);

  // 10. 初始化：為畫廊圖片掛載點擊事件
  const initLightbox = () => {
    const galleryImages = document.querySelectorAll('.hero-media-right img, .artwork-img-wrap img');
    
    galleryImages.forEach(el => {
      el.parentElement.style.cursor = 'none'; 
      el.parentElement.setAttribute('data-hover', 'true');

      el.addEventListener('click', (e) => {
        const nsfwWrap = el.closest('.nsfw-wrap');
        if (nsfwWrap && !nsfwWrap.classList.contains('revealed')) {
           return; 
        }
        e.preventDefault();
        openLightbox(el.src);
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }

})();