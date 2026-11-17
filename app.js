// Bokrah Retail Landing Page & Releases Client Scripts
document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initFaqAccordion();
  initLanguageToggle();
  initMobileMenu();
  fetchLatestGithubRelease();
  if (document.getElementById('releasesList')) {
    fetchAllGithubReleases();
  }
});

// Primary repository for Bokrah Retail desktop application
const PRIMARY_REPO = 'Mahfoud-Sa/bokrahRetail';
const FALLBACK_REPO = 'Mahfoud-Sa/bokrah';

// Navbar background blur on scroll
function initNavbarScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

// FAQ Accordion
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(other => other.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

// Mobile Menu Toggle
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const isVisible = navLinks.style.display === 'flex';
    if (isVisible) {
      navLinks.style.display = 'none';
    } else {
      navLinks.style.display = 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '76px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = '#ffffff';
      navLinks.style.padding = '20px 24px';
      navLinks.style.borderBottom = '1px solid #e3ebe7';
      navLinks.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
    }
  });
}

// Helper to find the best Windows installer asset
function findWindowsInstallerAsset(assets) {
  if (!Array.isArray(assets) || assets.length === 0) return null;

  // 1. Look for specific bokrah retail installer .exe
  let exeAsset = assets.find(a => {
    const name = (a.name || '').toLowerCase();
    return (name.includes('bokrah-setup') ||
            name.includes('bokrah-retailer-setup') ||
            name.includes('bokrah-retail-setup')) && name.endsWith('.exe');
  });

  // 2. Look for any installer/setup .exe
  if (!exeAsset) {
    exeAsset = assets.find(a => {
      const name = (a.name || '').toLowerCase();
      return (name.includes('setup') || name.includes('retail') || name.includes('install')) && name.endsWith('.exe');
    });
  }

  // 3. Fallback to any .exe asset
  if (!exeAsset) {
    exeAsset = assets.find(a => (a.name || '').toLowerCase().endsWith('.exe'));
  }

  return exeAsset;
}

// Helper to format bytes into readable MB
function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '~13.5 MB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Helper to format ISO date
function formatReleaseDate(isoString, lang = 'en') {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// GitHub Releases Dynamic Fetching for Landing Page (Latest)
async function fetchLatestGithubRelease() {
  const repos = [PRIMARY_REPO, FALLBACK_REPO];
  let releaseData = null;

  for (const repo of repos) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (res.ok) {
        const releases = await res.json();
        const stable = releases.find(r => !r.draft && !r.prerelease);
        if (stable) {
          releaseData = stable;
          break;
        }
      }
    } catch (e) {
      console.warn(`Could not fetch releases from ${repo}:`, e);
    }
  }

  if (!releaseData) return;

  const version = releaseData.tag_name || 'v3.5.1';
  
  let installerUrl = null;
  let installerSize = null;
  let installerFileName = `bokrah-setup-${version}.exe`;

  const exeAsset = findWindowsInstallerAsset(releaseData.assets);
  if (exeAsset) {
    installerUrl = exeAsset.browser_download_url;
    installerFileName = exeAsset.name || installerFileName;
    if (exeAsset.size) {
      installerSize = formatFileSize(exeAsset.size);
    }
  }

  // Fallback direct URL if asset array was empty
  if (!installerUrl) {
    installerUrl = `https://github.com/${PRIMARY_REPO}/releases/download/${version}/${installerFileName}`;
  }

  // Update DOM elements on index.html
  document.querySelectorAll('[data-release-version]').forEach(el => {
    el.textContent = version;
  });

  if (installerUrl) {
    document.querySelectorAll('[data-download-url]').forEach(el => {
      el.setAttribute('href', installerUrl);
    });
  }

  const btnLabels = document.querySelectorAll('[data-download-btn-label]');
  btnLabels.forEach(btn => {
    const lang = document.documentElement.getAttribute('lang') || 'en';
    if (lang === 'ar') {
      btn.textContent = `تحميل برنامج التثبيت (${installerFileName})`;
    } else {
      btn.textContent = `Download ${installerFileName}`;
    }
  });

  if (installerSize) {
    document.querySelectorAll('[data-release-size]').forEach(el => {
      el.textContent = installerSize;
    });
  }
}

