const DEFAULT_API_BASE = '/api';

function normalizeApiBase(base) {
  if (typeof base !== 'string') {
    return DEFAULT_API_BASE;
  }

  const trimmed = base.trim();

  if (!trimmed) {
    return DEFAULT_API_BASE;
  }

  if (trimmed === '/') {
    return '';
  }

  return trimmed.replace(/\/$/, '');
}

const API_BASE = normalizeApiBase(
  window.__ADMIN_CONFIG__?.apiBase ?? DEFAULT_API_BASE
);

const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const loginForm = document.getElementById('login-form');
const createContentForm = document.getElementById('create-content-form');
const updateContentForm = document.getElementById('update-content-form');
const uploadCvForm = document.getElementById('upload-cv-form');
const logoutButton = document.getElementById('logout-button');
const cancelUpdateButton = document.getElementById('cancel-update');
const createLanguageSelect = document.getElementById('create-language');
const createProjectTypeSelect = document.getElementById('create-project-type');
const createImageInput = document.getElementById('create-image');
const loginStatus = document.getElementById('login-status');
const adminStatus = document.getElementById('admin-status');
const contentTableBody = document.getElementById('content-table-body');
const deletedContentTableBody = document.getElementById('deleted-content-table-body');
const cvTableBody = document.getElementById('cv-table-body');
const updateSection = document.getElementById('update-section');
const updateIdInput = document.getElementById('update-id');
const updateTitleInput = document.getElementById('update-title');
const updateBodyInput = document.getElementById('update-body');
const updateLanguageSelect = document.getElementById('update-language');
const updateProjectTypeSelect = document.getElementById('update-project-type');
const updateImageInput = document.getElementById('update-image');
const updateImagePreviewContainer = document.getElementById('update-image-preview-container');
const updateImagePreview = document.getElementById('update-image-preview');
const updateImageLink = document.getElementById('update-image-link');
const updateRemoveImageCheckbox = document.getElementById('update-remove-image');
const siteCopyForm = document.getElementById('site-copy-form');
const siteCopyLanguageSelect = document.getElementById('site-copy-language');
const siteCopyKeyInput = document.getElementById('site-copy-key');
const siteCopyValueInput = document.getElementById('site-copy-value');
const siteCopySearchInput = document.getElementById('site-copy-search');
const siteCopyListContainer = document.getElementById('site-copy-list');
const siteCopyResetButton = document.getElementById('site-copy-reset');

const LANGUAGE_LABELS = {
  tr: 'Türkçe',
  en: 'İngilizce',
  multi: 'Çok Dilli',
};

const PROJECT_TYPE_LABELS = {
  workplace: 'Ofis / Çalışma',
  residential: 'Konut',
  hospitality: 'Misafirperverlik & Sosyal Alan',
  concept: 'Konsept Çalışması',
};

const DEFAULT_PROJECT_TYPE = 'workplace';
const SUPPORTED_SITE_COPY_LANGUAGES = ['tr', 'en'];

const SITE_COPY_LABEL_MAP = {
  'common.brand': 'Genel • Logo üzerindeki marka adı',
  'common.nav.home': 'Menü • Ana Sayfa bağlantısı',
  'common.nav.projects': 'Menü • Projeler bağlantısı',
  'common.nav.portfolio': 'Menü • Portfolyo bağlantısı',
  'common.nav.studio': 'Menü • Stüdyo bağlantısı',
  'common.nav.careers': 'Menü • Kariyer bağlantısı',
  'common.nav.contact': 'Menü • İletişim bağlantısı',
  'index.projects.title': 'Ana Sayfa • Projeler bloğu başlığı',
  'index.projects.body': 'Ana Sayfa • Projeler bloğu açıklaması',
  'index.projects.cta': 'Ana Sayfa • Projeler bloğu butonu',
  'projectsPage.hero.title': 'Projeler Sayfası • Kahraman başlığı',
  'projectsPage.hero.body': 'Projeler Sayfası • Kahraman açıklaması',
  'portfolioPage.hero.title': 'Portfolyo Sayfası • Kahraman başlığı',
  'portfolioPage.hero.body': 'Portfolyo Sayfası • Kahraman açıklaması',
  'portfolioPage.filters.label': 'Portfolyo Sayfası • Filtre başlığı',
  'contact.hero.title': 'İletişim Sayfası • Kahraman başlığı',
  'contact.hero.body': 'İletişim Sayfası • Kahraman açıklaması',
  'studio.hero.title': 'Stüdyo Sayfası • Kahraman başlığı',
  'studio.hero.body': 'Stüdyo Sayfası • Kahraman açıklaması',
};

