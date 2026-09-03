/* VKU Student Survey PWA - Core JavaScript Logic */

const STORAGE_KEY_URL = 'vku_survey_script_url';
const STORAGE_KEY_QUEUE = 'vku_survey_offline_queue';
const STORAGE_KEY_HISTORY = 'vku_survey_history';

// User's Google Sheet Web App Endpoint (Hardcoded for silent background submission)
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuU-juqAXqwRyfpqsVP9v37SzCEz3NXHTVgf_IJACT2iN0BXsNOsIZ93LPUjveTArF/exec';

// Default Mock / Demo Data
let historyData = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [
  {
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    fullName: 'Nguyễn Văn An',
    studentId: '22IT015',
    osPlatform: 'iOS',
    wifiRating: '4 ★',
    labRating: '5 ★',
    syncMode: 'Google Sheets (Synced)'
  }
];

let offlineQueue = JSON.parse(localStorage.getItem(STORAGE_KEY_QUEUE)) || [];

document.addEventListener('DOMContentLoaded', () => {
  setupPWA();
  setupConfig();
  setupStarRatings();
  setupFormHandler();
  renderHistoryTable();
  updateQueueBadge();
});

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
    if (navigator.onLine) {
      netBadge.classList.remove('offline');
      netText.textContent = 'ONLINE (PWA ACTIVE)';
      // Sync queue if items exist
      syncOfflineQueue();
    } else {
      netBadge.classList.add('offline');
      netText.textContent = 'OFFLINE MODE';
      showToast('⚠️ Bạn đang ở chế độ Offline. Khảo sát sẽ tự động lưu tạm!');
    }
  }

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();
}

/* --- Google Sheets API Config --- */
function setupConfig() {
  const input = document.getElementById('scriptUrlInput');
  const btnSave = document.getElementById('btnSaveConfig');
  const savedUrl = localStorage.getItem(STORAGE_KEY_URL);

  if (savedUrl) {
    input.value = savedUrl;
  }

  btnSave.addEventListener('click', () => {
    const url = input.value.trim();
    if (url) {
      localStorage.setItem(STORAGE_KEY_URL, url);
      showToast('✅ Đã lưu Google Sheet Web App API Endpoint!');
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
      showToast('ℹ️ Đã xóa Endpoint. Form sẽ dùng chế độ Demo.');
    }
  });
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
        hiddenInput.value = val;

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const osRadio = document.querySelector('input[name="osPlatform"]:checked');
    
    const formData = {
      fullName: document.getElementById('fullName').value.trim(),
      studentId: document.getElementById('studentId').value.trim(),
      facultyClass: document.getElementById('facultyClass').value.trim(),
      osPlatform: osRadio ? osRadio.value : 'iOS',
      dailyHours: document.getElementById('dailyHours').value,
      wifiRating: document.getElementById('wifiRating').value + ' ★',
      labRating: document.getElementById('labRating').value + ' ★',
      desiredFeatures: document.getElementById('desiredFeatures').value.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      syncMode: navigator.onLine ? 'Google Sheets (Synced)' : 'Offline (Chờ Sync)'
    };

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>⏳ Đang gửi dữ liệu...</span>';

    // Always use hardcoded Google Apps Script Web App Endpoint
    const scriptUrl = DEFAULT_SCRIPT_URL;

    if (navigator.onLine && scriptUrl) {
      try {
        // Send POST to Google Apps Script
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors', // Necessary for Google Apps Script Web Apps
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        showToast('🎉 Gửi khảo sát lên Google Sheet thành công!');
        saveHistoryRecord(formData);
        form.reset();

      } catch (err) {
        console.error('[API Error]', err);
        // Fallback to queue if request fails
        queueOfflineRecord(formData);
      }
    } else if (navigator.onLine && !scriptUrl) {
      // Mock / Demo mode when no URL configured
      showToast('ℹ️ Đã ghi nhận bản ghi (Chế độ Demo Web App)!');
      saveHistoryRecord(formData);
      form.reset();
    } else {
      // Offline mode
      queueOfflineRecord(formData);
      form.reset();
    }

    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<span>🚀 Gửi Khảo Sát Nhanh</span>';
  });
}

/* --- Offline Queue Management --- */
function queueOfflineRecord(record) {
  record.syncMode = 'Offline (Chờ Sync)';
  offlineQueue.push(record);
  localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(offlineQueue));
  saveHistoryRecord(record);
  updateQueueBadge();
  showToast('📥 Đã lưu khảo sát vào bộ nhớ Offline PWA!');
}

async function syncOfflineQueue() {
  if (offlineQueue.length === 0) return;

  const scriptUrl = DEFAULT_SCRIPT_URL;
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
  tbody.innerHTML = '';

  historyData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code style="font-family: var(--font-mono); font-size: 0.75rem;">${item.timestamp}</code></td>
      <td><strong>${item.fullName}</strong></td>
      <td>${item.studentId}</td>
      <td><span style="font-weight: 700; color: var(--vku-cyan);">${item.osPlatform}</span></td>
      <td>Wifi: ${item.wifiRating} | Lab: ${item.labRating}</td>
      <td><span style="color: ${item.syncMode.includes('Synced') ? 'var(--vku-emerald)' : 'var(--vku-amber)'}; font-weight: 600;">${item.syncMode}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/* --- Toast Notification Utility --- */
function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
