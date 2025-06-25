const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Geçici storage konfigürasyonu
const createTempStorage = () => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            cb(null, tempDir);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    });
};

const createUploadMiddleware = (options = {}) => {
    const {
        maxFileSize = 50 * 1024 * 1024, // 50MB default
        maxFiles = 10,
        fieldName = 'files'
    } = options;

    return multer({
        storage: createTempStorage(),
        limits: {
            fileSize: maxFileSize,
            files: maxFiles
        }
    }).array(fieldName, maxFiles);
};

const moveFilesToUserDir = (files, userId) => {
    const userUploadDir = path.join(__dirname, '..', 'uploads', userId.toString());
    
    if (!fs.existsSync(userUploadDir)) {
        fs.mkdirSync(userUploadDir, { recursive: true });
    }

    const finalPaths = [];

    for (const file of files) {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        const uniqueName = `${baseName}-${uuidv4()}${ext}`;
        const finalPath = path.join(userUploadDir, uniqueName);

        // Dosyayı taşı
        fs.renameSync(file.path, finalPath);
        finalPaths.push(finalPath);
    }

    return finalPaths;
};

const cleanupTempFiles = (files) => {
    if (!files || !Array.isArray(files)) return;
    
    files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (error) {
                console.error('Error cleaning up temp file:', error);
            }
        }
    });
};

const cleanupFiles = (filePaths) => {
    if (!filePaths || !Array.isArray(filePaths)) return;
    
    filePaths.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error('Error cleaning up file:', error);
            }
        }
    });
};

const uploadMiddleware = (options = {}) => {
    const upload = createUploadMiddleware(options);
    
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                console.error('Multer error:', err);
                return res.status(500).json({
                    error: 'Upload Failed',
                    details: err.message
                });
            }
            next();
        });
    };
};

module.exports = {
    uploadMiddleware,
    moveFilesToUserDir,
    cleanupTempFiles,
    cleanupFiles,
    createUploadMiddleware
};