const SITE_COPY_SEGMENT_LABELS = {
  common: 'Genel Metinler',
  index: 'Ana Sayfa',
  projects: 'Projeler Bloğu',
  projectsPage: 'Projeler Sayfası',
  portfolioPage: 'Portfolyo Sayfası',
  studio: 'Stüdyo Sayfası',
  contact: 'İletişim Sayfası',
  careers: 'Kariyer Sayfası',
  hero: 'Hero Alanı',
  title: 'Başlık',
  body: 'Açıklama',
  cta: 'Buton Yazısı',
  nav: 'Menü',
  footer: 'Alt Bilgi',
  menuPanel: 'Menü Paneli',
  cookie: 'Çerez Bilgisi',
  filters: 'Filtreler',
  guide: 'Kısa Bilgi',
  feed: 'Liste Mesajları',
  language: 'Dil Etiketleri',
  brand: 'Marka Adı',
  meta: 'Tarayıcı Başlıkları',
};

function humanizeSiteCopySegment(segment) {
  if (!segment) {
    return '';
  }

  return segment
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSiteCopyLabel(key) {
  if (!key) {
    return '';
  }

  if (SITE_COPY_LABEL_MAP[key]) {
    return SITE_COPY_LABEL_MAP[key];
  }

  const segments = key.split('.');
  const friendlySegments = segments.map((segment) => {
    if (SITE_COPY_SEGMENT_LABELS[segment]) {
      return SITE_COPY_SEGMENT_LABELS[segment];
    }
    return humanizeSiteCopySegment(segment);
  });

  return friendlySegments.join(' • ');
}

const normalizeLanguageValue = (value) => {
  if (typeof value !== 'string') {
    return 'tr';
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return 'tr';
  }
  if (['tr', 'en', 'multi'].includes(normalized)) {
    return normalized;
  }
  return 'tr';
};

const normalizeProjectTypeValue = (value) => {
  if (typeof value !== 'string') {
    return DEFAULT_PROJECT_TYPE;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_PROJECT_TYPE;
  }
  if (PROJECT_TYPE_LABELS[normalized]) {
    return normalized;
  }
  return DEFAULT_PROJECT_TYPE;
};

const getActiveSiteCopyLanguage = () => {
  if (!siteCopyLanguageSelect) {
    return SUPPORTED_SITE_COPY_LANGUAGES[0];
  }

  const value = siteCopyLanguageSelect.value;
  if (SUPPORTED_SITE_COPY_LANGUAGES.includes(value)) {
    return value;
  }

  return SUPPORTED_SITE_COPY_LANGUAGES[0];
};

const flattenSiteCopyEntries = (entries, prefix = '') => {
  if (!entries || typeof entries !== 'object') {
    return [];
  }

  return Object.entries(entries).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenSiteCopyEntries(value, path);
    }

    return [
      {
        key: path,
        value: value === undefined || value === null ? '' : String(value),
      },
    ];
  });
};

<<<<<<< HEAD
const ADMIN_TOKEN_STORAGE_KEY = 'adminToken';
=======
>>>>>>> origin/main
let token = '';
const siteCopyCache = SUPPORTED_SITE_COPY_LANGUAGES.reduce((acc, lang) => {
  acc[lang] = {};
  return acc;
}, {});
<<<<<<< HEAD

let storageAvailable = true;

function getStorage() {
  if (!storageAvailable) {
    return null;
  }

  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      storageAvailable = false;
      return null;
    }

    return window.localStorage;
  } catch (error) {
    storageAvailable = false;
    console.warn('localStorage kullanılamıyor. Token sadece bu sekmede saklanacak.', error);
    return null;
  }
}

function readTokenFromStorage() {
  const storage = getStorage();

  if (!storage) {
    return '';
  }

  try {
    return storage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
  } catch (error) {
    storageAvailable = false;
    console.warn('Admin token yerel depodan okunamadı.', error);
    return '';
  }
}

