require('dotenv').config();
console.log("ENV'den okunan port:", process.env.PORT);
const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

const User = require('./models/User');
const Content = require('./models/Content');
const CV = require('./models/CV');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/alpermorkoc';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_API_BASE_URL = normalizeAdminApiBase(process.env.ADMIN_API_BASE_URL);
const PUBLIC_CONTENT_API_BASE_URL = normalizeAdminApiBase(
  process.env.PUBLIC_CONTENT_API_BASE_URL || process.env.ADMIN_API_BASE_URL
);
const { allowAllOrigins, allowedOrigins } = parseAllowedOrigins(
  process.env.CORS_ALLOWED_ORIGINS
);
const PUBLIC_SITE_DIR = __dirname;
const ADMIN_ASSETS_DIR = path.join(__dirname, 'public');

const DEFAULT_CONTENT_API_BASE = '/api';

const DEFAULT_CONTENT_LANGUAGE = 'tr';
const ALLOWED_CONTENT_LANGUAGES = new Set(['tr', 'en', 'multi']);

const makeRelativeUploadPath = (subdir, filename) =>
  path.posix.join(String(subdir || '').replace(/\\+/g, '/'), filename);

const toPublicUploadUrl = (relativePath) => {
  if (!relativePath) {
    return '';
  }

  return `/uploads/${String(relativePath).replace(/\\+/g, '/')}`;
};

const buildStoredFileMetadata = (file, subdir) => {
  if (!file || !file.filename) {
    return null;
  }

  const relativePath = makeRelativeUploadPath(subdir, file.filename);

  return {
    filename: relativePath,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: toPublicUploadUrl(relativePath),
    uploadedAt: new Date(),
  };
};

const resolveUploadsPath = (relativePath = '') => path.join(uploadsDir, relativePath);

const deleteUploadedFile = async (relativePath, { ignoreNotFound = true } = {}) => {
  if (!relativePath) {
    return true;
  }

  try {
    await fsPromises.unlink(resolveUploadsPath(relativePath));
    return true;
  } catch (error) {
    if (ignoreNotFound && error && error.code === 'ENOENT') {
      return true;
    }

    throw error;
  }
};

const parseBoolean = (value) => {
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
};

function normalizeAdminApiBase(value) {
  if (typeof value !== 'string') {
    return '/api';
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return '/api';
  }

  if (trimmed === '/') {
    return '';
  }

  return trimmed.replace(/\/$/, '');
}

function buildContentApiEndpoint(base) {
  const fallback = DEFAULT_CONTENT_API_BASE;

  if (typeof base !== 'string') {
    return `${fallback}/content`;
  }

  const trimmed = base.trim();

  if (!trimmed) {
    return `${fallback}/content`;
  }

  const sanitized = trimmed === '/' ? fallback : trimmed.replace(/\/$/, '');

  if (/^https?:\/\//i.test(sanitized)) {
    return `${sanitized}/content`;
  }

  const withLeadingSlash = sanitized.startsWith('/')
    ? sanitized
    : `/${sanitized}`;

  return `${withLeadingSlash}/content`;
}

const PUBLIC_CONTENT_API_ENDPOINT = buildContentApiEndpoint(
  PUBLIC_CONTENT_API_BASE_URL || DEFAULT_CONTENT_API_BASE
);

function parseAllowedOrigins(rawValue) {
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return { allowAllOrigins: true, allowedOrigins: new Set() };
  }

  const entries = rawValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (entries.includes('*')) {
    return { allowAllOrigins: true, allowedOrigins: new Set() };
  }

  return { allowAllOrigins: false, allowedOrigins: new Set(entries) };
}

const normalizeContentLanguage = (value) => {
  if (typeof value !== 'string') {
    return DEFAULT_CONTENT_LANGUAGE;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return DEFAULT_CONTENT_LANGUAGE;
  }

  if (ALLOWED_CONTENT_LANGUAGES.has(normalized)) {
    return normalized;
  }

  return DEFAULT_CONTENT_LANGUAGE;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowAllOrigins) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS_ORIGIN_NOT_ALLOWED'));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

const corsMiddleware = cors(corsOptions);

