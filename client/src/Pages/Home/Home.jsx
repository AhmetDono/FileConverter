import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { FileText, Upload, Download, X, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

const conversionTypes = {
  toPdf: {
    title: 'PDF\'ye Dönüştür',
    description: 'Word, Excel, PowerPoint dosyalarını PDF\'ye çevirin',
    acceptedTypes: '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.jpg,.jpeg,.png',
    icon: FileText,
    endpoint: 'http://localhost:4000/api/job/convert',
    operation: 'convert'
  },
  merge: {
    title: 'PDF Birleştir',
    description: 'Birden fazla PDF\'yi tek dosyada birleştirin',
    acceptedTypes: '.pdf',
    icon: FileText,
    endpoint: 'http://localhost:4000/api/job/merge',
    operation: 'merge'
  },
  split: {
    title: 'PDF Böl',
    description: 'Büyük PDF\'leri sayfa sayfa böl',
    acceptedTypes: '.pdf',
    icon: FileText,
    endpoint: 'http://localhost:4000/api/job/split',
    operation: 'split'
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('toPdf');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [outputPaths, setOutputPaths] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [splitStartPage, setSplitStartPage] = useState('');
  const [splitEndPage, setSplitEndPage] = useState('');
  const fileInputRef = useRef(null);
  const [userId, setUserId] = useState(null);


  useEffect(() => {
    const getUserIdFromToken = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found');
        return;
      }

      try {
        // JWT token'ı decode et (basit yöntem)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        console.log('Decoded token:', decoded);
        
        // Backend'den gelen token yapısına göre userId'yi al
        const extractedUserId = decoded.userId || decoded.id || decoded.sub;
        
        if (extractedUserId) {
          setUserId(extractedUserId);
          console.log('✅ User ID extracted from token:', extractedUserId);
        } else {
          console.log('❌ No userId found in token');
        }
        
      } catch (error) {
        console.error('❌ Error decoding token:', error);
      }
    };

    getUserIdFromToken();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleFileSelection = (files) => {
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return conversionTypes[activeTab].acceptedTypes.includes(extension);
    });

    setSelectedFiles(prevFiles => {
      const existingFileNames = prevFiles.map(file => file.name);
      const newFiles = validFiles.filter(file => !existingFileNames.includes(file.name));
      return [...prevFiles, ...newFiles];
    });
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelection(files);
  };

  const removeFile = (index) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const removeAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateSplitPages = () => {
    if (activeTab !== 'split') return true;
    
    const startPage = parseInt(splitStartPage);
    const endPage = parseInt(splitEndPage);
    
    if (!splitStartPage || !splitEndPage) {
      alert('Lütfen başlangıç ve bitiş sayfalarını girin.');
      return false;
    }
    
    if (isNaN(startPage) || isNaN(endPage)) {
      alert('Sayfa numaraları geçerli sayılar olmalıdır.');
      return false;
    }
    
    if (startPage < 1 || endPage < 1) {
      alert('Sayfa numaraları 1\'den büyük olmalıdır.');
      return false;
    }
    
    if (startPage >= endPage) {
      alert('Başlangıç sayfası bitiş sayfasından küçük olmalıdır.');
      return false;
    }
    
    return true;
  };

  const uploadFiles = async () => {
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('userId', userId);
    formData.append('operation', conversionTypes[activeTab].operation);
    
    // Split işlemi için sayfa aralığını ekle
    if (activeTab === 'split') {
      formData.append('splitStart', splitStartPage);
      formData.append('splitEnd', splitEndPage);
    }
    
    const endpoint = conversionTypes[activeTab].endpoint;

    console.log('📤 Uploading files:', {
      fileCount: selectedFiles.length,
      endpoint,
      operation: conversionTypes[activeTab].operation,
      userId,
      ...(activeTab === 'split' && { 
        splitStart: splitStartPage, 
        splitEnd: splitEndPage 
      })
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('📥 Upload response:', result);
    
    if (!response.ok) throw new Error(result.error || 'Upload failed');

    return result;
  };

  const listenToJobStatus = (jobId) => {
    console.log('👂 Starting SSE listener for job:', jobId);
    const eventSource = new EventSource(`http://localhost:4000/api/job/stream/${jobId}`);

    eventSource.addEventListener('status', (event) => {
      const data = JSON.parse(event.data);
      console.log('📡 SSE Status Update:', data);
      
      const status = data.status;
      const output = data.outputPaths;

      if (status === 'pending') {
        setProcessingStatus({ type: 'processing', message: 'İş kuyruğa alındı...' });
        setProgress(10);
      } else if (status === 'processing') {
        setProcessingStatus({ type: 'processing', message: 'Dönüştürme işlemi devam ediyor...' });
        setProgress(60);
      } else if (status === 'completed') {
        console.log('✅ Job completed! Output paths:', output);
        setProcessingStatus({ type: 'success', message: 'Dönüştürme tamamlandı!' });
        setProgress(100);
        setIsProcessing(false);
        setOutputPaths(output || []);
        eventSource.close();
      } else if (status === 'failed') {
        console.log('❌ Job failed:', data);
        setProcessingStatus({ type: 'error', message: 'İşlem sırasında hata oluştu.' });
        setProgress(0);
        setIsProcessing(false);
        eventSource.close();
      }
    });

    eventSource.addEventListener('error', (event) => {
      console.error('❌ SSE connection error:', event);
      eventSource.close();
    });

    eventSource.onerror = (error) => {
      console.error('❌ SSE error:', error);
    };
  };

  const handleConversion = async () => {
    if (selectedFiles.length === 0) return;
    
    // Split işlemi için sayfa doğrulaması
    if (!validateSplitPages()) return;

    setIsProcessing(true);
    setProgress(0);
    setOutputPaths([]); // Reset output paths
    setProcessingStatus({ type: 'processing', message: 'Dosyalar yükleniyor...' });

    try {
      const uploadResult = await uploadFiles();
      const jobId = uploadResult.jobId;
      if (!jobId) throw new Error('Job ID alınamadı.');
      
      console.log('🆔 Job ID set:', jobId);
      setJobId(jobId);
      setProcessingStatus({ type: 'processing', message: `Job oluşturuldu (${jobId}). İşleniyor...` });
      listenToJobStatus(jobId);
    } catch (error) {
      console.error('❌ Conversion error:', error);
      setIsProcessing(false);
      setProcessingStatus({ type: 'error', message: `Hata: ${error.message}` });
    }
  };

  const resetConverter = () => {
    setSelectedFiles([]);
    setProcessingStatus(null);
    setProgress(0);
    setIsProcessing(false);
    setOutputPaths([]);
    setJobId(null);
    setIsDownloading(false);
    setSplitStartPage('');
    setSplitEndPage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    console.log('🔄 Converter reset');
  };

  const getTotalFileSize = () => selectedFiles.reduce((total, file) => total + file.size, 0);

  // Gerçek download handler
  const handleDownload = async () => {
    if (!jobId || !outputPaths || outputPaths.length === 0) {
      console.error('❌ No job ID or output paths available');
      return;
    }

    setIsDownloading(true);
    
    try {
      console.log('🔽 Starting download for job:', jobId);
      
      // Tüm dosyaları indir (tek dosya varsa direkt, birden fazla varsa zip)
      const downloadUrl = `http://localhost:4000/api/job/download/${jobId}`;
      
      // Fetch ile dosyayı al
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      // Dosya adını response header'dan al
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'downloaded_file';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Blob oluştur ve indir
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Download completed:', filename);
      
    } catch (error) {
      console.error('❌ Download error:', error);
      alert(`İndirme hatası: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Tek dosya indirme (opsiyonel)
  const handleSingleFileDownload = async (fileIndex) => {
    if (!jobId) return;
    
    setIsDownloading(true);
    
    try {
      const downloadUrl = `http://localhost:4000/api/job/download/${jobId}/${fileIndex}`;
      
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `file_${fileIndex}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('❌ Single file download error:', error);
      alert(`İndirme hatası: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderDownloadSection = () => {
    console.log('🔍 Rendering download section. OutputPaths:', outputPaths);

    if (!outputPaths || outputPaths.length === 0) {
      console.log('⚠️ No output paths available for download');
      return (
        <div className={styles.downloadSection}>
          <p>Henüz indirilebilir dosya yok</p>
        </div>
      );
    }

    const fileCount = Array.isArray(outputPaths) ? outputPaths.length : 0;

    return (
      <div className={styles.downloadSection}>
        <h4>📥 İndirilebilir Dosyalar:</h4>
        <div className={styles.downloadButtonGroup}>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`${styles.downloadButton} ${isDownloading ? styles.downloadButtonDisabled : ''}`}
          >
            <Download size={16} />
            {isDownloading 
              ? 'İndiriliyor...' 
              : fileCount > 1 
                ? `${fileCount} Dosyayı İndir (ZIP)` 
                : 'Dosyayı İndir'
            }
          </button>
        </div>
        
        {/* Birden fazla dosya varsa tek tek indirme seçeneği */}
        {fileCount > 1 && (
          <div className={styles.individualDownloads}>
            <h5>Tek tek indir:</h5>
            {outputPaths.map((path, index) => (
              <button
                key={index}
                onClick={() => handleSingleFileDownload(index)}
                disabled={isDownloading}
                className={styles.singleDownloadButton}
              >
                <Download size={14} />
                Dosya {index + 1}
              </button>
            ))}
          </div>
        )}
        
        {/* Debug için outputPaths'i göster */}
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <details>
            <summary>Debug: Output Paths ({fileCount} dosya)</summary>
            <pre>{JSON.stringify(outputPaths, null, 2)}</pre>
          </details>
        </div>
      </div>
    );
  };

  const renderSplitPageInputs = () => {
    if (activeTab !== 'split') return null;

    return (
      <div className={styles.splitPageInputs}>
        <h4>Sayfa Aralığı Seçin</h4>
        <div className={styles.pageInputGroup}>
          <div className={styles.pageInputField}>
            <label htmlFor="startPage">Başlangıç Sayfası:</label>
            <input
              id="startPage"
              type="number"
              min="1"
              value={splitStartPage}
              onChange={(e) => setSplitStartPage(e.target.value)}
              placeholder="Örn: 3"
              className={styles.pageInput}
            />
          </div>
          <div className={styles.pageInputField}>
            <label htmlFor="endPage">Bitiş Sayfası:</label>
            <input
              id="endPage"
              type="number"
              min="1"
              value={splitEndPage}
              onChange={(e) => setSplitEndPage(e.target.value)}
              placeholder="Örn: 5"
              className={styles.pageInput}
            />
          </div>
        </div>
        <div className={styles.pageInputHint}>
          PDF'den {splitStartPage && splitEndPage ? `${splitStartPage}. sayfadan ${splitEndPage}. sayfaya kadar` : 'belirtilen sayfa aralığı'} çıkarılacak
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    const currentType = conversionTypes[activeTab];

    return (
      <div>
        <div
          className={`${styles.uploadArea} ${isDragOver ? styles.uploadAreaActive : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={styles.uploadIcon} />
          <div className={styles.uploadText}>
            {selectedFiles.length > 0
              ? `${selectedFiles.length} dosya seçildi`
              : 'Dosyaları buraya sürükleyin'}
          </div>
          <div className={styles.uploadSubtext}>
            veya tıklayarak dosya seçin ({currentType.acceptedTypes})
          </div>
          <div className={styles.uploadSubtext}>
            Birden fazla dosya seçebilirsiniz
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple={true}
            accept={currentType.acceptedTypes}
            onChange={handleFileInputChange}
            className={styles.hiddenInput}
          />
        </div>

        {/* Split işlemi için sayfa aralığı inputları */}
        {renderSplitPageInputs()}

        {selectedFiles.length > 0 && (
          <div>
            <div className={styles.fileListHeader}>
              <div className={styles.fileListInfo}>
                <span>{selectedFiles.length} dosya seçildi</span>
                <span>Toplam boyut: {formatFileSize(getTotalFileSize())}</span>
              </div>
              <button onClick={removeAllFiles} className={styles.removeAllButton}>
                <X size={16} />
                Tümünü Kaldır
              </button>
            </div>

            <div className={styles.fileList}>
              {selectedFiles.map((file, index) => (
                <div key={index} className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <FileText className={styles.fileIcon} />
                    <div className={styles.fileDetails}>
                      <div className={styles.fileName}>{file.name}</div>
                      <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                    </div>
                    <button onClick={() => removeFile(index)} className={styles.removeButton}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConversion}
              disabled={isProcessing}
              className={`${styles.convertButton} ${isProcessing ? styles.convertButtonProcessing : ''}`}
            >
              {isProcessing ? 'İşleniyor...' : `${currentType.title} (${selectedFiles.length} dosya)`}
            </button>

            {isProcessing && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            )}

            {processingStatus && (
              <div className={`${styles.statusCard} ${
                processingStatus.type === 'success' ? styles.statusSuccess :
                processingStatus.type === 'error' ? styles.statusError : ''
              }`}>
                <div className={styles.statusContent}>
                  {processingStatus.type === 'success' && <CheckCircle size={24} color="#10b981" />}
                  {processingStatus.type === 'error' && <AlertCircle size={24} color="#ef4444" />}
                  {processingStatus.type === 'processing' && <AlertCircle size={24} color="#ea580c" />}
                  <span className={styles.statusText}>{processingStatus.message}</span>
                </div>
                
                {/* Download section'ını success durumunda göster */}
                {processingStatus.type === 'success' && renderDownloadSection()}
              </div>
            )}

            <button onClick={resetConverter} className={styles.resetButton}>
              <RotateCcw size={16} />
              Yeniden Başlat
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>PDF Converter</h1>
        <p className={styles.subtitle}>Modern ve hızlı PDF dönüştürme aracı</p>
      </header>

      <div className={styles.mainCard}>
        <div className={styles.converterTabs}>
          {Object.entries(conversionTypes).map(([key, type]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                resetConverter();
              }}
              className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
            >
              <type.icon size={20} />
              {type.title}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}