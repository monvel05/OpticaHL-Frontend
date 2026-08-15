import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, 
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, 
  IonToggle, IonBadge, IonSearchbar, IonSpinner, IonModal, IonButtons, IonText, IonChip, IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  receiptOutline, addCircleOutline, trashOutline, downloadOutline, 
  closeCircleOutline, searchOutline, refreshOutline, documentTextOutline, 
  checkmarkCircleOutline, alertCircleOutline, eyeOutline, filterOutline,
  personOutline, cardOutline, businessOutline, lockClosedOutline, keyOutline,
  closeOutline, checkmarkCircle
} from 'ionicons/icons';
import { FacturacionService, ConceptoFactura } from '../../core/services/facturacion.service';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.page.html',
  styleUrls: ['./facturacion.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, 
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
    IonButton, IonIcon, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, 
    IonToggle, IonBadge, IonSearchbar, IonSpinner, IonModal, IonButtons, IonText, IonChip, IonMenuButton
  ]
})
export class FacturacionPage implements OnInit {
  private facturacionService = inject(FacturacionService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  public parseFloat = parseFloat;

  // Control de Pestañas
  activeTab: 'crear' | 'historial' = 'crear';

  // Formularios
  facturaForm!: FormGroup;

  // Selección de Órdenes
  ordenesDisponibles: any[] = [];
  selectedFolios: string[] = [];
  busquedaOrden: string = '';
  cargandoOrdenes: boolean = false;

  // Conceptos y Edición
  permitirEdicionConceptos: boolean = false;
  conceptos: ConceptoFactura[] = [];

  // Totales Calculados
  subtotalCalculado: number = 0;
  descuentoCalculado: number = 0;
  ivaCalculado: number = 0;
  totalCalculado: number = 0;

  // Estado de Envío
  cargandoTimbrado: boolean = false;

  // Modal de Resultado Exitoso
  mostrarModalExito: boolean = false;
  facturaExitoData: any = null;

  // Historial de Facturas
  facturasList: any[] = [];
  cargandoHistorial: boolean = false;
  busquedaHistorial: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroEstatus: string = 'TODAS';

  // KPIs Historial
  kpiTotalMonto: number = 0;
  kpiTotalVigentes: number = 0;
  kpiTotalCanceladas: number = 0;

  // Modal Cancelación
  mostrarModalCancelar: boolean = false;
  facturaACancelar: any = null;
  motivoCancelacion: string = '02';
  uuidSustitucion: string = '';
  cancelandoFactura: boolean = false;

  // Catálogos SAT CFDI 4.0
  regimenesFiscales = [
    { codigo: '601', descripcion: '601 - General de Ley Personas Morales' },
    { codigo: '603', descripcion: '603 - Personas Morales con Fines no Lucrativos' },
    { codigo: '605', descripcion: '605 - Sueldos y Salarios e Ingresos por Asimilados' },
    { codigo: '606', descripcion: '606 - Arrendamiento' },
    { codigo: '612', descripcion: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
    { codigo: '616', descripcion: '616 - Sin obligaciones fiscales' },
    { codigo: '625', descripcion: '625 - Régimen de las Actividades Empresariales con Ingresos en Plataformas Tecnológicas' },
    { codigo: '626', descripcion: '626 - Régimen Simplificado de Confianza (RESICO)' }
  ];

  usosCFDI = [
    { codigo: 'G01', descripcion: 'G01 - Adquisición de mercancías' },
    { codigo: 'G03', descripcion: 'G03 - Gastos en general' },
    { codigo: 'CP01', descripcion: 'CP01 - Pagos' },
    { codigo: 'S01', descripcion: 'S01 - Sin efectos fiscales' },
    { codigo: 'P01', descripcion: 'P01 - Por definir' },
    { codigo: 'D01', descripcion: 'D01 - Honorarios médicos, dentales y gastos hospitalarios' }
  ];

  formasPago = [
    { codigo: '01', descripcion: '01 - Efectivo' },
    { codigo: '03', descripcion: '03 - Transferencia electrónica de fondos' },
    { codigo: '04', descripcion: '04 - Tarjeta de crédito' },
    { codigo: '28', descripcion: '28 - Tarjeta de débito' },
    { codigo: '99', descripcion: '99 - Por definir' }
  ];

  metodosPago = [
    { codigo: 'PUE', descripcion: 'PUE - Pago en una sola exhibición' },
    { codigo: 'PPD', descripcion: 'PPD - Pago en parcialidades o diferido' }
  ];

  clavesProdServ = [
    { codigo: '82121500', descripcion: '82121500 - Servicios de impresión y óptica' },
    { codigo: '60121000', descripcion: '60121000 - Equipo e insumos ópticos / lentes' },
    { codigo: '42142900', descripcion: '42142900 - Lentes oftálmicos / anteojos' },
    { codigo: '01010101', descripcion: '01010101 - No existe en el catálogo' }
  ];

  clavesUnidad = [
    { codigo: 'H87', descripcion: 'H87 - Pieza' },
    { codigo: 'E48', descripcion: 'E48 - Unidad de servicio' },
    { codigo: 'ACT', descripcion: 'ACT - Actividad' }
  ];

  constructor() {
    addIcons({
      receiptOutline, addCircleOutline, trashOutline, downloadOutline, 
      closeCircleOutline, searchOutline, refreshOutline, documentTextOutline, 
      checkmarkCircleOutline, alertCircleOutline, eyeOutline, filterOutline,
      personOutline, cardOutline, businessOutline, lockClosedOutline, keyOutline,
      closeOutline, checkmarkCircle,
      'lock-closed-outline': lockClosedOutline,
      'key-outline': keyOutline,
      'receipt-outline': receiptOutline,
      'document-text-outline': documentTextOutline,
      'add-circle-outline': addCircleOutline,
      'trash-outline': trashOutline,
      'download-outline': downloadOutline,
      'close-circle-outline': closeCircleOutline,
      'search-outline': searchOutline,
      'refresh-outline': refreshOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'alert-circle-outline': alertCircleOutline,
      'eye-outline': eyeOutline,
      'filter-outline': filterOutline,
      'person-outline': personOutline,
      'card-outline': cardOutline,
      'business-outline': businessOutline
    });
  }

  ngOnInit() {
    this.inicializarFormulario();
    this.cargarOrdenesDisponibles();
    this.cargarHistorialFacturas();
  }

  inicializarFormulario() {
    this.facturaForm = this.fb.group({
      rfc: ['XAXX010101000', [Validators.required, Validators.pattern(/^([A-ZÑ&]{3,4}) ?(?:\d{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])(?:[A-Z\d]{3})?$/i)]],
      razon_social: ['PUBLICO EN GENERAL', [Validators.required]],
      regimen_fiscal: ['616', [Validators.required]],
      cp: ['20000', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      email: ['', [Validators.email]],
      domicilio: [''],
      uso_cfdi: ['G01', [Validators.required]],
      metodo_pago: ['PUE', [Validators.required]],
      forma_pago: ['01', [Validators.required]],
      serie: ['FAC', [Validators.required]],
      moneda: ['MXN', [Validators.required]]
    });
  }

  // Carga de Órdenes
  cargarOrdenesDisponibles(busquedaParam?: any) {
    let term = '';
    if (typeof busquedaParam === 'string') {
      term = busquedaParam;
    } else if (busquedaParam?.detail?.value !== undefined) {
      term = String(busquedaParam.detail.value);
    } else if (busquedaParam?.target?.value !== undefined) {
      term = String(busquedaParam.target.value);
    } else if (typeof this.busquedaOrden === 'string') {
      term = this.busquedaOrden;
    }

    this.cargandoOrdenes = true;
    this.facturacionService.obtenerOrdenesDisponibles(term.trim()).subscribe({
      next: (res) => {
        if (res && res.exito) {
          this.ordenesDisponibles = res.datos || [];
        }
        this.cargandoOrdenes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar órdenes:', err);
        this.cargandoOrdenes = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleFolioSelection(folio: string) {
    const idx = this.selectedFolios.indexOf(folio);
    if (idx > -1) {
      this.selectedFolios.splice(idx, 1);
    } else {
      this.selectedFolios.push(folio);
    }
    this.actualizarDetallesSegunOrdenes();
  }

  esFolioSeleccionado(folio: string): boolean {
    return this.selectedFolios.includes(folio);
  }

  actualizarDetallesSegunOrdenes() {
    if (this.selectedFolios.length === 0) {
      this.conceptos = [];
      this.recalcularTotales();
      return;
    }

    this.facturacionService.obtenerDetallesOrdenes(this.selectedFolios).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          const { cliente, conceptos } = res.datos;
          if (cliente) {
            this.facturaForm.patchValue({
              rfc: cliente.rfc || 'XAXX010101000',
              razon_social: cliente.nombre || 'PUBLICO EN GENERAL',
              cp: cliente.cp || '20000',
              email: cliente.email || '',
              domicilio: cliente.domicilio || '',
              regimen_fiscal: cliente.regimen_fiscal || (cliente.rfc === 'XAXX010101000' ? '616' : '601')
            });
          }
          this.conceptos = conceptos || [];
          this.recalcularTotales();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener detalles de órdenes:', err);
        this.cdr.detectChanges();
      }
    });
  }

  // Conceptos y Artículos Falsos / Personalizados
  agregarConceptoFalso() {
    const nuevoConcepto: ConceptoFactura = {
      id_articulo: `CUSTOM-${Date.now().toString().slice(-4)}`,
      noIdentificacion: `ART-AJS-${this.conceptos.length + 1}`,
      descripcion: `Artículo / Servicio Personalizado ${this.conceptos.length + 1}`,
      cantidad: 1,
      valorUnitario: 431.03, // Subtotal con IVA de $500 aprox
      precioPublico: 500.00,
      claveProdServ: '82121500',
      claveUnidad: 'H87',
      descuento: 0,
      objImp: '02'
    };
    this.conceptos.push(nuevoConcepto);
    this.permitirEdicionConceptos = true;
    this.recalcularTotales();
  }

  eliminarConcepto(index: number) {
    this.conceptos.splice(index, 1);
    this.recalcularTotales();
  }

  actualizarConceptoPrecioPublico(index: number, precioConIva: number) {
    const c = this.conceptos[index];
    c.precioPublico = precioConIva;
    c.valorUnitario = parseFloat((precioConIva / 1.16).toFixed(4));
    this.recalcularTotales();
  }

  recalcularTotales() {
    let subtotal = 0;
    let descuento = 0;

    for (let c of this.conceptos) {
      const cant = c.cantidad || 1;
      const valU = c.valorUnitario || 0;
      const desc = c.descuento || 0;
      subtotal += (cant * valU);
      descuento += desc;
    }

    this.subtotalCalculado = parseFloat(subtotal.toFixed(2));
    this.descuentoCalculado = parseFloat(descuento.toFixed(2));
    this.ivaCalculado = parseFloat(((this.subtotalCalculado - this.descuentoCalculado) * 0.16).toFixed(2));
    this.totalCalculado = parseFloat((this.subtotalCalculado - this.descuentoCalculado + this.ivaCalculado).toFixed(2));
    this.cdr.detectChanges();
  }

  // Proceso de Timbrado
  generarFactura() {
    if (this.facturaForm.invalid) {
      this.facturaForm.markAllAsTouched();
      alert('Por favor completa los campos requeridos del formulario fiscal.');
      return;
    }

    if (this.conceptos.length === 0) {
      alert('Debes agregar o seleccionar al menos un concepto para generar la factura.');
      return;
    }

    this.cargandoTimbrado = true;
    this.cdr.detectChanges();

    const formVals = this.facturaForm.value;

    const payload = {
      folios_orden: this.selectedFolios,
      folio_orden: this.selectedFolios[0] || undefined,
      uso_cfdi: formVals.uso_cfdi,
      regimen_fiscal: formVals.regimen_fiscal,
      metodo_pago: formVals.metodo_pago,
      forma_pago: formVals.forma_pago,
      serie: formVals.serie,
      cliente_custom: {
        nombre: formVals.razon_social.trim(),
        razon_social: formVals.razon_social.trim(),
        rfc: formVals.rfc.toUpperCase().trim(),
        cp: formVals.cp,
        email: formVals.email,
        domicilio: formVals.domicilio,
        regimen_fiscal: formVals.regimen_fiscal
      },
      conceptos_custom: this.conceptos
    };

    this.facturacionService.generarFactura(payload).subscribe({
      next: (res) => {
        this.cargandoTimbrado = false;
        if (res && res.exito) {
          this.facturaExitoData = res.datos;
          this.mostrarModalExito = true;
          // Reset parcial
          this.selectedFolios = [];
          this.conceptos = [];
          this.recalcularTotales();
          try {
            this.cargarHistorialFacturas();
          } catch (e) {
            console.warn('Aviso al refrescar historial:', e);
          }
        } else {
          alert(`Error al generar factura: ${res?.mensaje || 'Respuesta no válida'}`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoTimbrado = false;
        console.error('Error al timbrar:', err);
        alert(`Error al procesar la factura: ${err.error?.mensaje || err.message}`);
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalExito() {
    this.mostrarModalExito = false;
    this.facturaExitoData = null;
    this.cdr.detectChanges();
  }

  descargarXMLFactura(numFactura: string) {
    this.facturacionService.descargarXML(numFactura);
  }

  descargarPDFFactura(numFactura: string) {
    this.facturacionService.descargarPDF(numFactura);
  }

  // Historial y Consultas
  cargarHistorialFacturas() {
    this.cargandoHistorial = true;
    const filtros = {
      busqueda: this.busquedaHistorial,
      fecha_inicio: this.filtroFechaInicio,
      fecha_fin: this.filtroFechaFin,
      estatus: this.filtroEstatus
    };

    this.facturacionService.obtenerFacturas(filtros).subscribe({
      next: (res) => {
        this.cargandoHistorial = false;
        if (res && res.exito) {
          this.facturasList = res.datos || [];
          this.calcularKPIs();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoHistorial = false;
        console.error('Error al obtener historial:', err);
        this.cdr.detectChanges();
      }
    });
  }

  calcularKPIs() {
    let montoTotal = 0;
    let countVigentes = 0;
    let countCanceladas = 0;

    for (let f of this.facturasList) {
      if (f.estatus === 'VIGENTE' || f.estatus_sat === 'VIGENTE') {
        montoTotal += parseFloat(f.total) || 0;
        countVigentes++;
      } else {
        countCanceladas++;
      }
    }

    this.kpiTotalMonto = parseFloat(montoTotal.toFixed(2));
    this.kpiTotalVigentes = countVigentes;
    this.kpiTotalCanceladas = countCanceladas;
  }

  // Cancelación SAT
  abrirModalCancelar(factura: any) {
    this.facturaACancelar = factura;
    this.motivoCancelacion = '02';
    this.uuidSustitucion = '';
    this.mostrarModalCancelar = true;
    this.cdr.detectChanges();
  }

  cerrarModalCancelar() {
    this.mostrarModalCancelar = false;
    this.facturaACancelar = null;
    this.cdr.detectChanges();
  }

  confirmarCancelacion() {
    if (!this.facturaACancelar) return;
    if (this.motivoCancelacion === '01' && !this.uuidSustitucion.trim()) {
      alert('El motivo 01 requiere especificar el UUID de la factura que la sustituye.');
      return;
    }

    this.cancelandoFactura = true;
    this.cdr.detectChanges();

    this.facturacionService.cancelarFactura(
      this.facturaACancelar.num_factura, 
      this.motivoCancelacion, 
      this.uuidSustitucion
    ).subscribe({
      next: (res) => {
        this.cancelandoFactura = false;
        if (res && res.exito) {
          alert(`Factura ${this.facturaACancelar.num_factura} cancelada correctamente.`);
          this.cerrarModalCancelar();
          this.cargarHistorialFacturas();
        } else {
          alert(`Error al cancelar: ${res?.mensaje || 'Error al cancelar'}`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cancelandoFactura = false;
        console.error('Error al cancelar factura:', err);
        alert(`Error al procesar la cancelación: ${err.error?.mensaje || err.message}`);
        this.cdr.detectChanges();
      }
    });
  }
}
