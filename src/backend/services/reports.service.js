const db = require('../db');

async function getCuentasPorCobrar() {
  const [rows] = await db.query(`
    SELECT
      o.folio,
      o.id_cliente,
      o.total,
      IFNULL(SUM(mc.monto),0) AS pagado,
      (o.total - IFNULL(SUM(mc.monto),0)) AS saldo
    FROM ORDEN o
    LEFT JOIN MOVIMIENTOS_CAJA mc
      ON o.folio = mc.folio_orden
      AND mc.tipo_movimiento = 'INGRESO'
    GROUP BY o.folio
    HAVING saldo > 0
  `);
  return rows;
}

async function getIngresosDiarios(fecha) {
  const [rows] = await db.query(
    `SELECT
      DATE(fecha_hora) as fecha,
      SUM(monto) as total
     FROM MOVIMIENTOS_CAJA
     WHERE tipo_movimiento = 'INGRESO'
     AND DATE(fecha_hora) = ?
     GROUP BY DATE(fecha_hora)`,
    [fecha]
  );

  return rows[0] || { fecha, total: 0 };
}

module.exports = {
  getCuentasPorCobrar,
  getIngresosDiarios
};
