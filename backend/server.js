// Express + MongoDB backend for hospital system
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Hospital Backend Running!', port: 5000 });
});

app.listen(5000, () => {
  console.log('🏥 Hospital Backend: http://localhost:5000');
});
