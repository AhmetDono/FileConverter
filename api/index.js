const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const {connectRabbit} = require('./RabbitMQ');
const jobRoutes = require('./routes/jobRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const PORT = process.env.PORT || 4000;

connectRabbit();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı');
    
    // Sunucuyu başlat
    app.listen(PORT, () => {
      console.log(`Sunucu ${PORT} portunda çalışıyor`);
    });
  })
  .catch((error) => {
    console.error('MongoDB bağlantı hatası:', error);
  });


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/user', userRoutes);
app.use('/api/job', jobRoutes);

module.exports = app;