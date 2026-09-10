/* VKU Student Survey App - Core JavaScript Logic */

const STORAGE_KEY_URL = 'vku_survey_script_url';
const STORAGE_KEY_QUEUE = 'vku_survey_offline_queue';
const STORAGE_KEY_HISTORY = 'vku_survey_history';

// User's Google Sheet Web App Endpoint (Direct background submission)
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuU-juqAXqwRyfpqsVP9v37SzCEz3NXHTVgf_IJACT2iN0BXsNOsIZ93LPUjveTArF/exec';

// Default Mock / Demo Data
let historyData = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [
  {
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    fullName: 'Trần Lê Nguyên Hải',
    studentId: '22IT001',
    osPlatform: 'iOS',
    wifiRating: '4 ★',
    labRating: '5 ★',
    syncMode: 'Google Sheets (Synced)'
  }
];

let offlineQueue = JSON.parse(localStorage.getItem(STORAGE_KEY_QUEUE)) || [];

// Enable mouse wheel scrolling on Android Studio emulator and desktop browsers
window.addEventListener('wheel', (e) => {
  window.scrollBy({
    top: e.deltaY,
    behavior: 'auto'
  });
}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
  setupPlatformBadge();
  setupPWA();
  setupCapgoLiveUpdate();
  setupConfig();
  setupStarRatings();
  setupFormHandler();
  renderHistoryTable();
  updateQueueBadge();
});

/* --- Native & Platform Detection --- */
function setupPlatformBadge() {
  const brandBadge = document.querySelector('.brand-badge');
  if (!brandBadge) return;

  if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function') {
    const platform = window.Capacitor.getPlatform();
    if (platform === 'ios') {
      brandBadge.textContent = 'iOS';
      brandBadge.style.background = 'linear-gradient(135deg, #3b82f6, #6366f1)';
    } else if (platform === 'android') {
      brandBadge.textContent = 'Android';
      brandBadge.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else {
      brandBadge.textContent = 'VKU';
    }
  }
}

/* --- Capgo Live Update (OTA) --- */
async function setupCapgoLiveUpdate() {
  try {
    if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('CapacitorUpdater')) {
      const { CapacitorUpdater } = window.Capacitor.Plugins;
      
      // Let Capgo know that the web app loaded successfully to avoid auto-rollback
      await CapacitorUpdater.notifyAppReady();
      console.log('[Capgo] notifyAppReady() called successfully.');

      // Listen for download progress/completion events
      CapacitorUpdater.addListener('downloadComplete', (bundle) => {
        console.log('[Capgo] Live Update bundle downloaded:', bundle);
        showToast('🚀 Bản cập nhật mới đã sẵn sàng! Sẽ tự áp dụng khi mở lại app.');
      });
    }
  } catch (err) {
    console.warn('[Capgo] Live Update check skipped:', err);
  }
}

/* --- PWA & Network Monitoring --- */
function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] Service worker active scope:', reg.scope))
      .catch(err => console.error('[PWA] Registration failed:', err));
  }

  const netBadge = document.getElementById('netStatusBadge');
  const netText = document.getElementById('netStatusText');

  function updateNetworkStatus() {
    if (!netBadge || !netText) return;
    if (navigator.onLine) {
      netBadge.classList.remove('offline');
      netText.textContent = 'ONLINE';
      // Sync queue if items exist
      syncOfflineQueue();
    } else {
      netBadge.classList.add('offline');
      netText.textContent = 'OFFLINE';
      showToast('⚠️ Bạn đang ở chế độ Offline. Khảo sát sẽ tự động lưu tạm!');
    }
  }

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();
}

