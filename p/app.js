/* Chizpita - pagina de pedidos (chizpita.com/p/ y chizpita.com/p/?c=<codigo>).
   Lee los datos de "Chizpita Pedidos API" (GET) y manda el pedido (POST text/plain, sin preflight).
   Sin api configurada (config.js) es una vista de ejemplo que no manda nada. */
(function () {
  'use strict';
  var CFG = window.CHIZ || {}, CP = window.ChizPrecio;
  var qs = new URLSearchParams(location.search);
  var CODE = (qs.get('c') || '').replace(/[^a-z0-9]/gi, '').slice(0, 16);
  var DEMO = !CFG.api || qs.has('demo');
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var ZIP_AREAS = { '92130': 'Carmel Valley', '92037': 'La Jolla', '91910': 'Chula Vista', '91911': 'Chula Vista', '91913': 'Chula Vista', '91914': 'Chula Vista', '91915': 'Chula Vista', '92118': 'Coronado', '92014': 'Del Mar' };
  var COLORES = [['clasico', '#F4C04E'], ['plain', '#F4C04E'], ['pizza', '#E0662F'], ['jalape', '#5C9A2E'], ['chipotle', '#A33B1E'], ['kalamata', '#4B2C45'], ['negra', '#3A2A33'],
                 ['verde', '#8EA33B'], ['jitomate', '#B5342A'], ['zatar', '#8C7A3A'], ['za\'atar', '#8C7A3A'], ['chilaquil', '#3F8F4A']];
  var PALETA = ['#C9853A', '#7A5C99', '#2F7F86', '#B04E6F', '#5E7F2E'];
  var $ = function (id) { return document.getElementById(id); };
  var S = { d: null, cart: {}, entrega: 'recoger', zip: '', dir: '', fecha: '', otra: false, nombre: '', tel: '', notas: '', enviando: false, rid: nuevoRid() };

  /* ---------- utilidades ---------- */
  function nuevoRid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { n = Math.round(Number(n) * 100) / 100; return '$' + (n % 1 ? n.toFixed(2) : String(n)); }
  function fcorta(f) { var p = f.split('-'); return Number(p[2]) + ' ' + MESES[Number(p[1]) - 1]; }
  function fdia(f) { return DIAS[CP.dow(f)]; }
  function flarga(f) { return fdia(f) + ' ' + fcorta(f); }
  function sab(nombre) { return S.d.sabores.filter(function (s) { return s.nombre === nombre; })[0]; }
  function esEsp(nombre) { var s = sab(nombre); return !!(s && s.esp); }
  function color(nombre, i) {
    var k = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (var j = 0; j < COLORES.length; j++) if (k.indexOf(COLORES[j][0]) >= 0) return COLORES[j][1];
    return esEsp(nombre) ? '#9C4A1A' : PALETA[i % PALETA.length];
  }
  function lineasDe(cart) { return Object.keys(cart).filter(function (k) { return cart[k] > 0; }).map(function (k) { return { sabor: k, piezas: cart[k] }; }); }
  function textoLineas(cart) { return lineasDe(cart).map(function (l) { var s = sab(l.sabor); return esEsp(l.sabor) ? (l.piezas / 12) + ' doc ' + s.titulo : l.piezas + ' ' + (s ? s.titulo : l.sabor); }).join(' + '); }
  function cotizar(cart, entrega, fecha) { return CP.cotizar(S.d, cart, esEsp, entrega, S.zip, fecha || S.fecha); }
  function primerNombre() { return S.d.cliente ? S.d.cliente.nombre : ''; }
  /* Sin contactos personales en la pagina: el cliente responde al mensaje de WhatsApp que le llego. */
  var RESPONDE = 'Responde al mensaje de WhatsApp que te mandamos y lo vemos.';

  /* ---------- marca: chizpita/brand v3.0.0 (brand.json dice que archivo va en cada uso; nunca se redibuja) ----------
     Se usan las exportaciones de tamano web (exports/...-N.png y @2x), no los maestros de 1.7 MB. */
  var BRAND = 'https://cdn.jsdelivr.net/gh/chizpita/brand@v3.0.0/';
  var A = {
    header: 'exports/logo/horizontal/chizpita-horizontal-color-256', icono: 'exports/logo/icon/chizpita-icon-color-64',
    marca: 'exports/logo/mark/chizpita-mark-color-128', marcaG: 'exports/logo/mark/chizpita-mark-color-256',
    saluda: 'exports/mascot/chizpita-mascot-waving-128', duerme: 'exports/mascot/chizpita-mascot-sleepy-256',
    celebra: 'exports/mascot/chizpita-mascot-celebrating-256', wordmark: 'logo/wordmark/chizpita-wordmark-color.svg'
  };
  var wmSvg = '';
  function img(base, w, alt, cls) {
    return '<img src="' + BRAND + base + '.png" srcset="' + BRAND + base + '.png 1x, ' + BRAND + base + '@2x.png 2x" width="' + w + '" alt="' + esc(alt || '') + '"' +
      (cls ? ' class="' + cls + '"' : '') + ' decoding="async">';
  }
  function mark(w) { return img(w > 140 ? A.marcaG : A.marca, w, 'Chizpita'); }
  /* El wordmark va en linea para que titile la chispa de la i (relleno #F2A230) y baje la gota de la A (#F2B53A). */
  function precargarMarca() {
    fetch(BRAND + A.wordmark).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) { if (t.indexOf('<svg') >= 0) wmSvg = t; }).catch(function () {});
    [A.marcaG, A.celebra].forEach(function (b) { var i = new Image(); i.srcset = BRAND + b + '.png 1x, ' + BRAND + b + '@2x.png 2x'; });
  }
  function wordmark() {
    if (!wmSvg) return '<img src="' + BRAND + A.wordmark + '" alt="Chizpita" style="width:100%">';
    var box = document.createElement('div'); box.innerHTML = wmSvg;
    var svg = box.querySelector('svg'); if (!svg) return '';
    svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('aria-hidden', 'true');
    svg.querySelectorAll('[fill="#F2A230"]').forEach(function (n) { n.setAttribute('class', 'spark'); });
    svg.querySelectorAll('[fill="#F2B53A"]').forEach(function (n) { n.setAttribute('class', 'drip'); });
    return box.innerHTML;
  }

  /* ---------- cargar ---------- */
  function cargar() {
    precargarMarca();
    $('loading').innerHTML = mark(110);
    if (DEMO) { setTimeout(function () { iniciar(demo()); }, 350); return; }
    fetch(CFG.api + '?k=' + encodeURIComponent(CODE), { redirect: 'follow' })   // ?k= (Google reserva ?c= en la API)
      .then(function (r) { return r.json(); })
      .then(iniciar)
      .catch(function () { pantallaError('No pudimos cargar la página.', 'Revisa tu conexión e intenta de nuevo, o escríbenos por WhatsApp.'); });
  }
  function iniciar(d) {
    if (!d || !d.ok) { pantallaError('No pudimos cargar la página.', (d && d.error) || 'Intenta de nuevo en un momento.'); return; }
    S.d = d; S.fecha = d.fechas.defecto;
    if (d.cliente) { S.dir = d.cliente.direccion || ''; S.zip = d.cliente.zip || ''; if (d.cliente.ultimo && d.cliente.ultimo.entrega === 'domicilio') S.entrega = 'domicilio'; }
    render();
  }

  /* ---------- pantallas ---------- */
  function pantallaError(titulo, texto) {
    $('app').innerHTML = '<div class="pad center">' + mark(120) + '<h1>' + esc(titulo) + '</h1><p>' + esc(texto) + '</p><p>' + RESPONDE + '</p></div>';
  }
  function pantallaCerrado() {
    var d = S.d;
    $('app').innerHTML = '<div class="pad center">' + img(A.duerme, 170, 'Chizpita dormido') + '<h1>Los pedidos están en pausa</h1><p>' +
      'Esta semana ya no tomamos pedidos por aquí. ¿Se te antojó? ' + RESPONDE + '</p>' +
      '<p style="font-size:13px">Los pedidos cierran el ' + esc(d.cierreTxt) + '.</p></div>';
  }

  /* Por ahora solo por invitacion: sin link personal valido no se toman pedidos. */
  function pantallaInvitacion() {
    var malo = S.d.codigoInvalido;
    $('app').innerHTML = '<div class="pad center">' + img(A.saluda, 128, 'Chizpita saludando') +
      '<h1>' + (malo ? 'Este link ya no es válido' : 'Por ahora, solo por invitación') + '</h1><p>' +
      (malo ? 'Responde al mensaje de WhatsApp que te llegó y te mandamos tu link nuevo.'
            : 'Horneamos poquito y solo por pedido, así que por ahora los pedidos son para clientes invitados. Si ya eres cliente, abre el link personal que te llegó por WhatsApp.') +
      '</p><p lang="en" style="font-size:13.5px">' + (malo ? 'This link is no longer valid. Reply to the WhatsApp message you received and we will send you a new one.'
            : 'Chizpita is by invitation only for now. If you are a client, open the personal link you received on WhatsApp.') + '</p></div>';
  }

  function render() {
    var d = S.d;
    if (!d.cliente) { pantallaInvitacion(); return; }
    if (!d.abierto && !DEMO) { pantallaCerrado(); return; }
    var y = window.scrollY, h = '', nuevo = !d.cliente;
    var q = cotizar(S.cart, S.entrega);
    h += '<header class="pad top"><a class="word" href="/" aria-label="Chizpita, inicio">' + (window.innerWidth < 360 ? img(A.icono, 44, 'Chizpita') : img(A.header, 160, 'Chizpita')) + '</a><div class="week">Pedidos abiertos<br>cierran el ' + esc(d.cierreTxt) + '</div></header>';
    h += '<section class="pad hello"><div><h1>' + (nuevo ? '¡Hola! Arma tu pedido' : '¡Hola, ' + esc(d.cliente.nombre) + '!') + '</h1><p>' +
      (nuevo ? 'Pockets de queso hechos a mano. Se hornean solo por pedido.' : 'Esta semana hay ' + saboresTxt() + '.') + '</p>' +
      (d.codigoInvalido ? '<div class="banner">Este link ya no es válido, pero puedes pedir aquí mismo con tu nombre y WhatsApp.</div>' : '') +
      (d.fechas.cerroEstaSemana ? '<div class="banner"><b>Los pedidos para el ' + esc(flarga(d.fechas.entregaSemana)) + ' ya cerraron.</b> Tu pedido entra para el ' + esc(flarga(d.fechas.defecto)) + '.</div>' : '') +
      (DEMO ? '<div class="demo">Vista de ejemplo · no se envían pedidos</div>' : '') + '</div>' + img(A.saluda, 76, '', 'chizpi') + '</section>';
    h += usualHtml();
    h += '<section class="pad sec" id="menu"><h2>' + (d.cliente && d.cliente.ultimo ? 'O arma otro pedido' : 'Sabores') + '</h2>' +
      '<p class="hint">La docena sale a ' + money(d.precios.docena) + ' y se puede mezclar. Sueltas, ' + money(d.precios.pieza) + ' cada una.</p>' +
      cajas() + nudge(q) + menuHtml() + '</section>';
    h += entregaHtml() + fechasHtml();
    if (nuevo) h += '<section class="pad sec"><h2>Tus datos</h2><label class="field" for="f-nom">Tu nombre<input class="inp" id="f-nom" value="' + esc(S.nombre) + '" autocomplete="name" enterkeyhint="next"></label>' +
      '<label class="field" for="f-tel">Tu WhatsApp<input class="inp" id="f-tel" inputmode="tel" value="' + esc(S.tel) + '" autocomplete="tel" placeholder="(858) 555-0000"></label></section>';
    h += '<section class="pad sec"><label class="field" for="f-not">Notas (opcional)<textarea class="inp" id="f-not" placeholder="Ej. paso a recoger como a las 5">' + esc(S.notas) + '</textarea></label></section>';
    var falta = faltante(q), conUsual = !!(d.cliente && d.cliente.ultimo);
    if (q.piezas || !conUsual) h += '<div class="bar"><div class="sum"><span>' + (q.piezas ? q.piezas + ' piezas' + (q.envio ? ' · envío ' + money(q.envio) : (S.entrega === 'domicilio' && q.piezas ? ' · envío gratis' : '')) : 'Elige tus sabores') + '</span><span>' + esc(flarga(S.fecha)) + '</span></div>' +
      '<button class="go" id="go-cart"' + (falta ? ' disabled' : '') + '><span>' + esc(falta || 'Pedir') + '</span><span class="amt">' + money(q.total) + '</span></button></div>';
    h += '<footer class="pad foot">¿Dudas? ' + RESPONDE + '</footer>';
    $('app').innerHTML = h;
    conectar();
    window.scrollTo(0, y);
  }

  function saboresTxt() {
    var n = S.d.sabores.filter(function (s) { return !s.esp; }).length, e = S.d.sabores.filter(function (s) { return s.esp; })[0];
    return n + ' sabores' + (e ? ' y el especial ' + e.titulo : '');
  }

  function usualHtml() {
    var c = S.d.cliente;
    if (!c || !c.ultimo) return '';
    var cart = {}; c.ultimo.lineas.forEach(function (l) { cart[l.sabor] = l.piezas; });
    var ent = c.ultimo.entrega, q = cotizar(cart, ent, S.d.fechas.defecto);
    var listo = ent !== 'domicilio' || (S.dir.trim() && /^\d{5}$/.test(S.zip));
    return '<section class="pad"><div class="usual"><span class="k">Lo de siempre</span><div class="items">' + esc(textoLineas(cart)) + '</div>' +
      '<div class="det"><span class="pill">' + (ent === 'domicilio' ? 'A domicilio' : 'Recoger') + '</span><span class="pill">' + esc(flarga(S.d.fechas.defecto)) + '</span>' +
      (q.envio ? '<span class="pill">envío ' + money(q.envio) + '</span>' : '') + '</div>' +
      (c.ultimo.yaNoHay && c.ultimo.yaNoHay.length ? '<div class="small">Esta semana no hay ' + esc(c.ultimo.yaNoHay.join(', ')) + '; lo demás sí.</div>' : '') +
      (listo ? '<button class="go" id="go-usual"><span>Pedir lo mismo</span><span class="amt">' + money(q.total) + '</span></button>'
             : '<div class="small">Para entregártelo necesitamos tu dirección y código postal (abajo).</div>') +
      '<button class="alt" id="go-edit">Cambiar algo</button></div></section>';
  }

  function cajas() {
    var seq = [];
    S.d.sabores.forEach(function (s, i) { for (var k = 0; k < (S.cart[s.nombre] || 0); k++) seq.push(color(s.nombre, i)); });
    var n = Math.max(1, Math.ceil(seq.length / 12)), out = '<div class="boxes" role="img" aria-label="' + seq.length + ' piezas en ' + n + ' caja' + (n > 1 ? 's' : '') + '">';
    for (var b = 0; b < n; b++) {
      var sl = '';
      for (var j = 0; j < 12; j++) { var c = seq[b * 12 + j]; sl += '<span class="slot' + (c ? ' on' : '') + '"' + (c ? ' style="background:' + c + '"' : '') + '></span>'; }
      out += '<div class="box' + (seq.length >= (b + 1) * 12 ? ' full' : '') + '">' + sl + '</div>';
    }
    return out + '</div>';
  }

  function nudge(q) {
    var P = S.d.precios;
    if (!q.piezas) return '';
    var su = q.sueltas;
    if (su > 0) {
      var falta = 12 - su, extra = P.docena - su * P.pieza;
      if (extra <= 0) return '<div class="nudge"><b>' + falta + ' más te salen gratis.</b> ' + su + ' sueltas cuestan ' + money(su * P.pieza) + ', lo mismo que la docena.</div>';
      return '<div class="nudge">Te faltan <b>' + falta + '</b> para la docena: son solo <b>' + money(extra) + ' más</b>.</div>';
    }
    if (S.entrega === 'domicilio' && P.politicaNueva && q.envio > 0 && !q.fueraZona && !q.urg && !q.fueraDia) {
      if (q.piezas < P.umbralMedio) return '<div class="nudge">Con <b>' + (P.umbralMedio - q.piezas) + ' piezas más</b> el envío baja a ' + money(P.envioMedio) + '.</div>';
      if (q.piezas < P.umbral) return '<div class="nudge">Con <b>' + (P.umbral - q.piezas) + ' piezas más</b> el envío es gratis.</div>';
    }
    return '';
  }

  function menuHtml() {
    return '<div class="menu">' + S.d.sabores.map(function (s, i) {
      var n = S.cart[s.nombre] || 0;
      return '<div class="fl"><span class="dot" style="background:' + color(s.nombre, i) + '"></span><div><div class="n">' + esc(s.titulo) + (s.esp ? '<span class="tag">Especial</span>' : '') + '</div>' +
        (s.esp ? '<div class="d">Solo por docena · ' + money(S.d.precios.especial) + '</div>' : '') + '</div>' +
        '<div class="step"><button aria-label="Menos ' + esc(s.titulo) + '" data-m="' + i + '"' + (n ? '' : ' disabled') + '>−</button><span class="q">' + (s.esp ? (n / 12) + ' doc' : n) + '</span>' +
        '<button class="plus" aria-label="Más ' + esc(s.titulo) + '" data-p="' + i + '">+</button></div></div>';
    }).join('') + '</div>';
  }

  function zipLinea() {
    var d = S.d, z = S.zip, area = ZIP_AREAS[z] ? ' · ' + ZIP_AREAS[z] : '';
    if (!d.zonas.length) return '';
    if (!/^\d{5}$/.test(z)) return '<div class="zipline idle">Escribe tu código postal para calcular el envío.</div>';
    if (d.zonas.indexOf(z) >= 0) return '<div class="zipline">✓ Entregamos en ' + z + area + '.</div>';
    if ((d.zonasInactivas || []).indexOf(z) >= 0) return '<div class="zipline out">Esta semana no vamos a ' + (ZIP_AREAS[z] || z) + ': la entrega cuesta ' + money(d.precios.envioFuera) + ' y te confirmamos por WhatsApp.</div>';
    return '<div class="zipline out">' + z + ' está fuera de nuestra zona: la entrega cuesta ' + money(d.precios.envioFuera) + ' y te confirmamos por WhatsApp.</div>';
  }

  function entregaHtml() {
    var P = S.d.precios, h = '<section class="pad sec"><h2>¿Cómo lo recibes?</h2><div class="seg" role="group" aria-label="Entrega">' +
      '<button data-ent="recoger" aria-pressed="' + (S.entrega === 'recoger') + '">Recoger · gratis</button><button data-ent="domicilio" aria-pressed="' + (S.entrega === 'domicilio') + '">A domicilio</button></div>';
    if (S.entrega === 'domicilio') {
      h += '<p class="hint" style="margin:0">Envío ' + money(P.envio) + (P.politicaNueva ? ' · desde ' + P.umbralMedio + ' piezas ' + money(P.envioMedio) : '') + ' · desde ' + P.umbral + ' piezas gratis.</p>' +
        '<label class="field" for="f-dir">Dirección<input class="inp" id="f-dir" value="' + esc(S.dir) + '" placeholder="Calle y número" autocomplete="street-address"></label>' +
        (S.d.zonas.length ? '<label class="field" for="f-zip">Código postal<input class="inp" id="f-zip" value="' + esc(S.zip) + '" inputmode="numeric" maxlength="5" autocomplete="postal-code" placeholder="92130"></label>' : '') +
        '<div id="zipline">' + zipLinea() + '</div>';
    } else h += '<p class="hint" style="margin:0">' + esc(S.d.textoRecoger || 'Te mandamos la dirección para recoger por WhatsApp.') + '</p>';
    return h + '</section>';
  }

  function notaFecha() {
    var f = S.fecha, d = S.d, dom = S.entrega === 'domicilio', P = d.precios;
    if (dom && P.politicaNueva && f < d.fechas.defecto) return '<p class="datenote">Entrega urgente (antes del ' + esc(flarga(d.fechas.defecto)) + '): el envío cuesta <b>' + money(P.envioFuera) + '</b>.</p>';
    if (dom && d.diasEntrega.length && d.diasEntrega.indexOf(CP.dow(f)) < 0) return '<p class="datenote">Ese día no es de entrega: el envío cuesta <b>' + money(P.envioFuera) + '</b>.</p>';
    if (d.diaDefecto >= 0 && CP.dow(f) !== d.diaDefecto) return '<p class="datenote">No es nuestro día habitual: te confirmamos la hora por WhatsApp.</p>';
    return d.horario ? '<p class="datenote">' + esc(d.horario) + '</p>' : '';
  }

  function fechasHtml() {
    var d = S.d, enChips = d.fechas.chips.some(function (c) { return c.fecha === S.fecha; });
    var h = '<section class="pad sec"><h2>¿Para cuándo?</h2><div class="chips" role="group" aria-label="Fecha">' + d.fechas.chips.map(function (c) {
      return '<button class="chip" data-f="' + c.fecha + '" aria-pressed="' + (!S.otra && S.fecha === c.fecha) + '"><div class="a">' + esc(fdia(c.fecha)) + (c.proxima ? ' · próxima' : '') + '</div><div class="b">' + esc(fcorta(c.fecha)) + '</div></button>';
    }).join('') + '<button class="chip" data-otra="1" aria-pressed="' + (S.otra || !enChips) + '"><div class="a">Otro día</div><div class="b">' + (S.otra || !enChips ? esc(fcorta(S.fecha)) : 'Elegir') + '</div></button></div>';
    if (S.otra || !enChips) h += '<label class="field" for="f-fecha">Fecha<input class="inp" type="date" id="f-fecha" min="' + d.fechas.min + '" max="' + d.fechas.max + '" value="' + S.fecha + '"></label>';
    return h + notaFecha() + '</section>';
  }

  function faltante(q) {
    if (!q.piezas) return 'Elige tus sabores';
    if (S.entrega === 'domicilio' && !S.dir.trim()) return 'Falta tu dirección';
    if (S.entrega === 'domicilio' && S.d.zonas.length && !/^\d{5}$/.test(S.zip)) return 'Falta tu código postal';
    if (!S.d.cliente && !S.nombre.trim()) return 'Falta tu nombre';
    if (!S.d.cliente && S.tel.replace(/\D/g, '').length < 10) return 'Falta tu WhatsApp';
    return '';
  }

  /* ---------- eventos ---------- */
  function conectar() {
    var root = $('app');
    root.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { var s = S.d.sabores[+b.dataset.p]; S.cart[s.nombre] = (S.cart[s.nombre] || 0) + (s.esp ? 12 : 1); render(); }; });
    root.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { var s = S.d.sabores[+b.dataset.m]; S.cart[s.nombre] = Math.max(0, (S.cart[s.nombre] || 0) - (s.esp ? 12 : 1)); if (!S.cart[s.nombre]) delete S.cart[s.nombre]; render(); }; });
    root.querySelectorAll('[data-ent]').forEach(function (b) { b.onclick = function () { S.entrega = b.dataset.ent; render(); }; });
    root.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { S.fecha = b.dataset.f; S.otra = false; render(); }; });
    var o = root.querySelector('[data-otra]'); if (o) o.onclick = function () { S.otra = true; render(); var f = $('f-fecha'); if (f) f.focus(); };
    var ff = $('f-fecha'); if (ff) ff.onchange = function () { var v = ff.value; if (v && v >= S.d.fechas.min && v <= S.d.fechas.max) S.fecha = v; render(); };
    var dir = $('f-dir'); if (dir) { dir.oninput = function () { S.dir = dir.value; }; dir.onchange = render; }
    var zip = $('f-zip'); if (zip) zip.oninput = function () { S.zip = zip.value.replace(/\D/g, '').slice(0, 5); if (S.zip.length === 5 || S.zip.length === 0) { render(); var z2 = $('f-zip'); if (z2) { z2.focus(); z2.setSelectionRange(5, 5); } } };
    var nom = $('f-nom'); if (nom) { nom.oninput = function () { S.nombre = nom.value; }; nom.onchange = render; }
    var tel = $('f-tel'); if (tel) { tel.oninput = function () { S.tel = tel.value; }; tel.onchange = render; }
    var not = $('f-not'); if (not) not.oninput = function () { S.notas = not.value; };
    var u = $('go-usual'); if (u) u.onclick = function () {
      var c = S.d.cliente, cart = {}; c.ultimo.lineas.forEach(function (l) { cart[l.sabor] = l.piezas; });
      pedir(cart, c.ultimo.entrega, S.d.fechas.defecto);
    };
    var e = $('go-edit'); if (e) e.onclick = function () {
      S.cart = {}; S.d.cliente.ultimo.lineas.forEach(function (l) { S.cart[l.sabor] = l.piezas; }); S.entrega = S.d.cliente.ultimo.entrega; render();
      $('menu').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    };
    var g = $('go-cart'); if (g) g.onclick = function () { pedir(S.cart, S.entrega, S.fecha); };
  }

  /* ---------- pedir ---------- */
  function pedir(cart, entrega, fecha) {
    if (S.enviando) return;
    S.enviando = true;
    var payload = { rid: S.rid, c: S.d.cliente ? CODE : '', nombre: S.nombre, telefono: S.tel, lineas: lineasDe(cart), entrega: entrega,
                    zip: S.zip, direccion: S.dir, fecha: fecha, notas: S.notas };
    var ov = $('ov'), inicio = Date.now();
    $('ov-mark').innerHTML = mark(200); $('ov-wm').innerHTML = wordmark();
    $('ov-h').textContent = ''; $('ov-r').innerHTML = ''; $('ov-a').textContent = ''; $('ov-b').innerHTML = ''; $('ov-wait').hidden = false;
    ov.className = 'ov on wait';
    var envio = DEMO ? new Promise(function (ok) { setTimeout(function () { var q = CP.cotizar(S.d, cart, esEsp, entrega, S.zip, fecha);
        ok({ ok: true, nombre: primerNombre() || S.nombre.split(' ')[0], resumen: textoLineas(cart), entrega: entrega === 'domicilio' ? 'Entrega a domicilio' : 'Recoger',
             fecha: fecha, fechaTxt: flarga(fecha), subtotal: q.subtotal, envio: q.envio, urg: q.urg, total: q.total }); }, 1100); })
      : fetch(CFG.api, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow' }).then(function (r) { return r.json(); });
    envio.then(function (r) {
      var espera = Math.max(0, 1000 - (Date.now() - inicio));
      setTimeout(function () { if (r && r.ok) listo(r); else fallo(r || {}); }, espera);
    }).catch(function () { fallo({ error: 'No pudimos enviar tu pedido. Revisa tu conexión e intenta otra vez.' }); });
  }

  function listo(r) {
    var ov = $('ov');
    $('ov-wait').hidden = true;
    $('ov-mark').innerHTML = img(A.celebra, 190, 'Chizpita celebrando');
    $('ov-h').textContent = '¡Listo' + (r.nombre ? ', ' + r.nombre : '') + '!';
    $('ov-r').innerHTML = '<div><span>' + esc(r.resumen) + '</span><span>' + money(r.subtotal) + '</span></div>' +
      (r.envio ? '<div><span>Envío' + (r.urg ? ' (urgente)' : '') + '</span><span>' + money(r.envio) + '</span></div>' : '') +
      '<div><span>' + (String(r.entrega).indexOf('domicilio') >= 0 ? 'A domicilio' : 'Recoger') + '</span><span>' + esc(r.fechaTxt) + '</span></div>' +
      '<div class="tot"><span>Total</span><span>' + money(r.total) + '</span></div>';
    $('ov-a').textContent = 'Te escribimos por WhatsApp con ' + (String(r.entrega).indexOf('domicilio') >= 0 ? 'la hora de entrega' : 'la dirección para recoger') + ' y los datos para pagar. Ya puedes cerrar esta página.';
    $('ov-b').innerHTML = '<button id="ov-otro">Hacer otro pedido</button>';
    $('ov-otro').onclick = function () { S.cart = {}; S.rid = nuevoRid(); S.enviando = false; ov.className = 'ov'; render(); window.scrollTo(0, 0); };
    ov.className = 'ov on done';
  }

  function fallo(r) {
    var ov = $('ov');
    S.enviando = false;
    $('ov-wait').hidden = true;
    $('ov-h').textContent = r.cerrado ? 'Los pedidos están en pausa' : 'No se pudo enviar';
    $('ov-a').textContent = r.error || 'Intenta otra vez en un momento.';
    $('ov-a').textContent = (r.error || 'Intenta otra vez en un momento.') + ' ' + RESPONDE;
    $('ov-b').innerHTML = r.cerrado ? '' : '<button id="ov-back">Volver a mi pedido</button>';
    var b = $('ov-back'); if (b) b.onclick = function () { ov.className = 'ov'; };
    ov.className = 'ov on err';
  }

  /* ---------- vista de ejemplo (sin API) ---------- */
  function demo() {
    var hoy = new Date(), dd = function (n) { var x = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + n, 12); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
    var aViernes = (5 - hoy.getDay() + 7) % 7 || 7, v1 = dd(aViernes);
    return { ok: true, abierto: true, cierreTxt: 'miércoles 1:00 pm', horario: '', textoRecoger: 'Recoger: te enviamos la dirección por WhatsApp.',
      fechas: { defecto: v1, min: dd(1), max: dd(30), cerroEstaSemana: false, entregaSemana: v1, chips: [0, 7, 14].map(function (k, i) { return { fecha: dd(aViernes + k), proxima: i === 0 }; }) },
      sabores: [{ nombre: 'El Clasico', titulo: 'El Clásico', esp: false }, { nombre: 'Pizza', titulo: 'Pizza', esp: false }, { nombre: 'Chipotle', titulo: 'Chipotle', esp: false },
                { nombre: 'Aceituna Kalamata', titulo: 'Kalamata Olive', esp: false }, { nombre: 'Zatar', titulo: 'Zatar', esp: false },
                { nombre: 'Especial de la Semana', titulo: 'Chilaquil Verde', esp: true }],
      precios: { docena: 36, pieza: 4, especial: 42, envio: 10, envioMedio: 6, umbralMedio: 24, umbral: 36, envioFuera: 15, politicaNueva: true },
      zonas: ['92130', '92037'], zonasInactivas: ['91910', '91911', '91913', '91914', '91915', '92118'], diasEntrega: [], diaDefecto: 5,
      cliente: CODE ? { nombre: 'Ana', direccion: 'Av. del Mar 214', zip: '92130', ultimo: { lineas: [{ sabor: 'Pizza', piezas: 12 }], entrega: 'recoger', texto: '12 Pizza', yaNoHay: [] } } : null,
      codigoInvalido: false };
  }

  cargar();
})();
