/* App Logic - Mobile Market Trends 2026 */

// Data Sets
const STRATEGIES_DATA = [
  {
    id: 'native',
    name: 'Native iOS / Android',
    stack: 'Swift (iOS) / Kotlin (Android)',
    perf: 100,
    perfText: '100% Native Speed',
    mvp: '6-8 Months',
    hardware: 'Full (100%)',
    store: 'Required',
    useCase: 'AAA 3D Games, AR/VR, Low-level Drivers',
    badgeColor: '#f43f5e'
  },
  {
    id: 'cross_flutter',
    name: 'Cross-Platform (Flutter)',
    stack: 'Dart (Impeller Engine)',
    perf: 92,
    perfText: '85-95% (60fps Impeller)',
    mvp: '3-4 Months',
    hardware: '~90% via Plugins',
    store: 'Required',
    useCase: 'High-performance Business & Consumer Apps',
    badgeColor: '#06b6d4'
  },
  {
    id: 'cross_rn',
    name: 'Cross-Platform (React Native)',
    stack: 'JavaScript / TypeScript',
    perf: 88,
    perfText: '85-95% (Fabric & JSI)',
    mvp: '3-4 Months',
    hardware: '~90% via Plugins',
    store: 'Required',
    useCase: 'Rapid iteration, Web-team skill transfer',
    badgeColor: '#6366f1'
  },
  {
    id: 'hybrid',
    name: 'Hybrid (Capacitor)',
    stack: 'HTML / CSS / JS (Web Tech)',
    perf: 70,
    perfText: '60-70% (WebView)',
    mvp: '1-2 Months',
    hardware: 'Good (Capacitor plugins)',
    store: 'Required',
    useCase: 'Wrapping existing Web/PWA into App Stores',
    badgeColor: '#f59e0b'
  },
  {
    id: 'pwa',
    name: 'Progressive Web App (PWA)',
    stack: 'HTML5 / Service Workers / JS',
    perf: 78,
    perfText: '70-80% (Modern V8)',
    mvp: 'Instant / 1 Month',
    hardware: 'Limited (Web APIs)',
    store: 'Not Needed (Web Link)',
    useCase: 'Emerging markets, Instant access, Content MVP',
    badgeColor: '#10b981'
  }
];

const CASE_STUDIES = [
  {
    id: 'spotify',
    brand: 'Spotify',
    tag: 'PWA Strategy',
    metric: '+136%',
    metricLabel: 'Desktop & Mobile Engagement',
    solution: 'PWA with Service Worker Cache API + Offline Music Sync',
    challenge: 'Deliver rapid streaming and offline playback without requiring full app store download on low-end devices.',
    result: '30% faster load speed, instant desktop app experience, offline music playback for premium users.'
  },
  {
    id: 'alibaba',
    brand: 'Alibaba',
    tag: 'Flutter Strategy',
    metric: '500M+',
    metricLabel: 'Xianyu App Users',
    solution: 'Migrated 500M+ user app to Flutter single codebase',
    challenge: 'Unify separate iOS and Android engineering teams and eliminate feature disparity.',
    result: '50% reduction in development time, 90% code reuse, smooth 60fps native performance.'
  },
  {
    id: 'discord',
    brand: 'Discord',
    tag: 'React Native Strategy',
    metric: '95%',
    metricLabel: 'Shared Codebase Across Platforms',
    solution: 'React Native for core chat and community hub',
    challenge: 'Maintain feature parity and rapid weekly release cadence across iOS and Android with a lean team.',
    result: 'Simultaneous weekly releases for iOS & Android with a single small core team.'
  },
  {
    id: 'burgerking',
    brand: 'Burger King',
    tag: 'Capacitor Strategy',
    metric: '100%',
    metricLabel: 'Brand Pixel-Consistency',
    solution: 'Capacitor native wrapper over existing Web Design System',
    challenge: 'Enforce strict brand guidelines across Web, mobile apps, in-store kiosks, and TV ads without re-writing native UI.',
    result: 'App feels completely native while reusing 100% of the existing web UI component library.'
  }
];

// Global State
let deferredPrompt = null;
let aiChartInstance = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupPWA();
  setupTabs();
  renderMatrixTable('all');
  setupMatrixFilters();
  setupCalculator();
  setupTrendsChart();
  renderCaseStudies();
  setupModal();
});