// GitHub Releases Fetching for Dedicated Releases Page (All Versions)
async function fetchAllGithubReleases() {
  const container = document.getElementById('releasesList');
  if (!container) return;

  const loadingEl = document.getElementById('releasesLoading');
  const errorEl = document.getElementById('releasesError');

  try {
    const res = await fetch(`https://api.github.com/repos/${PRIMARY_REPO}/releases`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!res.ok) {
      throw new Error(`GitHub API responded with status ${res.status}`);
    }

    const releases = await res.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      throw new Error('No releases found');
    }

    // Filter out draft releases
    const publicReleases = releases.filter(r => !r.draft);

    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    renderReleases(publicReleases, container);
  } catch (err) {
    console.warn('Could not load dynamic releases from GitHub API, preserving fallback list:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
    }
  }
}

// Render release cards in the Releases list
function renderReleases(releases, container) {
  const lang = document.documentElement.getAttribute('lang') || 'en';
  const isAr = lang === 'ar';

  container.innerHTML = '';

  releases.forEach((release, index) => {
    const isLatest = index === 0;
    const version = release.tag_name || release.name || 'Release';
    const releaseName = release.name || release.tag_name || version;
    const publishedDate = formatReleaseDate(release.published_at || release.created_at, lang);

    // Find main installer (.exe)
    const exeAsset = findWindowsInstallerAsset(release.assets);
    const exeUrl = exeAsset
      ? exeAsset.browser_download_url
      : `https://github.com/${PRIMARY_REPO}/releases/download/${version}/bokrah-setup-${version}.exe`;
    const exeName = exeAsset ? exeAsset.name : `bokrah-setup-${version}.exe`;
    const exeSize = exeAsset && exeAsset.size ? formatFileSize(exeAsset.size) : '~13.5 MB';

    // Release Card element
    const card = document.createElement('article');
    card.className = `release-card ${isLatest ? 'is-latest' : ''}`;

    // Clean body or placeholder
    const bodyText = (release.body || '').trim() || (isAr ? 'إصدار رسمي مستقر لتطبيق بكرة ريتيل مع تحسينات الأداء ومزامنة نقاط البيع.' : 'Official production release of Bokrah Retail with performance enhancements and offline POS synchronization.');

    card.innerHTML = `
      <div class="release-card-header">
        <div class="release-version-group">
          <span class="release-version-tag">${escapeHtml(version)}</span>
          ${isLatest ? `<span class="release-badge-latest">${isAr ? 'الأحدث • رائج' : 'Latest Release'}</span>` : ''}
          ${release.prerelease ? `<span class="release-badge-pre">${isAr ? 'نسخة تجريبية' : 'Pre-release'}</span>` : ''}
        </div>
        <div class="release-date">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>${escapeHtml(publishedDate)}</span>
        </div>
      </div>

      <div class="release-title-row">
        <h3>${escapeHtml(releaseName)}</h3>
      </div>

      <div class="release-notes-box">
        <p>${escapeHtml(bodyText)}</p>
      </div>

      <div class="release-downloads-section">
        <h4 class="download-heading">${isAr ? 'ملفات التحميل المتوفرة:' : 'Download Packages:'}</h4>
        <div class="release-assets-grid">
          <a class="btn btn-emerald release-download-btn" href="${exeUrl}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <div class="btn-text-block">
              <strong>${escapeHtml(exeName)}</strong>
              <small>${isAr ? 'مثبت ويندوز 64-بت' : 'Windows 64-bit Installer'} • ${exeSize}</small>
            </div>
          </a>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Bilingual Language Switcher (EN <-> AR)
function initLanguageToggle() {
  const langBtn = document.querySelector('#langToggle');
  if (!langBtn) return;

  const currentLang = localStorage.getItem('bokrah_lang') || 'en';
  setLanguage(currentLang);

  langBtn.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('lang') || 'en';
    const next = active === 'en' ? 'ar' : 'en';
    setLanguage(next);
    localStorage.setItem('bokrah_lang', next);
  });
}

function setLanguage(lang) {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  const langBtn = document.querySelector('#langToggle');
  if (langBtn) {
    langBtn.textContent = lang === 'ar' ? 'English' : 'العربية';
  }

  // Translate all elements with data-en and data-ar
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
    if (text) {
      el.textContent = text;
    }
  });

  // Re-render releases list if present so language updates instantly
  if (document.getElementById('releasesList')) {
    fetchAllGithubReleases();
  }
}
