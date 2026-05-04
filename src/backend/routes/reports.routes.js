const express = require('express');
const router = express.Router();
const reports = require('../services/reports.service');

router.get('/reports/cuentas-por-cobrar', async (req, res) => {
  try {
    const data = await reports.getCuentasPorCobrar();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/ingresos', async (req, res) => {
  try {
    const { fecha } = req.query;
    const data = await reports.getIngresosDiarios(fecha);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