function writeTokenToStorage(value) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    if (value) {
      storage.setItem(ADMIN_TOKEN_STORAGE_KEY, value);
    } else {
      storage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    storageAvailable = false;
    console.warn('Admin token yerel depoya kaydedilemedi.', error);
  }
}
=======
>>>>>>> origin/main

function sanitizeToken(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function persistToken(value) {
  const sanitized = sanitizeToken(value);
  token = sanitized;
  writeTokenToStorage(sanitized);

  return sanitized;
}

function getBootstrapTokenFromConfig() {
  const bootstrapToken = window.__ADMIN_CONFIG__?.bootstrapToken;

  if (typeof bootstrapToken !== 'string') {
    return '';
  }

  return sanitizeToken(bootstrapToken);
}

function applyBootstrapTokenFromConfig() {
  const bootstrapToken = getBootstrapTokenFromConfig();

  if (bootstrapToken) {
    persistToken(bootstrapToken);
  }
}

token = sanitizeToken(readTokenFromStorage());
applyBootstrapTokenFromConfig();

function setStatus(element, message, isError = false) {
  if (!element) return;
  if (!message) {
    element.style.display = 'none';
    element.textContent = '';
    return;
  }
  element.textContent = message;
  element.style.display = 'block';
  element.style.backgroundColor = isError ? '#fee2e2' : '#eff6ff';
  element.style.color = isError ? '#b91c1c' : '#1e40af';
}

function renderSiteCopyList() {
  if (!siteCopyListContainer) {
    return;
  }

  const language = getActiveSiteCopyLanguage();
  const searchTerm = (siteCopySearchInput?.value || '').trim().toLowerCase();
  const entries = flattenSiteCopyEntries(siteCopyCache[language]);
  const filteredEntries = entries
    .filter(({ key, value }) => {
      if (!searchTerm) {
        return true;
      }

      return (
        key.toLowerCase().includes(searchTerm) ||
        value.toLowerCase().includes(searchTerm)
      );
    })
    .sort((a, b) => a.key.localeCompare(b.key, 'tr'));

  siteCopyListContainer.innerHTML = '';

  if (!filteredEntries.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent =
      'Henüz metin bulunamadı. Dil seçimini veya arama filtresini kontrol edin.';
    emptyMessage.style.margin = '0';
    siteCopyListContainer.appendChild(emptyMessage);
    return;
  }

  filteredEntries.forEach(({ key, value }) => {
    const entry = document.createElement('div');
    entry.className = 'site-copy-entry';

    const friendlyLabel = getSiteCopyLabel(key) || key;

    const keyHeading = document.createElement('strong');
    keyHeading.textContent = friendlyLabel;

    const keyMeta = document.createElement('small');
    keyMeta.textContent = `Teknik adı: ${key}`;

    const valuePreview = document.createElement('pre');
    valuePreview.textContent = value || '—';

    const hint = document.createElement('small');
    hint.textContent = 'Düzenlemek için "Düzenle"ye tıklayın.';

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Düzenle';
    editButton.addEventListener('click', () => {
      if (siteCopyLanguageSelect) {
        siteCopyLanguageSelect.value = language;
      }
      if (siteCopyKeyInput) {
        siteCopyKeyInput.value = key;
      }
      if (siteCopyValueInput) {
        siteCopyValueInput.value = value;
      }
      siteCopyKeyInput?.focus();
      window.scrollTo({
        top: siteCopyForm?.offsetTop || 0,
        behavior: 'smooth',
      });
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Sil';
    deleteButton.classList.add('danger');
    deleteButton.addEventListener('click', () => {
      deleteSiteCopyEntry(language, key);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    entry.appendChild(keyHeading);
    entry.appendChild(keyMeta);
    entry.appendChild(valuePreview);
    entry.appendChild(hint);
    entry.appendChild(actions);

    siteCopyListContainer.appendChild(entry);
  });
}

function resetSiteCopyForm() {
  if (!siteCopyForm) {
    return;
  }

  siteCopyForm.reset();
  if (siteCopyLanguageSelect) {
    siteCopyLanguageSelect.value = SUPPORTED_SITE_COPY_LANGUAGES[0];
  }
}

async function handleSiteCopySubmit(event) {
  event.preventDefault();
  if (!siteCopyForm) {
    return;
  }

  const language = getActiveSiteCopyLanguage();
  const key = siteCopyKeyInput?.value?.trim();
  const value = siteCopyValueInput?.value ?? '';

  if (!key) {
<<<<<<< HEAD
    setStatus(adminStatus, 'Lütfen düzenlenecek metnin adını yazın.', true);
=======
<<<<<<< HEAD
    setStatus(adminStatus, 'Lütfen düzenlenecek metnin adını yazın.', true);
=======
    setStatus(adminStatus, 'Lütfen güncellenecek anahtarı yazın.', true);
>>>>>>> origin/main
>>>>>>> origin/main
    return;
  }

  setStatus(adminStatus, 'Site metni kaydediliyor...');

  try {
    await saveSiteCopyEntry(language, key, value);
    setStatus(adminStatus, 'Metin güncellendi.');
    siteCopyForm.reset();
  } catch (error) {
    console.error('Site metni kaydedilemedi:', error);
    setStatus(adminStatus, error.message || 'Site metni kaydedilemedi.', true);
  }
}

async function saveSiteCopyEntry(language, key, value) {
  const payload = {
    updates: {
      [key]: value,
    },
  };

  const response = await fetch(`${API_BASE}/site-copy/${language}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    await handleUnauthorized();
    throw new Error('Oturum yenilendi, lütfen tekrar deneyin.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: 'Metin kaydedilemedi.' }));
    throw new Error(data.message || 'Metin kaydedilemedi.');
  }

  const data = await response.json();
  if (data && SUPPORTED_SITE_COPY_LANGUAGES.includes(data.language)) {
    siteCopyCache[data.language] = data.entries || {};
    renderSiteCopyList();
  }
}

async function deleteSiteCopyEntry(language, key) {
<<<<<<< HEAD
  const friendlyLabel = getSiteCopyLabel(key) || key;
  if (!window.confirm(`"${friendlyLabel}" metnini silmek istediğinize emin misiniz?`)) {
=======
<<<<<<< HEAD
  const friendlyLabel = getSiteCopyLabel(key) || key;
  if (!window.confirm(`"${friendlyLabel}" metnini silmek istediğinize emin misiniz?`)) {
=======
  if (!window.confirm(`${key} anahtarını silmek istediğinize emin misiniz?`)) {
>>>>>>> origin/main
>>>>>>> origin/main
    return;
  }

  setStatus(adminStatus, 'Site metni siliniyor...');

  try {
    const response = await fetch(`${API_BASE}/site-copy/${language}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ removals: [key] }),
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response
        .json()
        .catch(() => ({ message: 'Metin silinemedi.' }));
      throw new Error(data.message);
    }

    const data = await response.json();
    if (data && SUPPORTED_SITE_COPY_LANGUAGES.includes(data.language)) {
      siteCopyCache[data.language] = data.entries || {};
    }
    renderSiteCopyList();
    setStatus(adminStatus, 'Metin silindi.');
  } catch (error) {
    console.error('Site metni silinemedi:', error);
    setStatus(adminStatus, error.message || 'Site metni silinemedi.', true);
  }
}

function toggleUpdateImagePreview(imageData) {
  if (!updateImagePreviewContainer) {
    return;
  }

  if (imageData && imageData.url) {
    updateImagePreviewContainer.classList.remove('hidden');
    if (updateImagePreview) {
      updateImagePreview.src = imageData.url;
      updateImagePreview.alt = imageData.originalname || 'Yüklenen fotoğraf';
    }
    if (updateImageLink) {
      updateImageLink.href = imageData.url;
    }
  } else {
    updateImagePreviewContainer.classList.add('hidden');
    if (updateImagePreview) {
      updateImagePreview.removeAttribute('src');
      updateImagePreview.alt = '';
    }
    if (updateImageLink) {
      updateImageLink.removeAttribute('href');
    }
  }
}

function resetUpdateImageInputs() {
  if (updateImageInput) {
    updateImageInput.value = '';
  }
  if (updateRemoveImageCheckbox) {
    updateRemoveImageCheckbox.checked = false;
  }
}

function toggleSections() {
  if (token) {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    initializeAdminData();
  } else {
    adminSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    setStatus(adminStatus, '');
    setStatus(loginStatus, '');
  }
}

async function login(event) {
  event.preventDefault();
  setStatus(loginStatus, 'Giriş yapılıyor...');

  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Giriş başarısız.' }));
      setStatus(loginStatus, data.message || 'Giriş başarısız.', true);
      return;
    }

    const data = await response.json();
    persistToken(data.token);
    loginForm.reset();
    setStatus(loginStatus, 'Giriş başarılı.');
    toggleSections();
  } catch (error) {
    console.error('Login isteği başarısız:', error);
    setStatus(loginStatus, 'Sunucuya ulaşılamadı.', true);
  }
}

