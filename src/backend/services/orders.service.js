const db = require('../db');

function generarFolio() {
  return 'ORD-' + Date.now();
}

// =============================
// CREAR ORDEN
// =============================
async function crearOrden(data) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { id_sucursal, id_cliente, id_operador, total, articulos } = data;

    const folio = generarFolio();

    await conn.query(
      `INSERT INTO ORDEN
      (folio, id_sucursal, id_cliente, id_operador, total, estatus)
      VALUES (?, ?, ?, ?, ?, 'PENDIENTE')`,
      [folio, id_sucursal, id_cliente, id_operador, total]
    );

    for (const item of articulos) {

      await conn.query(
        `INSERT INTO DETALLE_VENTA
        (folio_orden, id_articulo, cantidad, precio_unitario)
        VALUES (?, ?, ?, ?)`,
        [folio, item.id_articulo, item.cantidad, item.precio]
      );

      const [articulo] = await conn.query(
        `SELECT categoria FROM ARTICULOS WHERE id_articulo = ?`,
        [item.id_articulo]
      );

      if (articulo[0].categoria !== 'SERVICIO') {

        const [inv] = await conn.query(
          `SELECT stock_actual FROM INVENTARIO_SUCURSAL
           WHERE id_articulo = ? AND id_sucursal = ?
           FOR UPDATE`,
          [item.id_articulo, id_sucursal]
        );

        if (!inv.length) throw new Error('Sin inventario');

        if (inv[0].stock_actual < item.cantidad) {
          throw new Error('Stock insuficiente');
        }

        await conn.query(
          `UPDATE INVENTARIO_SUCURSAL
           SET stock_actual = stock_actual - ?
           WHERE id_articulo = ? AND id_sucursal = ?`,
          [item.cantidad, item.id_articulo, id_sucursal]
        );
      }
    }

    await conn.commit();
    return { success: true, folio };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// =============================
// PAGOS
// =============================
async function registrarPago(folio, data) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { monto, metodo_pago, id_operador, id_sucursal } = data;

    const [orden] = await conn.query(
      `SELECT total FROM ORDEN WHERE folio = ? FOR UPDATE`,
      [folio]
    );

    if (!orden.length) throw new Error('Orden no existe');

    const total = orden[0].total;

    const [pagos] = await conn.query(
      `SELECT IFNULL(SUM(monto),0) AS pagado
       FROM MOVIMIENTOS_CAJA
       WHERE folio_orden = ? AND tipo_movimiento = 'INGRESO'`,
      [folio]
    );

    const pagadoActual = pagos[0].pagado;
    const nuevoPagado = pagadoActual + monto;

    await conn.query(
      `INSERT INTO MOVIMIENTOS_CAJA
      (id_sucursal, id_operador, folio_orden, tipo_movimiento, metodo_pago, monto, concepto)
      VALUES (?, ?, ?, 'INGRESO', ?, ?, 'PAGO ORDEN')`,
      [id_sucursal, id_operador, folio, metodo_pago, monto]
    );

    let estado = 'PENDIENTE';
    if (nuevoPagado >= total) estado = 'ENTREGADO';

    await conn.query(
      `UPDATE ORDEN SET estatus = ? WHERE folio = ?`,
      [estado, folio]
    );

    await conn.commit();

    return {
      success: true,
      pagado: nuevoPagado,
      restante: total - nuevoPagado,
      estado
    };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// =============================
// RECIBO
// =============================
async function generarRecibo(folio) {
  const [orden] = await db.query(
    `SELECT * FROM ORDEN WHERE folio = ?`,
    [folio]
  );

  if (!orden.length) throw new Error('Orden no existe');

  const [pagos] = await db.query(
    `SELECT monto, metodo_pago, fecha_hora
     FROM MOVIMIENTOS_CAJA
     WHERE folio_orden = ? AND tipo_movimiento = 'INGRESO'`,
    [folio]
  );

  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);

  return {
    folio,
    total: orden[0].total,
    pagado: totalPagado,
    restante: orden[0].total - totalPagado,
    pagos
  };
}

module.exports = {
  crearOrden,
  registrarPago,
  generarRecibo
};
