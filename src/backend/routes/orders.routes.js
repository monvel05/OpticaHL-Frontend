const express = require('express');
const router = express.Router();
const service = require('../services/orders.service');

router.post('/orders', async (req, res) => {
  try {
    const data = await service.crearOrden(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders/:folio/payments', async (req, res) => {
  try {
    const data = await service.registrarPago(req.params.folio, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:folio/receipt', async (req, res) => {
  try {
    const data = await service.generarRecibo(req.params.folio);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