async function initializeAdminData() {
  await Promise.all([
    fetchContents(),
    fetchDeletedContents(),
    fetchCvs(),
    fetchSiteCopyForAdmin(),
  ]);
}

async function fetchSiteCopyForAdmin() {
  if (!siteCopyListContainer) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/site-copy`, {
      headers: {
        ...authHeaders(),
      },
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      throw new Error('Site metinleri alınamadı.');
    }

    const data = await response.json();
    if (Array.isArray(data?.copies)) {
      data.copies.forEach((copy) => {
        if (copy && SUPPORTED_SITE_COPY_LANGUAGES.includes(copy.language)) {
          siteCopyCache[copy.language] = copy.entries || {};
        }
      });
    }

    renderSiteCopyList();
  } catch (error) {
    console.error('Site metinleri alınamadı:', error);
    setStatus(adminStatus, error.message || 'Site metinleri alınamadı.', true);
  }
}

function authHeaders() {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function fetchContents() {
  try {
    const response = await fetch(`${API_BASE}/content`);
    if (!response.ok) {
      throw new Error('İçerikler alınamadı.');
    }
    const contents = await response.json();
    renderContents(contents);
  } catch (error) {
    console.error(error);
    setStatus(adminStatus, 'İçerikler alınamadı.', true);
  }
}

function renderContents(contents) {
  if (!Array.isArray(contents)) return;
  contentTableBody.innerHTML = '';

  if (contents.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'Henüz içerik yok.';
    row.appendChild(cell);
    contentTableBody.appendChild(row);
    return;
  }

  contents.forEach((content) => {
    const row = document.createElement('tr');

    const titleCell = document.createElement('td');
    titleCell.textContent = content.title;

    const bodyCell = document.createElement('td');
    bodyCell.textContent = content.body;

    const languageCell = document.createElement('td');
    const normalizedLanguage = normalizeLanguageValue(content.language);
    languageCell.textContent = LANGUAGE_LABELS[normalizedLanguage] || normalizedLanguage.toUpperCase();

    const projectTypeCell = document.createElement('td');
    const normalizedProjectType = normalizeProjectTypeValue(content.projectType);
    projectTypeCell.textContent = PROJECT_TYPE_LABELS[normalizedProjectType] || normalizedProjectType;

    const imageCell = document.createElement('td');
    if (content.image && content.image.url) {
      const link = document.createElement('a');
      link.href = content.image.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Görüntüle';
      imageCell.appendChild(link);
    } else {
      imageCell.textContent = '—';
    }

    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(content.date || content.createdAt);

    const actionsCell = document.createElement('td');
    actionsCell.classList.add('actions');

    const editButton = document.createElement('button');
    editButton.textContent = 'Düzenle';
    editButton.type = 'button';
    editButton.addEventListener('click', () => startUpdate(content));

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Sil';
    deleteButton.type = 'button';
    deleteButton.classList.add('danger');
    deleteButton.addEventListener('click', () => deleteContent(content._id));

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(titleCell);
    row.appendChild(bodyCell);
    row.appendChild(languageCell);
    row.appendChild(projectTypeCell);
    row.appendChild(imageCell);
    row.appendChild(dateCell);
    row.appendChild(actionsCell);

    contentTableBody.appendChild(row);
  });
}

function renderDeletedContents(contents) {
  if (!deletedContentTableBody) {
    return;
  }

  deletedContentTableBody.innerHTML = '';

  if (!Array.isArray(contents) || contents.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Şu anda silinen içerik yok.';
    row.appendChild(cell);
    deletedContentTableBody.appendChild(row);
    return;
  }

  contents.forEach((content) => {
    const row = document.createElement('tr');

    const titleCell = document.createElement('td');
    titleCell.textContent = content.title || '-';

    const languageCell = document.createElement('td');
    const normalizedLanguage = normalizeLanguageValue(content.language);
    languageCell.textContent = LANGUAGE_LABELS[normalizedLanguage] || normalizedLanguage.toUpperCase();

    const projectTypeCell = document.createElement('td');
    const normalizedProjectType = normalizeProjectTypeValue(content.projectType);
    projectTypeCell.textContent = PROJECT_TYPE_LABELS[normalizedProjectType] || normalizedProjectType;

    const deletedAtCell = document.createElement('td');
    deletedAtCell.textContent = formatDate(content.deletedAt);

    const actionsCell = document.createElement('td');
    actionsCell.classList.add('actions');

    const restoreButton = document.createElement('button');
    restoreButton.type = 'button';
    restoreButton.textContent = 'Geri Yükle';
    restoreButton.addEventListener('click', () => restoreContent(content._id));

    const purgeButton = document.createElement('button');
    purgeButton.type = 'button';
    purgeButton.textContent = 'Kalıcı Sil';
    purgeButton.classList.add('danger');
    purgeButton.addEventListener('click', () => permanentlyDeleteContent(content._id, content.title));

    actionsCell.appendChild(restoreButton);
    actionsCell.appendChild(purgeButton);

    row.appendChild(titleCell);
    row.appendChild(languageCell);
    row.appendChild(projectTypeCell);
    row.appendChild(deletedAtCell);
    row.appendChild(actionsCell);

    deletedContentTableBody.appendChild(row);
  });
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function createContent(event) {
  event.preventDefault();
  setStatus(adminStatus, 'İçerik ekleniyor...');

  const formData = new FormData(createContentForm);

  try {
    const response = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
      },
      body: formData,
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'İçerik eklenemedi.' }));
      throw new Error(data.message);
    }

    createContentForm.reset();
    if (createLanguageSelect) {
      createLanguageSelect.value = 'tr';
    }
    if (createProjectTypeSelect) {
      createProjectTypeSelect.value = DEFAULT_PROJECT_TYPE;
    }
    if (createImageInput) {
      createImageInput.value = '';
    }
    setStatus(adminStatus, 'İçerik başarıyla eklendi.');
    await Promise.all([fetchContents(), fetchDeletedContents()]);
  } catch (error) {
    console.error('İçerik eklenemedi:', error);
    setStatus(adminStatus, error.message || 'İçerik eklenemedi.', true);
  }
}

function startUpdate(content) {
  updateSection.classList.remove('hidden');
  updateIdInput.value = content._id;
  updateTitleInput.value = content.title || '';
  updateBodyInput.value = content.body || '';
  if (updateLanguageSelect) {
    updateLanguageSelect.value = normalizeLanguageValue(content.language);
  }
  if (updateProjectTypeSelect) {
    updateProjectTypeSelect.value = normalizeProjectTypeValue(content.projectType);
  }
  resetUpdateImageInputs();
  toggleUpdateImagePreview(content.image);
  window.scrollTo({ top: updateSection.offsetTop - 20, behavior: 'smooth' });
}

async function updateContent(event) {
  event.preventDefault();
  const id = updateIdInput.value;
  if (!id) {
    setStatus(adminStatus, 'Güncellenecek içerik seçilmedi.', true);
    return;
  }

  const formData = new FormData(updateContentForm);

  try {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      method: 'PUT',
      headers: {
        ...authHeaders(),
      },
      body: formData,
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'İçerik güncellenemedi.' }));
      throw new Error(data.message);
    }

    setStatus(adminStatus, 'İçerik güncellendi.');
    updateContentForm.reset();
    resetUpdateImageInputs();
    toggleUpdateImagePreview(null);
    updateSection.classList.add('hidden');
    if (updateLanguageSelect) {
      updateLanguageSelect.value = 'tr';
    }
    if (updateProjectTypeSelect) {
      updateProjectTypeSelect.value = DEFAULT_PROJECT_TYPE;
    }
    await Promise.all([fetchContents(), fetchDeletedContents()]);
  } catch (error) {
    console.error('İçerik güncellenemedi:', error);
    setStatus(adminStatus, error.message || 'İçerik güncellenemedi.', true);
  }
}

async function deleteContent(id) {
  if (!id) return;
  const confirmation = confirm('Bu içeriği silmek istediğinize emin misiniz?');
  if (!confirmation) return;

  try {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'İçerik silinemedi.' }));
      throw new Error(data.message);
    }

    const data = await response.json().catch(() => ({ message: 'İçerik silindi.' }));
    setStatus(adminStatus, data.message || 'İçerik silindi.');
    await Promise.all([fetchContents(), fetchDeletedContents()]);
  } catch (error) {
    console.error('İçerik silinemedi:', error);
    setStatus(adminStatus, error.message || 'İçerik silinemedi.', true);
  }
}

async function uploadCv(event) {
  event.preventDefault();
  setStatus(adminStatus, 'CV yükleniyor...');

  const formData = new FormData(uploadCvForm);

  try {
    const response = await fetch(`${API_BASE}/upload-cv`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
      },
      body: formData,
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'CV yüklenemedi.' }));
      throw new Error(data.message);
    }

    uploadCvForm.reset();
    setStatus(adminStatus, 'CV başarıyla yüklendi.');
    await fetchCvs();
  } catch (error) {
    console.error('CV yüklenemedi:', error);
    setStatus(adminStatus, error.message || 'CV yüklenemedi.', true);
  }
}

async function fetchDeletedContents() {
  if (!deletedContentTableBody) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/content/deleted`, {
      headers: {
        ...authHeaders(),
      },
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      throw new Error('Silinen içerikler alınamadı.');
    }

    const contents = await response.json();
    renderDeletedContents(contents);
  } catch (error) {
    console.error(error);
    setStatus(adminStatus, 'Silinen içerikler alınamadı.', true);
  }
}