/* --- PWA Integration --- */
function setupPWA() {
  const badge = document.getElementById('onlineStatusBadge');
  const badgeText = document.getElementById('onlineStatusText');
  const installBtn = document.getElementById('btnInstallPwa');

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] Service Worker registered:', reg.scope))
      .catch(err => console.error('[PWA] Registration failed:', err));
  }

  // Network Status
  function updateOnlineStatus() {
    if (navigator.onLine) {
      badge.classList.remove('offline');
      badgeText.textContent = 'ONLINE (PWA ACTIVE)';
    } else {
      badge.classList.add('offline');
      badgeText.textContent = 'OFFLINE MODE';
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // Install Prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-flex';
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User response:', outcome);
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}

/* --- Tabs Setup --- */
function setupTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display = 'block';
      }
    });
  });
}

/* --- Matrix Table & Filters --- */
function renderMatrixTable(filterKey) {
  const tbody = document.getElementById('matrixTableBody');
  tbody.innerHTML = '';

  let filtered = [...STRATEGIES_DATA];
  if (filterKey === 'fast') {
    filtered = filtered.filter(item => item.id === 'pwa' || item.id === 'hybrid' || item.id.includes('cross'));
  } else if (filterKey === 'perf') {
    filtered = filtered.filter(item => item.perf >= 85);
  } else if (filterKey === 'store') {
    filtered = filtered.filter(item => item.store === 'Not Needed (Web Link)');
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="badge-tech">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${item.badgeColor};"></span>
          ${item.name}
        </div>
      </td>
      <td><code style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-cyan);">${item.stack}</code></td>
      <td>
        <div class="score-bar-container">
          <div class="score-bar-bg">
            <div class="score-bar-fill" style="width: ${item.perf}%; background: ${item.badgeColor};"></div>
          </div>
          <span style="font-weight: 700; font-size: 0.85rem;">${item.perf}%</span>
        </div>
      </td>
      <td><strong>${item.mvp}</strong></td>
      <td>${item.hardware}</td>
      <td style="color: var(--text-secondary); font-size: 0.85rem;">${item.useCase}</td>
    `;
    tbody.appendChild(tr);
  });
}

function setupMatrixFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMatrixTable(btn.getAttribute('data-filter'));
    });
  });
}

/* --- Tech Stack Decision Calculator --- */
function setupCalculator() {
  const form = document.getElementById('quizForm');
  const selects = form.querySelectorAll('select');

  selects.forEach(select => {
    select.addEventListener('change', calculateRecommendation);
  });

  calculateRecommendation();
}

function calculateRecommendation() {
  const type = document.getElementById('qType').value;
  const team = document.getElementById('qTeam').value;
  const budget = document.getElementById('qBudget').value;
  const hardware = document.getElementById('qHardware').value;

  let scores = {
    'Native': 50,
    'Cross-Platform (Flutter / RN)': 60,
    'Hybrid (Capacitor)': 40,
    'PWA': 40
  };

  // Type impact
  if (type === 'game_ar') scores['Native'] += 45;
  if (type === 'business') scores['Cross-Platform (Flutter / RN)'] += 35;
  if (type === 'pwa_web') scores['PWA'] += 50;
  if (type === 'pwa_wrap') scores['Hybrid (Capacitor)'] += 45;

  // Team skill impact
  if (team === 'js_ts') {
    scores['Cross-Platform (Flutter / RN)'] += 20;
    scores['Hybrid (Capacitor)'] += 15;
    scores['PWA'] += 15;
  }
  if (team === 'dart') scores['Cross-Platform (Flutter / RN)'] += 30;
  if (team === 'native_langs') scores['Native'] += 30;

  // Budget impact
  if (budget === 'tight') {
    scores['Cross-Platform (Flutter / RN)'] += 15;
    scores['PWA'] += 20;
    scores['Native'] -= 20;
  }

  // Hardware impact
  if (hardware === 'heavy') {
    scores['Native'] += 25;
    scores['Cross-Platform (Flutter / RN)'] += 10;
    scores['PWA'] -= 25;
  }

  // Sort scores
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const bestMatch = sorted[0];

  const recTitle = document.getElementById('recTitle');
  const recDesc = document.getElementById('recDesc');
  const breakdown = document.getElementById('scoresBreakdown');

  recTitle.textContent = bestMatch[0];
  
  if (bestMatch[0] === 'Native') {
    recDesc.textContent = 'Maximum performance and hardware control required (AAA Games, AR/VR, or specialized device APIs).';
  } else if (bestMatch[0].includes('Cross-Platform')) {
    recDesc.textContent = 'Best all-around balance: 90%+ code reuse, 85-95% native performance, and 50% faster MVP delivery.';
  } else if (bestMatch[0].includes('Hybrid')) {
    recDesc.textContent = 'Optimal for quickly wrapping an existing web application to ship into Apple & Google App Stores.';
  } else {
    recDesc.textContent = 'Ideal for instant web accessibility, zero app store friction, and maximum reach in poor connectivity markets.';
  }

  // Render breakdown bars
  breakdown.innerHTML = '';
  const maxScore = Math.max(...Object.values(scores));

  sorted.forEach(([name, score]) => {
    const pct = Math.min(100, Math.round((score / maxScore) * 100));
    const row = document.createElement('div');
    row.innerHTML = `
      <div class="breakdown-row">
        <span>${name}</span>
        <span style="font-weight: 700;">${pct}%</span>
      </div>
      <div class="score-bar-bg" style="margin-top: 0.25rem; margin-bottom: 0.6rem;">
        <div class="score-bar-fill" style="width: ${pct}%; background: ${name === bestMatch[0] ? 'var(--gradient-brand)' : 'var(--text-muted)'};"></div>
      </div>
    `;
    breakdown.appendChild(row);
  });
}

/* --- Trends Chart.js --- */
function setupTrendsChart() {
  const ctx = document.getElementById('aiTradeoffChart');
  if (!ctx) return;

  aiChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['User Privacy', 'Offline Readiness', 'Zero API Cost', 'Model Power & Freshness', 'Complex Reasoning'],
      datasets: [
        {
          label: 'On-Device ML (CoreML / TFLite)',
          data: [95, 100, 100, 45, 40],
          backgroundColor: 'rgba(6, 182, 212, 0.7)',
          borderColor: '#06b6d4',
          borderWidth: 1
        },
        {
          label: 'Cloud AI (LLM / Cloud APIs)',
          data: [40, 10, 20, 95, 95],
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: '#6366f1',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        x: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#f8fafc', font: { family: 'Plus Jakarta Sans' } }
        }
      }
    }
  });
}

/* --- Case Studies & Modal --- */
function renderCaseStudies() {
  const grid = document.getElementById('caseGrid');
  grid.innerHTML = '';

  CASE_STUDIES.forEach(item => {
    const card = document.createElement('div');
    card.className = 'case-card';
    card.innerHTML = `
      <div>
        <div class="case-brand">
          <span class="case-logo text-gradient">${item.brand}</span>
          <span class="case-tag">${item.tag}</span>
        </div>
        <div class="case-metric-huge">${item.metric}</div>
        <div class="case-metric-label">${item.metricLabel}</div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">${item.solution}</p>
      </div>
      <a href="#" class="btn-link" onclick="openCaseModal('${item.id}'); return false;">Explore Case Study &rarr;</a>
    `;
    grid.appendChild(card);
  });
}

function setupModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });
}

window.openCaseModal = function(caseId) {
  const item = CASE_STUDIES.find(c => c.id === caseId);
  if (!item) return;

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
      <h2 style="font-size: 1.8rem;" class="text-gradient">${item.brand}</h2>
      <span class="case-tag">${item.tag}</span>
    </div>
    
    <div style="margin-bottom: 1.5rem; background: rgba(255, 255, 255, 0.03); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass);">
      <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-emerald); font-family: var(--font-mono);">${item.metric}</div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">${item.metricLabel}</div>
    </div>

    <h4 style="margin-bottom: 0.4rem; color: var(--accent-cyan);">The Challenge</h4>
    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.5;">${item.challenge}</p>

    <h4 style="margin-bottom: 0.4rem; color: var(--accent-cyan);">The Architecture Solution</h4>
    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.5;">${item.solution}</p>

    <h4 style="margin-bottom: 0.4rem; color: var(--accent-cyan);">Business & Engineering Impact</h4>
    <p style="font-size: 0.9rem; color: var(--text-primary); line-height: 1.5;">${item.result}</p>
  `;

  document.getElementById('modalOverlay').classList.add('active');
};
