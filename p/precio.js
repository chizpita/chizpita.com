/* Chizpita - precio de un pedido en la pagina (chizpita.com/p/).
   Copia de las reglas de la app (v4_precio, v4_envioDe, v4_esUrgente). La app vuelve a calcular todo al recibir
   el pedido; esto es para que el cliente vea el total correcto ANTES de pedir. test/run.js compara las dos. */
(function (root) {
  'use strict';
  var OTRA_ZONA = 'Otra zona';
  function dow(f) { var p = f.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12).getDay(); }
  function zip(t) { var m = String(t || '').match(/\b(\d{5})(?:-\d{4})?\b/); return m ? m[1] : ''; }
  function zonaDeZip(z, zonas) { if (!zonas.length) return ''; return zonas.indexOf(z) >= 0 ? z : OTRA_ZONA; }

  /* D = datos de la API (precios, zonas, diasEntrega, fechas). cart = {sabor: piezas}. esEsp(sabor) = es el Especial.
     -> {piezas, docenas, sueltas, docEsp, subtotal, envio, total, urg, fueraZona, fueraDia, zona} */
  function cotizar(D, cart, esEsp, entrega, codigoPostal, fecha) {
    var P = D.precios, piezas = 0, esp = 0;
    Object.keys(cart).forEach(function (s) { var n = Math.max(0, Math.floor(Number(cart[s]) || 0)); piezas += n; if (esEsp(s)) esp += n; });
    var docEsp = P.especial > 0 ? Math.floor(esp / 12) : 0, reg = piezas - docEsp * 12;
    var docenas = Math.floor(reg / 12), sueltas = reg % 12;
    var subtotal = docenas * P.docena + sueltas * P.pieza + docEsp * P.especial;
    var dom = entrega === 'domicilio', z = zip(codigoPostal), zona = dom ? zonaDeZip(z, D.zonas) : '';
    var urg = !!(P.politicaNueva && dom && fecha && D.fechas.defecto && fecha < D.fechas.defecto);
    var fueraZona = dom && D.zonas.length > 0 && zona !== z;
    var fueraDia = dom && !!fecha && D.diasEntrega.length > 0 && D.diasEntrega.indexOf(dow(fecha)) < 0;
    var envio = 0;
    if (dom && piezas > 0) {
      if (!P.politicaNueva) envio = piezas >= P.umbral ? 0 : P.envio;
      else if (urg || fueraZona || fueraDia) envio = P.envioFuera;
      else if (piezas >= P.umbral) envio = 0;
      else if (piezas >= P.umbralMedio) envio = P.envioMedio;
      else envio = P.envio;
    }
    return { piezas: piezas, docenas: docenas, sueltas: sueltas, docEsp: docEsp, subtotal: subtotal, envio: envio,
             total: Math.round((subtotal + envio) * 100) / 100, urg: urg, fueraZona: fueraZona, fueraDia: fueraDia, zona: zona, zip: z };
  }

  var api = { cotizar: cotizar, zip: zip, dow: dow, OTRA_ZONA: OTRA_ZONA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ChizPrecio = api;
})(this);