async function restoreContent(id) {
  if (!id) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/content/${id}/restore`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
      },
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'İçerik geri yüklenemedi.' }));
      throw new Error(data.message);
    }

    const data = await response.json().catch(() => ({}));
    setStatus(adminStatus, data.message || 'İçerik geri yüklendi.');
    await Promise.all([fetchContents(), fetchDeletedContents()]);
  } catch (error) {
    console.error('İçerik geri yüklenemedi:', error);
    setStatus(adminStatus, error.message || 'İçerik geri yüklenemedi.', true);
  }
}

async function permanentlyDeleteContent(id, title = 'bu içerik') {
  if (!id) {
    return;
  }

  const confirmed = window.confirm(
    `${title} kaydını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/content/${id}/permanent`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'İçerik kalıcı olarak silinemedi.' }));
      throw new Error(data.message);
    }

    const data = await response.json().catch(() => ({}));
    setStatus(adminStatus, data.message || 'İçerik kalıcı olarak silindi.');
    await fetchDeletedContents();
  } catch (error) {
    console.error('İçerik kalıcı olarak silinemedi:', error);
    setStatus(adminStatus, error.message || 'İçerik kalıcı olarak silinemedi.', true);
  }
}

async function fetchCvs() {
  try {
    const response = await fetch(`${API_BASE}/cvs`, {
      headers: {
        ...authHeaders(),
      },
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      throw new Error('CV listesi alınamadı.');
    }

    const cvs = await response.json();
    renderCvList(cvs);
  } catch (error) {
    console.error('CV listesi alınamadı:', error);
    setStatus(adminStatus, 'CV listesi alınamadı.', true);
  }
}

function renderCvList(cvs) {
  cvTableBody.innerHTML = '';
  if (!Array.isArray(cvs) || cvs.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Henüz yüklenmiş CV bulunmuyor.';
    row.appendChild(cell);
    cvTableBody.appendChild(row);
    return;
  }

  cvs.forEach((cv) => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = cv.originalname || cv.filename;

    const typeCell = document.createElement('td');
    typeCell.textContent = cv.mimetype;

    const sizeCell = document.createElement('td');
    sizeCell.textContent = formatFileSize(cv.size);

    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(cv.uploadDate || cv.createdAt);

    const actionsCell = document.createElement('td');
    const downloadButton = document.createElement('button');
    downloadButton.type = 'button';
    downloadButton.textContent = 'İndir';
    downloadButton.addEventListener('click', () => downloadCv(cv._id, cv.originalname));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Sil';
    deleteButton.classList.add('danger');
    deleteButton.addEventListener('click', () => deleteCv(cv._id, cv.originalname || cv.filename));

    actionsCell.appendChild(downloadButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(nameCell);
    row.appendChild(typeCell);
    row.appendChild(sizeCell);
    row.appendChild(dateCell);
    row.appendChild(actionsCell);

    cvTableBody.appendChild(row);
  });
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(1)} ${sizes[i] || 'B'}`;
}