app.use((req, res, next) => {
  corsMiddleware(req, res, (error) => {
    if (error) {
      console.warn(
        'CORS engellendi:',
        req.headers.origin || 'origin yok',
        error.message
      );
      if (req.method === 'OPTIONS') {
        return res.status(403).send('CORS policy: origin not allowed');
      }

      return res
        .status(403)
        .json({ message: 'Bu origin için erişime izin verilmiyor.' });
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  });
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fsPromises = fs.promises;

const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const uploadsDir = path.join(__dirname, 'uploads');
ensureDirExists(uploadsDir);

const CV_UPLOAD_SUBDIR = 'cv';
const IMAGE_UPLOAD_SUBDIR = 'images';
const cvUploadsDir = path.join(uploadsDir, CV_UPLOAD_SUBDIR);
const imageUploadsDir = path.join(uploadsDir, IMAGE_UPLOAD_SUBDIR);

ensureDirExists(cvUploadsDir);
ensureDirExists(imageUploadsDir);

const PUBLIC_SITE_STATIC_FOLDERS = ['assets', 'i18n'];

const servePublicSiteFile = (res, next, relativePath) => {
  const sanitizedRelativePath = relativePath.replace(/^\/+/, '');
  const targetPath = path.resolve(PUBLIC_SITE_DIR, sanitizedRelativePath);

  if (
    targetPath !== PUBLIC_SITE_DIR &&
    !targetPath.startsWith(`${PUBLIC_SITE_DIR}${path.sep}`)
  ) {
    return next();
  }

  fs.access(targetPath, fs.constants.F_OK, (error) => {
    if (error) {
      return next();
    }

    return res.sendFile(targetPath);
  });
};

app.get('/', (req, res, next) => {
  servePublicSiteFile(res, next, 'index.html');
});

app.get(/^\/[\w-]+\.html$/, (req, res, next) => {
  servePublicSiteFile(res, next, req.path);
});

['robots.txt', 'sitemap.xml'].forEach((filename) => {
  app.get(`/${filename}`, (req, res, next) => {
    servePublicSiteFile(res, next, filename);
  });
});

PUBLIC_SITE_STATIC_FOLDERS.forEach((folder) => {
  const folderPath = path.join(PUBLIC_SITE_DIR, folder);

  if (fs.existsSync(folderPath)) {
    app.use(`/${folder}`, express.static(folderPath));
  }
});
app.use('/uploads', express.static(uploadsDir));

const ensureBasicAuthHeader = (res) => {
  res.set('WWW-Authenticate', 'Basic realm="Admin Panel"');
};

const setNoCacheHeaders = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
};

app.get('/site-config.js', (req, res) => {
  const config = {
    contentApiBase: PUBLIC_CONTENT_API_BASE_URL,
    contentEndpoint: PUBLIC_CONTENT_API_ENDPOINT,
  };

  setNoCacheHeaders(res);
  res
    .type('application/javascript')
    .send(`window.__SITE_CONFIG__ = Object.freeze(${JSON.stringify(config)});\n`);
});

const adminBasicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    ensureBasicAuthHeader(res);
    return res.status(401).send('Authentication required.');
  }

  const base64Credentials = authHeader.slice('Basic '.length).trim();
  let credentials;

  try {
    credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  } catch (error) {
    ensureBasicAuthHeader(res);
    return res.status(401).send('Invalid authentication token.');
  }

  const separatorIndex = credentials.indexOf(':');

  if (separatorIndex === -1) {
    ensureBasicAuthHeader(res);
    return res.status(401).send('Invalid authentication token.');
  }

  const username = credentials.slice(0, separatorIndex);
  const password = credentials.slice(separatorIndex + 1);

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    ensureBasicAuthHeader(res);
    return res.status(401).send('Invalid credentials.');
  }

  req.adminBasicAuthUser = username;

  return next();
};

app.get('/admin-panel', adminBasicAuth, (req, res) => {
  res.sendFile(path.join(ADMIN_ASSETS_DIR, 'admin.html'));
});

app.get('/admin-panel/admin-config.js', adminBasicAuth, async (req, res) => {
  const config = {
    apiBase: ADMIN_API_BASE_URL,
    bootstrapToken: null,
  };

  const basicAuthUser = req.adminBasicAuthUser || ADMIN_USERNAME;

  try {
    const token = await issueAdminToken(basicAuthUser);
    if (token) {
      config.bootstrapToken = token;
    }
  } catch (error) {
    console.error('Admin config token oluşturulamadı:', error.message);
  }

  setNoCacheHeaders(res);
  res
    .type('application/javascript')
    .send(`window.__ADMIN_CONFIG__ = Object.freeze(${JSON.stringify(config)});\n`);
});

app.get('/admin-panel/bootstrap-token', adminBasicAuth, async (req, res) => {
  try {
    const token = await issueAdminToken(req.adminBasicAuthUser || ADMIN_USERNAME);

    if (!token) {
      return res.status(500).json({ message: 'Yeni token üretilemedi.' });
    }

    setNoCacheHeaders(res);
    return res.json({ token });
  } catch (error) {
    console.error('Bootstrap token alınamadı:', error.message);
    return res.status(500).json({ message: 'Token alınırken bir hata oluştu.' });
  }
});

