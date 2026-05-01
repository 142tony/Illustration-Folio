/**
 * 質感預載腳本 (Preloader) - 專業優化版
 * 確保所有高解析度插畫資源加載完成後才移除遮罩
 */
(function() {
  // 1. 注入樣式
  const style = document.createElement('style');
  style.textContent = `
    #preloader-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: #f4f0e6;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .loader-content { text-align: center; width: 280px; }
    .loader-text {
      font-family: 'DM Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.3em;
      color: #b8292f;
      text-transform: uppercase;
      margin-bottom: 1.5rem;
    }
    .progress-container { width: 100%; height: 1px; background: rgba(28, 23, 16, 0.1); position: relative; overflow: hidden; }
    #progress-bar-fill {
      position: absolute;
      top: 0; left: 0; height: 100%;
      width: 0%;
      background: #b8292f;
      transition: width 0.3s ease-out;
    }
    #preloader-overlay.fade-out { opacity: 0; pointer-events: none; }
  `;
  document.head.appendChild(style);

  // 2. 建立 DOM
  const overlay = document.createElement('div');
  overlay.id = 'preloader-overlay';
  overlay.innerHTML = `
    <div class="loader-content">
      <div class="loader-text" id="loader-status">Initializing...</div>
      <div class="progress-container">
        <div id="progress-bar-fill"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const progressBar = document.getElementById('progress-bar-fill');
  const statusText = document.getElementById('loader-status');

  // 3. 資源追蹤
  const images = Array.from(document.querySelectorAll('img'));
  const videos = Array.from(document.querySelectorAll('video'));
  const totalAssets = images.length + videos.length;
  let loadedAssets = 0;
  let isFinished = false;

  const updateProgress = () => {
    if (isFinished) return;
    loadedAssets++;
    const percentage = Math.round((loadedAssets / totalAssets) * 100);
    
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (statusText) statusText.textContent = `Loading Assets ${percentage}%`;

    // 當資源計數達到總數，準備結束
    if (loadedAssets >= totalAssets) {
      checkFinalLoading();
    }
  };

  const finishLoading = () => {
    if (isFinished) return;
    isFinished = true;
    
    if (statusText) statusText.textContent = "Complete";
    if (progressBar) progressBar.style.width = "100%";

    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 800);
    }, 600);
  };

  // 最終檢查：確保 window.onload 也已觸發 (代表所有外部資源包含 CSS/影片都到位)
  const checkFinalLoading = () => {
    if (document.readyState === 'complete') {
      finishLoading();
    } else {
      window.addEventListener('load', finishLoading, { once: true });
    }
  };

  // 4. 開始監聽
  if (totalAssets === 0) {
    checkFinalLoading();
  } else {
    // 檢查圖片
    images.forEach(img => {
      if (img.complete) {
        updateProgress();
      } else {
        img.addEventListener('load', updateProgress, { once: true });
        img.addEventListener('error', updateProgress, { once: true });
      }
    });

    // 檢查影片 (改用較嚴格的 loadeddata，確保首幀已緩存)
    videos.forEach(video => {
      if (video.readyState >= 2) {
        updateProgress();
      } else {
        video.addEventListener('loadeddata', updateProgress, { once: true });
        video.addEventListener('error', updateProgress, { once: true });
      }
    });
  }

  // 設定一個較寬裕的安全超時 (例如 15 秒)，防止因極慢速網路導致訪客流失
  setTimeout(() => {
    if (!isFinished) {
      console.warn("Preloader timeout: forcing entry.");
      finishLoading();
    }
  }, 15000);

})();