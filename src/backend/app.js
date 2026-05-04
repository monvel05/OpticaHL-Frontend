const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// rutas
const ordersRoutes = require('./routes/orders.routes');
const reportsRoutes = require('./routes/reports.routes');

app.use('/api', ordersRoutes);
app.use('/api', reportsRoutes);

// servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