app.use(
  '/admin-panel',
  adminBasicAuth,
  express.static(ADMIN_ASSETS_DIR, { index: false })
);

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB bağlantısı başarılı');
    return ensureDefaultAdmin();
  })
  .catch((error) => {
    console.error('MongoDB bağlantı hatası:', error.message);
  });

async function ensureDefaultAdmin() {
  try {
    let existingAdmin = await User.findOne({ username: ADMIN_USERNAME });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      existingAdmin = await User.create({
        username: ADMIN_USERNAME,
        password: hashedPassword,
      });
      console.log(`Varsayılan admin oluşturuldu → kullanıcı adı: ${ADMIN_USERNAME}`);
    }
    return existingAdmin;
  } catch (error) {
    console.error('Varsayılan admin oluşturulurken hata oluştu:', error.message);
    return null;
  }
}

async function issueAdminToken(username = ADMIN_USERNAME) {
  try {
    let adminUser = await User.findOne({ username });

    if (!adminUser && username === ADMIN_USERNAME) {
      adminUser = await ensureDefaultAdmin();
    }

    if (!adminUser) {
      return null;
    }

    return jwt.sign(
      {
        id: adminUser._id,
        username: adminUser.username,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
  } catch (error) {
    console.error('Admin JWT oluşturulamadı:', error.message);
    return null;
  }
}

const createDiskStorage = (targetDir) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, targetDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${uniqueSuffix}${extension}`);
    },
  });

const cvFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Sadece PDF dosyaları yükleyebilirsiniz.'));
  }
};

const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'image/heic',
  'image/heif',
]);

const imageFileFilter = (req, file, cb) => {
  if (!file) {
    cb(null, true);
    return;
  }

  if (allowedImageMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Sadece JPG, PNG, WEBP, GIF, SVG, AVIF veya HEIC formatındaki fotoğrafları yükleyebilirsiniz.'
      )
    );
  }
};

const cvUpload = multer({ storage: createDiskStorage(cvUploadsDir), fileFilter: cvFileFilter });
const imageUpload = multer({ storage: createDiskStorage(imageUploadsDir), fileFilter: imageFileFilter });

const handleContentImageUpload = (req, res, next) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Fotoğraf yükleme hatası:', err.message);
      return res.status(400).json({ message: err.message || 'Fotoğraf yüklenemedi.' });
    }

    return next();
  });
};

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Kullanıcı adı ve parola gereklidir.' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya parola.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya parola.' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

const ACTIVE_CONTENT_FILTER = { deletedAt: null };

app.get('/api/content', async (req, res) => {
  try {
    const contents = await Content.find(ACTIVE_CONTENT_FILTER).sort({ date: -1 });
    res.json(contents);
  } catch (error) {
    console.error('İçerikler alınamadı:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.post('/api/content', auth, handleContentImageUpload, async (req, res) => {
  try {
    const { title, body, language } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Başlık ve içerik gereklidir.' });
    }

    const contentPayload = {
      title,
      body,
      language: normalizeContentLanguage(language),
    };

    const imageMetadata = buildStoredFileMetadata(req.file, IMAGE_UPLOAD_SUBDIR);

    if (imageMetadata) {
      contentPayload.image = imageMetadata;
    }

    const content = await Content.create({ ...contentPayload, deletedAt: null });
    res.status(201).json(content);
  } catch (error) {
    console.error('İçerik oluşturulamadı:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.put('/api/content/:id', auth, handleContentImageUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, language, removeImage } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Başlık ve içerik gereklidir.' });
    }

    const content = await Content.findById(id);

    if (!content || content.deletedAt) {
      return res.status(404).json({ message: 'İçerik bulunamadı.' });
    }

    const previousImage = content.image ? { ...content.image } : null;
    const shouldRemoveImage = parseBoolean(removeImage);
    const nextLanguage = normalizeContentLanguage(language);
    const newImageMetadata = buildStoredFileMetadata(req.file, IMAGE_UPLOAD_SUBDIR);

    content.title = title;
    content.body = body;
    content.language = nextLanguage;

    let deletePreviousImageAfterSave = false;

    if (newImageMetadata) {
      content.set('image', newImageMetadata);
      deletePreviousImageAfterSave = Boolean(previousImage?.filename);
    } else if (shouldRemoveImage && content.image) {
      content.set('image', undefined);
      deletePreviousImageAfterSave = Boolean(previousImage?.filename);
    }

    const updatedContent = await content.save();

    if (deletePreviousImageAfterSave && previousImage?.filename) {
      try {
        await deleteUploadedFile(previousImage.filename);
      } catch (fileError) {
        console.warn('Önceki fotoğraf silinemedi:', fileError.message);
      }
    }

    res.json(updatedContent);
  } catch (error) {
    console.error('İçerik güncellenemedi:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.delete('/api/content/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);

    if (!content) {
      return res.status(404).json({ message: 'İçerik bulunamadı.' });
    }

    if (content.deletedAt) {
      return res.status(409).json({ message: 'İçerik zaten silinmiş.' });
    }

    content.deletedAt = new Date();
    await content.save();

    res.json({
      message: 'İçerik silindi. Silinen İçerikler bölümünden tekrar yayına alabilirsiniz.',
      content,
    });
  } catch (error) {
    console.error('İçerik silinemedi:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.get('/api/content/deleted', auth, async (req, res) => {
  try {
    const deletedContents = await Content.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
    res.json(deletedContents);
  } catch (error) {
    console.error('Silinen içerikler alınamadı:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.post('/api/content/:id/restore', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);

    if (!content) {
      return res.status(404).json({ message: 'İçerik bulunamadı.' });
    }

    if (!content.deletedAt) {
      return res
        .status(409)
        .json({ message: 'İçerik zaten yayında. Silinenler listesinden kaldırılmış olabilir.' });
    }

    content.deletedAt = null;
    await content.save();

    res.json({ message: 'İçerik yeniden yayına alındı.', content });
  } catch (error) {
    console.error('İçerik geri yüklenemedi:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.delete('/api/content/:id/permanent', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);

    if (!content) {
      return res.status(404).json({ message: 'İçerik bulunamadı.' });
    }

    if (!content.deletedAt) {
      return res.status(409).json({ message: 'İçerik yayında olduğu için kalıcı silinemez.' });
    }

    const imageFilename = content.image?.filename;
    await content.deleteOne();

    if (imageFilename) {
      try {
        await deleteUploadedFile(imageFilename);
      } catch (error) {
        console.warn('Fotoğraf silinirken hata oluştu:', error.message);
      }
    }

    res.json({ message: 'İçerik kalıcı olarak silindi.' });
  } catch (error) {
    console.error('İçerik kalıcı olarak silinemedi:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.post('/api/upload-cv', auth, (req, res) => {
  cvUpload.single('cv')(req, res, async (err) => {
    if (err) {
      console.error('CV yükleme hatası:', err.message);
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'PDF dosyası yükleyiniz.' });
    }

    try {
      const { filename, originalname, mimetype, size } = req.file;
      const storedFilename = makeRelativeUploadPath(CV_UPLOAD_SUBDIR, filename);
      const cv = await CV.create({ filename: storedFilename, originalname, mimetype, size });
      res.status(201).json(cv);
    } catch (error) {
      console.error('CV kaydedilemedi:', error.message);
      res.status(500).json({ message: 'Sunucu hatası.' });
    }
  });
});

app.get('/api/cvs', auth, async (req, res) => {
  try {
    const cvs = await CV.find().sort({ uploadDate: -1 });
    res.json(cvs);
  } catch (error) {
    console.error('CV listesi alınamadı:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.get('/api/cv/download/:id', auth, async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id);

    if (!cv) {
      return res.status(404).json({ message: 'CV bulunamadı.' });
    }

    const filePath = cv.filename ? resolveUploadsPath(cv.filename) : '';
    if (!cv.filename || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Dosya mevcut değil.' });
    }

    res.download(filePath, cv.originalname);
  } catch (error) {
    console.error('CV indirilemedi:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.delete('/api/cv/:id', auth, async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id);

    if (!cv) {
      return res.status(404).json({ message: 'CV bulunamadı.' });
    }

    try {
      await deleteUploadedFile(cv.filename);
    } catch (error) {
      console.error('CV dosyası silinemedi:', error.message);
      return res.status(500).json({ message: 'CV dosyası silinemedi.' });
    }

    await cv.deleteOne();

    res.json({ message: 'CV silindi.' });
  } catch (error) {
    console.error('CV silinemedi:', error.message);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.use((err, req, res, next) => {
  if (err && err.message === 'CORS_ORIGIN_NOT_ALLOWED') {
    console.warn('CORS politikası erişimi reddetti:', req.headers.origin);
    return res.status(403).json({ message: 'CORS politikası bu isteği engelledi.' });
  }

  console.error('Beklenmeyen hata:', err);
  return res.status(500).json({ message: 'Sunucu hatası.' });
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