/* --- Google Sheets API Config & Settings Toggle --- */
function setupConfig() {
  const input = document.getElementById('scriptUrlInput');
  const btnSave = document.getElementById('btnSaveConfig');
  const btnSettings = document.getElementById('btnSettings');
  const configBanner = document.getElementById('configBanner');
  const savedUrl = localStorage.getItem(STORAGE_KEY_URL);

  if (savedUrl && input) {
    input.value = savedUrl;
  }

  if (btnSettings && configBanner) {
    btnSettings.addEventListener('click', () => {
      const isHidden = configBanner.style.display === 'none' || !configBanner.style.display;
      configBanner.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        configBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (btnSave && input) {
    btnSave.addEventListener('click', () => {
      const url = input.value.trim();
      if (url) {
        localStorage.setItem(STORAGE_KEY_URL, url);
        showToast('✅ Đã lưu Google Sheet Web App API Endpoint!');
      } else {
        localStorage.removeItem(STORAGE_KEY_URL);
        showToast('ℹ️ Đã chuyển về Endpoint mặc định.');
      }
      if (configBanner) {
        configBanner.style.display = 'none';
      }
    });
  }
}

/* --- Star Rating Widgets --- */
function setupStarRatings() {
  const starContainers = document.querySelectorAll('.star-rating');

  starContainers.forEach(container => {
    const targetId = container.getAttribute('data-target');
    const hiddenInput = document.getElementById(targetId);
    const btns = container.querySelectorAll('.star-btn');

    btns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        if (hiddenInput) hiddenInput.value = val;

        btns.forEach((b, idx) => {
          if (idx <= index) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
      });
    });
  });
}

/* --- Form Submit Handler --- */
function setupFormHandler() {
  const form = document.getElementById('surveyForm');
  const btnSubmit = document.getElementById('btnSubmit');
  if (!form || !btnSubmit) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const osRadio = document.querySelector('input[name="osPlatform"]:checked');
    const fullNameVal = document.getElementById('fullName').value.trim();
    const studentIdVal = document.getElementById('studentId').value.trim();
    const facultyClassVal = document.getElementById('facultyClass').value.trim();
    const dailyHoursVal = document.getElementById('dailyHours').value;
    const wifiRatingVal = document.getElementById('wifiRating').value + ' ★';
    const labRatingVal = document.getElementById('labRating').value + ' ★';
    const desiredFeaturesVal = document.getElementById('desiredFeatures').value.trim();

    const formData = {
      fullName: fullNameVal,
      studentId: studentIdVal,
      facultyClass: facultyClassVal,
      osPlatform: osRadio ? osRadio.value : 'iOS',
      dailyHours: dailyHoursVal,
      wifiRating: wifiRatingVal,
      labRating: labRatingVal,
      desiredFeatures: desiredFeaturesVal,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      syncMode: navigator.onLine ? 'Google Sheets (Synced)' : 'Offline (Chờ Sync)'
    };

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>⏳ Đang gửi dữ liệu...</span>';

    // Direct Google Apps Script Web App Endpoint
    const scriptUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SCRIPT_URL;

    if (navigator.onLine && scriptUrl) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        showToast('🎉 Gửi khảo sát lên Google Sheet thành công!');
        saveHistoryRecord(formData);
        form.reset();

        // Reset star ratings to default (3 and 4)
        resetStarRatings();

      } catch (err) {
        console.error('[API Error]', err);
        queueOfflineRecord(formData);
      }
    } else {
      queueOfflineRecord(formData);
      form.reset();
      resetStarRatings();
    }

    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<span>🚀 Gửi Khảo Sát Nhanh</span>';
  });
}

function resetStarRatings() {
  const wifiInput = document.getElementById('wifiRating');
  const labInput = document.getElementById('labRating');
  if (wifiInput) wifiInput.value = '3';
  if (labInput) labInput.value = '4';

  const wifiContainer = document.querySelector('[data-target="wifiRating"]');
  if (wifiContainer) {
    const btns = wifiContainer.querySelectorAll('.star-btn');
    btns.forEach((b, idx) => {
      if (idx < 3) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  const labContainer = document.querySelector('[data-target="labRating"]');
  if (labContainer) {
    const btns = labContainer.querySelectorAll('.star-btn');
    btns.forEach((b, idx) => {
      if (idx < 4) b.classList.add('active');
      else b.classList.remove('active');
    });
  }
}

/* --- Offline Queue Management --- */
function queueOfflineRecord(record) {
  record.syncMode = 'Offline (Chờ Sync)';
  offlineQueue.push(record);
  localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(offlineQueue));
  saveHistoryRecord(record);
  updateQueueBadge();
  showToast('📥 Đã lưu khảo sát vào bộ nhớ Offline!');
}

async function syncOfflineQueue() {
  if (offlineQueue.length === 0) return;

  const scriptUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SCRIPT_URL;
  if (!scriptUrl) return;

  showToast(`⚡ Đang đồng bộ ${offlineQueue.length} bản ghi Offline lên Google Sheet...`);

  const queueToSync = [...offlineQueue];
  offlineQueue = [];
  localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(offlineQueue));

  for (const item of queueToSync) {
    try {
      item.syncMode = 'Google Sheets (Auto-Synced)';
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (e) {
      console.error('Sync failed for item', e);
    }
  }

  updateQueueBadge();
  showToast('✅ Đã đồng bộ toàn bộ bản ghi Offline lên Google Sheet thành công!');
}

function updateQueueBadge() {
  const badge = document.getElementById('queueBadge');
  const count = document.getElementById('queueCount');
  if (!badge || !count) return;

  if (offlineQueue.length > 0) {
    badge.style.display = 'inline-flex';
    count.textContent = offlineQueue.length;
  } else {
    badge.style.display = 'none';
  }
}

function saveHistoryRecord(record) {
  historyData.unshift(record);
  if (historyData.length > 15) historyData.pop();
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(historyData));
  renderHistoryTable();
}

function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  historyData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span style="font-size: 0.75rem; color: var(--text-muted);">${item.timestamp}</span></td>
      <td><strong>${item.fullName}</strong></td>
      <td>${item.studentId}</td>
      <td><span style="font-weight: 700; color: var(--vku-cyan);">${item.osPlatform}</span></td>
      <td>W:${item.wifiRating} | L:${item.labRating}</td>
      <td><span style="color: ${item.syncMode.includes('Synced') ? 'var(--vku-emerald)' : 'var(--vku-amber)'}; font-weight: 600;">${item.syncMode}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/* --- Toast Notification Utility --- */
function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
