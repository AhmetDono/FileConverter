const express = require("express");
const jobController = require('../controllers/jobController');
const { uploadMiddleware } = require('../middlewares/Multer');
const router = express.Router();

const commonUploadConfig = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    fieldName: 'files'
};

router.post('/convert',uploadMiddleware(commonUploadConfig),jobController.convertPdf);
router.post('/merge',uploadMiddleware(commonUploadConfig),jobController.merge);
router.post('/split',uploadMiddleware(commonUploadConfig),jobController.split);
router.get('/stream/:id',jobController.streamJobStatus);
router.get('/download/:jobId', jobController.downloadAllFiles);
router.get('/download/:jobId/:fileIndex', jobController.downloadFile);

module.exports = router;