async function downloadCv(id, originalName = 'cv.pdf') {
  try {
    const response = await fetch(`${API_BASE}/cv/download/${id}`, {
      headers: {
        ...authHeaders(),
      },
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      throw new Error('CV indirilemedi.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const matches = /filename="?([^";]+)"?/i.exec(contentDisposition);
      if (matches && matches[1]) {
        originalName = decodeURIComponent(matches[1]);
      }
    }
    link.download = originalName || 'cv.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CV indirilemedi:', error);
    setStatus(adminStatus, 'CV indirilemedi.', true);
  }
}

async function deleteCv(id, originalName = 'CV') {
  if (!id) return;

  const confirmMessage = `${originalName} dosyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;
  if (!window.confirm(confirmMessage)) {
    return;
  }

  setStatus(adminStatus, 'CV siliniyor...');

  try {
    const response = await fetch(`${API_BASE}/cv/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    });

    if (response.status === 401) {
      await handleUnauthorized();
      return;
    }

    if (!response.ok) {
      throw new Error('CV silinemedi.');
    }

    setStatus(adminStatus, 'CV silindi.');
    await fetchCvs();
  } catch (error) {
    console.error('CV silinemedi:', error);
    setStatus(adminStatus, 'CV silinemedi.', true);
  }
}

function logout() {
  persistToken('');
  if (loginForm) {
    loginForm.reset();
  }
  updateContentForm.reset();
  resetUpdateImageInputs();
  toggleUpdateImagePreview(null);
  updateSection.classList.add('hidden');
  if (createLanguageSelect) {
    createLanguageSelect.value = 'tr';
  }
  if (createProjectTypeSelect) {
    createProjectTypeSelect.value = DEFAULT_PROJECT_TYPE;
  }
  if (createImageInput) {
    createImageInput.value = '';
  }
  if (updateLanguageSelect) {
    updateLanguageSelect.value = 'tr';
  }
  if (updateProjectTypeSelect) {
    updateProjectTypeSelect.value = DEFAULT_PROJECT_TYPE;
  }
  Object.keys(siteCopyCache).forEach((language) => {
    siteCopyCache[language] = {};
  });
  renderSiteCopyList();
  toggleSections();
}

