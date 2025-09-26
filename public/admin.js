const API_BASE = '/api';

const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const loginForm = document.getElementById('login-form');
const createContentForm = document.getElementById('create-content-form');
const updateContentForm = document.getElementById('update-content-form');
const uploadCvForm = document.getElementById('upload-cv-form');
const logoutButton = document.getElementById('logout-button');
const cancelUpdateButton = document.getElementById('cancel-update');
const loginStatus = document.getElementById('login-status');
const adminStatus = document.getElementById('admin-status');
const contentTableBody = document.getElementById('content-table-body');
const cvTableBody = document.getElementById('cv-table-body');
const updateSection = document.getElementById('update-section');
const updateIdInput = document.getElementById('update-id');
const updateTitleInput = document.getElementById('update-title');
const updateBodyInput = document.getElementById('update-body');

let token = localStorage.getItem('adminToken') || '';

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
    token = data.token;
    localStorage.setItem('adminToken', token);
    loginForm.reset();
    setStatus(loginStatus, 'Giriş başarılı.');
    toggleSections();
  } catch (error) {
    console.error('Login isteği başarısız:', error);
    setStatus(loginStatus, 'Sunucuya ulaşılamadı.', true);
  }
}

async function initializeAdminData() {
  await Promise.all([fetchContents(), fetchCvs()]);
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
    cell.colSpan = 4;
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
    row.appendChild(dateCell);
    row.appendChild(actionsCell);

    contentTableBody.appendChild(row);
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
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'İçerik eklenemedi.' }));
      throw new Error(data.message);
    }

    createContentForm.reset();
    setStatus(adminStatus, 'İçerik başarıyla eklendi.');
    await fetchContents();
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
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'İçerik güncellenemedi.' }));
      throw new Error(data.message);
    }

    setStatus(adminStatus, 'İçerik güncellendi.');
    updateContentForm.reset();
    updateSection.classList.add('hidden');
    await fetchContents();
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
      handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'İçerik silinemedi.' }));
      throw new Error(data.message);
    }

    setStatus(adminStatus, 'İçerik silindi.');
    await fetchContents();
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
      handleUnauthorized();
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

async function fetchCvs() {
  try {
    const response = await fetch(`${API_BASE}/cvs`, {
      headers: {
        ...authHeaders(),
      },
    });

    if (response.status === 401) {
      handleUnauthorized();
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

    actionsCell.appendChild(downloadButton);

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
      handleUnauthorized();
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

function handleUnauthorized() {
  setStatus(adminStatus, 'Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.', true);
  logout();
}

function logout() {
  token = '';
  localStorage.removeItem('adminToken');
  updateContentForm.reset();
  updateSection.classList.add('hidden');
  toggleSections();
}

loginForm.addEventListener('submit', login);
createContentForm.addEventListener('submit', createContent);
updateContentForm.addEventListener('submit', updateContent);
uploadCvForm.addEventListener('submit', uploadCv);
logoutButton.addEventListener('click', logout);
cancelUpdateButton.addEventListener('click', () => {
  updateContentForm.reset();
  updateSection.classList.add('hidden');
});

document.addEventListener('DOMContentLoaded', () => {
  toggleSections();
});
