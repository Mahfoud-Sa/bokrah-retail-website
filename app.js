// Bokrah Retail Landing Page Client Scripts
document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initFaqAccordion();
  initLanguageToggle();
  initMobileMenu();
  fetchLatestGithubRelease();
});

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

// GitHub Releases Dynamic Fetching
async function fetchLatestGithubRelease() {
  const repos = ['Mahfoud-Sa/bokrah', 'Mahfoud-Sa/bokrahRetail'];
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

  const version = releaseData.tag_name || 'v3.5.0';
  const htmlUrl = releaseData.html_url || 'https://github.com/Mahfoud-Sa/bokrah/releases';
  
  // Find Windows installer matching bokrah-retailer-setup{tag_release}.exe
  let installerUrl = null;
  let installerSize = null;

  if (Array.isArray(releaseData.assets)) {
    // 1. Look for asset specifically matching bokrah-retailer-setup
    let exeAsset = releaseData.assets.find(a => {
      const name = (a.name || '').toLowerCase();
      return name.includes('bokrah-retailer-setup') && name.endsWith('.exe');
    });

    // 2. Or any retailer setup .exe
    if (!exeAsset) {
      exeAsset = releaseData.assets.find(a => {
        const name = (a.name || '').toLowerCase();
        return (name.includes('setup') || name.includes('retail')) && name.endsWith('.exe');
      });
    }

    // 3. Fallback to any .exe asset
    if (!exeAsset) {
      exeAsset = releaseData.assets.find(a => (a.name || '').toLowerCase().endsWith('.exe'));
    }

    if (exeAsset) {
      installerUrl = exeAsset.browser_download_url;
      if (exeAsset.size) {
        installerSize = (exeAsset.size / (1024 * 1024)).toFixed(1) + ' MB';
      }
    }
  }

  // Fallback to the standardized binary naming format if asset list was empty
  if (!installerUrl) {
    installerUrl = `https://github.com/Mahfoud-Sa/bokrah/releases/download/${version}/bokrah-retailer-setup-${version}.exe`;
  }

  // Update DOM elements
  document.querySelectorAll('[data-release-version]').forEach(el => {
    el.textContent = version;
  });

  if (installerUrl) {
    document.querySelectorAll('[data-download-url]').forEach(el => {
      el.setAttribute('href', installerUrl);
    });
  }

  // Dynamic button label updating
  const btnLabel = document.querySelector('[data-download-btn-label]');
  if (btnLabel) {
    btnLabel.textContent = `Download bokrah-retailer-setup-${version}.exe`;
  }

  if (installerSize) {
    document.querySelectorAll('[data-release-size]').forEach(el => {
      el.textContent = installerSize;
    });
  }

  document.querySelectorAll('[data-release-notes]').forEach(el => {
    el.setAttribute('href', htmlUrl);
  });
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
}