async function refreshBootstrapToken() {
  try {
    const response = await fetch(`/admin-panel/bootstrap-token?ts=${Date.now()}`, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (data && typeof data.token === 'string') {
      const sanitized = sanitizeToken(data.token);
      if (sanitized) {
        persistToken(sanitized);
        return true;
      }
    }
  } catch (error) {
    console.error('Bootstrap token yenilenemedi:', error);
  }

  return false;
}

async function handleUnauthorized() {
  const refreshed = await refreshBootstrapToken();

  if (refreshed) {
    setStatus(adminStatus, 'Oturumunuz yenilendi, lütfen işlemi tekrar deneyin.');
    return true;
  }

  logout();
  setStatus(loginStatus, 'Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.', true);
  return false;
}

loginForm.addEventListener('submit', login);
createContentForm.addEventListener('submit', createContent);
updateContentForm.addEventListener('submit', updateContent);
uploadCvForm.addEventListener('submit', uploadCv);
logoutButton.addEventListener('click', logout);
cancelUpdateButton.addEventListener('click', () => {
  updateContentForm.reset();
  resetUpdateImageInputs();
  toggleUpdateImagePreview(null);
  updateSection.classList.add('hidden');
  if (updateLanguageSelect) {
    updateLanguageSelect.value = 'tr';
  }
  if (updateProjectTypeSelect) {
    updateProjectTypeSelect.value = DEFAULT_PROJECT_TYPE;
  }
});

if (siteCopyForm) {
  siteCopyForm.addEventListener('submit', handleSiteCopySubmit);
}

if (siteCopyResetButton) {
  siteCopyResetButton.addEventListener('click', () => {
    resetSiteCopyForm();
    renderSiteCopyList();
  });
}

if (siteCopyLanguageSelect) {
  siteCopyLanguageSelect.addEventListener('change', () => {
    renderSiteCopyList();
  });
}

if (siteCopySearchInput) {
  siteCopySearchInput.addEventListener('input', () => {
    renderSiteCopyList();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  toggleSections();
});
