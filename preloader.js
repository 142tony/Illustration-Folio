/**
 * 質感預載腳本 (Preloader)
 * 嚴格遵守 ES6+ 規範，無依賴庫
 */
(function() {
  // 1. 注入預載器樣式 (使用和紙奢華色調)
  const style = document.createElement('style');
  style.textContent = `
    #preloader-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: #f4f0e6; /* var(--parchment) */
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .loader-content {
      text-align: center;
      width: 280px;
    }
    .loader-text {
      font-family: 'DM Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.3em;
      color: #b8292f; /* var(--crimson) */
      text-transform: uppercase;
      margin-bottom: 1.5rem;
    }
    .progress-container {
      width: 100%;
      height: 1px;
      background: rgba(28, 23, 16, 0.1);
      position: relative;
      overflow: hidden;
    }
    #progress-bar-fill {
      position: absolute;
      top: 0; left: 0; height: 100%;
      width: 0%;
      background: #b8292f;
      transition: width 0.4s ease-out;
    }
    #preloader-overlay.fade-out {
      opacity: 0;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // 2. 建立 DOM 結構
  const overlay = document.createElement('div');
  overlay.id = 'preloader-overlay';
  overlay.innerHTML = `
    <div class="loader-content">
      <div class="loader-text" id="loader-status">Caching Assets...</div>
      <div class="progress-container">
        <div id="progress-bar-fill"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // 3. 資源追蹤邏輯
  const progressBar = document.getElementById('progress-bar-fill');
  const statusText = document.getElementById('loader-status');
  
  // 獲取所有需要加載的資源 (圖片與影片)
  const medias = [...document.querySelectorAll('img, video')];
  const totalMedias = medias.length;
  let loadedCount = 0;

  /**
   * 更新進度條 UI
   */
  const updateProgress = () => {
    loadedCount++;
    const percentage = Math.round((loadedCount / totalMedias) * 100);
    
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    if (statusText) {
      statusText.textContent = `Loading ${percentage}%`;
    }

    // 當所有資源加載完成，或是達到超時限制
    if (loadedCount >= totalMedias) {
      finishLoading();
    }
  };

  /**
   * 結束預載並移除遮罩
   */
  const finishLoading = () => {
    setTimeout(() => {
      if (overlay) {
        overlay.classList.add('fade-out');
        // 移除 DOM 以節省資源
        setTimeout(() => overlay.remove(), 800);
      }
    }, 500); // 讓使用者看清楚 100% 的完成感
  };

  // 4. 開始追蹤
  if (totalMedias === 0) {
    finishLoading();
  } else {
    medias.forEach(media => {
      // 圖片加載檢查
      if (media.tagName === 'IMG') {
        if (media.complete) {
          updateProgress();
        } else {
          media.addEventListener('load', updateProgress);
          media.addEventListener('error', updateProgress); // 即使出錯也繼續進度
        }
      } 
      // 影片加載檢查 (至少加載部分數據)
      else if (media.tagName === 'VIDEO') {
        if (media.readyState >= 3) {
          updateProgress();
        } else {
          media.addEventListener('canplaythrough', updateProgress, { once: true });
          media.addEventListener('error', updateProgress, { once: true });
        }
      }
    });
  }

  // 設定備用方案：如果 5 秒內還沒加載完，強制關閉預載器 (避免無限轉圈)
  setTimeout(() => {
    if (document.getElementById('preloader-overlay')) {
      finishLoading();
    }
  }, 5000);

})();