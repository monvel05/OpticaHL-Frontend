// Interfaz para asegurar que mandamos exactamente lo que el backend espera
export interface DatosFacturacion {
  folio_orden: string;
  id_sucursal: number;
  id_operador: number;
  metodo_pago: string;
  forma_pago: string;
  uso_cfdi: string;
  regimen_fiscal: string;
  nombres_personalizados?: { id_articulo: number, nombre_factura: string }[];
}