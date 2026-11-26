/* Lector de la tarjeta de propiedad (licencia de tránsito) para el cotizador.
   La foto se procesa en el navegador con Tesseract.js: no sale del dispositivo.
   Solo se cargan desde el CDN la librería y el modelo de idioma, y solo cuando
   el cliente toca "Escanear". */
(function(){
  'use strict';

  var TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

  var MARCAS = ['HYUNDAI','KIA','CHEVROLET','RENAULT','MAZDA','TOYOTA','NISSAN','FORD','VOLKSWAGEN','SUZUKI',
    'MITSUBISHI','HONDA','PEUGEOT','CITROEN','FIAT','JEEP','DODGE','SUBARU','SSANGYONG','BMW','MERCEDES BENZ',
    'MERCEDES-BENZ','AUDI','VOLVO','JAC','BYD','CHERY','GREAT WALL','DFSK','DAEWOO','SKODA','SEAT','MG','JMC','FOTON'];

  var LINEAS = {
    HYUNDAI: ['GRAND I10','I10','I20','I25','I30','ACCENT','ELANTRA','SONATA','TUCSON','IX35','SANTA FE','CRETA','KONA',
      'VENUE','STARIA','H1','H-1','H100','PALISADE','VELOSTER','GETZ','ATOS','TERRACAN','GALLOPER','IONIQ','PORTER'],
    KIA: ['PICANTO','RIO','CERATO','FORTE','SPORTAGE','SORENTO','SOUL','NIRO','SONET','SELTOS','CARNIVAL','STONIC',
      'OPTIMA','K3','EV6','MOHAVE','CARENS','PREGIO','K2700','FRONTIER']
  };

  /* Primeros 3 caracteres del VIN (fabricante) → marca. Respaldo si el texto no trae la marca. */
  var WMI = {
    KMH:'HYUNDAI', KM8:'HYUNDAI', MAL:'HYUNDAI', TMA:'HYUNDAI', NLH:'HYUNDAI', '5NP':'HYUNDAI', '5NM':'HYUNDAI', '9BH':'HYUNDAI',
    KNA:'KIA', KNC:'KIA', KND:'KIA', KNE:'KIA', U5Y:'KIA', U6Y:'KIA', '3KP':'KIA', '5XX':'KIA', '5XY':'KIA'
  };

  /* Carácter 10 del VIN → año modelo (ciclo 2001–2030). */
  var VIN_ANIO = 'ABCDEFGHJKLMNPRSTVWXY123456789'.split('').reduce(function(m, c, i){
    m[c] = i < 21 ? 2010 + i : 2001 + (i - 21); return m;
  }, {});

  function titulo(s){
    return s.toLowerCase().replace(/(^|[\s-])([a-záéíóúñ])/g, function(_, a, b){ return a + b.toUpperCase(); })
      .replace(/\b(i\d+|ix\d+|h\d+|k\d+|ev\d+|gl|gls|gt|lx|ex|sx|at|mt|crdi)\b/gi, function(w){ return w.toUpperCase(); });
  }

  /* Un VIN tiene 17 caracteres (sin I, O, Q) y termina en números de serie. */
  function limpiarVin(tok){
    var t = tok.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/[OQ]/g, '0').replace(/I/g, '1');
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(t)) return '';
    if (!/^[A-Z0-9]{13}\d{4}$/.test(t)) return '';
    if ((t.match(/\d/g) || []).length < 5 || !/[A-Z]/.test(t)) return '';
    return t;
  }

  /* La tarjeta trae el VIN dos veces (VIN y número de chasis): se elige la lectura
     que más se repite y, a igualdad, la de un fabricante conocido. */
  function buscarVin(lineas){
    var votos = {};
    lineas.forEach(function(l){
      var toks = l.split(/\s+/);
      toks.forEach(function(t, j){
        [t, toks[j + 1] ? t + toks[j + 1] : ''].forEach(function(c){
          var v = c && limpiarVin(c);
          if (v) votos[v] = (votos[v] || 0) + 1;
        });
      });
    });
    return Object.keys(votos).sort(function(a, b){
      return (votos[b] - votos[a]) || ((WMI[b.slice(0, 3)] ? 1 : 0) - (WMI[a.slice(0, 3)] ? 1 : 0));
    })[0] || '';
  }

  /* Número de motor: letras y números (ej. G4KDJU123456), distinto del VIN, la placa o una fecha. */
  function esMotor(t, vin){
    return t.length >= 6 && t.length <= 16 && t !== vin && /[A-Z]/.test(t) && (t.match(/\d/g) || []).length >= 4
      && !/^[A-Z]{3}\d{2,3}[A-Z]?$/.test(t) && !/^(?:KG|PSJ|CC|HP)/.test(t);
  }

  /* En la tarjeta el valor va debajo de la etiqueta "NÚMERO DE MOTOR" (o al lado, según la lectura). */
  function buscarMotor(lineas, vin){
    var limpiar = function(s){ return s.split(' ').map(function(t){ return t.replace(/[^A-Z0-9]/g, ''); }); };
    for (var i = 0; i < lineas.length; i++) {
      var k = lineas[i].search(/MOTOR/);
      if (k === -1) continue;
      var cand = limpiar(lineas[i].slice(k + 5)).concat(limpiar(lineas[i + 1] || ''), limpiar(lineas[i + 2] || ''));
      for (var j = 0; j < cand.length; j++) if (esMotor(cand[j], vin)) return cand[j];
    }
    /* Respaldo: código de motor Hyundai/Kia (G4KD…, D4HA…, G4LA…) en cualquier parte. */
    var m = lineas.join(' ').match(/\b[GDLC]\d[A-Z]{2}[A-Z0-9]{4,12}\b/);
    return m && esMotor(m[0], vin) ? m[0] : '';
  }

  function esAnio(n){ n = +n; return n >= 1980 && n <= new Date().getFullYear() + 1; }

  /* Convierte el texto leído por OCR en los datos del vehículo. */
  function parse(texto){
    var T = texto.toUpperCase().replace(/[|]/g, ' ');
    var lineas = T.split(/\n+/).map(function(l){ return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    var r = { marca:'', linea:'', anio:'', cilindraje:'', combustible:'', vin:'', motor:'', transmision:'' };

    r.vin = buscarVin(lineas);
    r.motor = buscarMotor(lineas, r.vin);

    /* Marca: la línea de valores de la tarjeta suele ser "PLACA MARCA LÍNEA MODELO CILINDRADA". */
    var lineaMarca = '';
    MARCAS.some(function(m){
      var re = new RegExp('\\b' + m.replace(/[-\s]/g, '[-\\s]?') + '\\b');
      for (var i = 0; i < lineas.length; i++) {
        if (re.test(lineas[i]) && !/^MARCA\b/.test(lineas[i])) {
          r.marca = m.replace('MERCEDES BENZ', 'MERCEDES-BENZ'); lineaMarca = lineas[i]; return true;
        }
      }
      return false;
    });
    if (!r.marca && r.vin) r.marca = WMI[r.vin.slice(0, 3)] || '';

    if (lineaMarca) {
      var resto = lineaMarca.slice(lineaMarca.search(new RegExp(r.marca.replace('-', '[-\\s]?'))) + r.marca.length).trim();
      var m = resto.match(/^(.*?)\s+((?:19|20)\d\d)\b(?:\s+(\d{3,4}))?/);
      if (m) {
        r.linea = m[1].replace(/^[^A-Z0-9]+/, '').trim();
        if (esAnio(m[2])) r.anio = m[2];
        if (m[3] && +m[3] >= 600 && +m[3] <= 8000) r.cilindraje = m[3];
      } else {
        r.linea = resto.split(' ').slice(0, 3).join(' ');
      }
    }

    /* Línea conocida en cualquier parte del texto, si la fila de valores no se leyó bien. */
    var conocidas = LINEAS[r.marca] || [];
    if (!r.linea || conocidas.indexOf(r.linea.split(' ')[0]) === -1) {
      conocidas.some(function(l){
        var mm = T.match(new RegExp('\\b' + l.replace(/[-\s]/g, '[-\\s]?') + '\\b[^\\n]{0,20}'));
        if (mm) { r.linea = mm[0].replace(/\s+((?:19|20)\d\d)\b.*$/, '').trim(); return true; }
        return false;
      });
    }

    if (!r.anio) {
      var anios = (T.match(/(^|[^\/\-\d])((?:19|20)\d\d)(?![\/\-\d])/g) || [])
        .map(function(s){ return s.replace(/\D/g, ''); }).filter(esAnio);
      if (anios.length) r.anio = anios[0];
      else if (r.vin && VIN_ANIO[r.vin[9]]) r.anio = String(VIN_ANIO[r.vin[9]]);
    }

    if (!r.cilindraje) {
      var cc = T.match(/CILINDRA[DJ]A[^\n]*\n?[^\n]*?\b(\d{3,4})\b/);
      if (cc && +cc[1] >= 600 && +cc[1] <= 8000) r.cilindraje = cc[1];
    }

    var comb = T.match(/\b(GASOLINA|DIESEL|DI[EÉ]SEL|ACPM|GAS NATURAL|GNV|EL[EÉ]CTRICO|H[IÍ]BRIDO|GAS[\s\/-]GASOLINA)\b/);
    if (comb) r.combustible = titulo(comb[1].replace('ACPM', 'Diésel'));

    /* El OCR a veces pega la versión y la caja ("GLAT" → "GL AT"). */
    r.linea = r.linea.replace(/\b(GLS|GL|LX|EX|SX|LS|GT|LT|SE|XS)(AT|MT)\b/g, '$1 $2');

    /* La tarjeta no tiene campo de transmisión; a veces la línea lo incluye (ej. "TUCSON GL AT"). */
    var lin = ' ' + r.linea + ' ';
    if (/\s(AT|A\/T|AUT|AUTO|AUTOMATIC[OA]?|AUTOMATICA|CVT|DCT)\s/.test(lin)) r.transmision = 'Automática';
    else if (/\s(MT|M\/T|MEC|MECANIC[OA]|MANUAL)\s/.test(lin)) r.transmision = 'Mecánica';

    return r;
  }

  /* ---------- Imagen → canvas preparado para OCR ---------- */
  function prepararImagen(file){
    return new Promise(function(resolve, reject){
      var img = new Image();
      img.onload = function(){
        var escala = Math.min(2200 / Math.max(img.width, img.height), 3);
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * escala);
        c.height = Math.round(img.height * escala);
        var ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var d = ctx.getImageData(0, 0, c.width, c.height), p = d.data, min = 255, max = 0, i, g;
        for (i = 0; i < p.length; i += 4) {
          g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
          p[i] = g; if (g < min) min = g; if (g > max) max = g;
        }
        var k = 255 / Math.max(max - min, 1);
        for (i = 0; i < p.length; i += 4) { g = (p[i] - min) * k; p[i] = p[i + 1] = p[i + 2] = g; }
        ctx.putImageData(d, 0, 0);
        URL.revokeObjectURL(img.src);
        resolve(c);
      };
      img.onerror = function(){ reject(new Error('imagen')); };
      img.src = URL.createObjectURL(file);
    });
  }

  var cargando = null;
  function cargarTesseract(){
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (cargando) return cargando;
    cargando = new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = TESSERACT_URL; s.async = true;
      s.onload = function(){ resolve(window.Tesseract); };
      s.onerror = function(){ cargando = null; reject(new Error('red')); };
      document.head.appendChild(s);
    });
    return cargando;
  }

  /* ---------- Interfaz ---------- */
  function iniciar(){
    var input = document.getElementById('scanInput');
    var estado = document.getElementById('scanStatus');
    var form = document.getElementById('finderForm');
    if (!input || !estado || !form) return;

    var barra = document.createElement('div');
    barra.className = 'scan-progress'; barra.hidden = true;
    barra.innerHTML = '<span></span>';
    estado.parentNode.appendChild(barra);

    function mostrar(msg, clase, pct){
      estado.textContent = msg;
      estado.className = 'scan-status' + (clase ? ' ' + clase : '');
      barra.hidden = pct == null;
      if (pct != null) barra.firstChild.style.width = Math.round(pct * 100) + '%';
    }

    function poner(id, valor){
      var el = document.getElementById(id);
      if (!el || !valor) return false;
      el.value = valor;
      el.classList.add('is-filled');
      el.dispatchEvent(new Event('change'));
      return true;
    }

    form.addEventListener('input', function(e){ e.target.classList.remove('is-filled'); });

    input.addEventListener('change', function(){
      var file = input.files && input.files[0];
      input.value = '';
      if (!file) return;

      mostrar('Preparando el lector…', 'is-busy', 0.02);
      var worker;
      Promise.all([prepararImagen(file), cargarTesseract()])
        .then(function(res){
          var canvas = res[0];
          return res[1].createWorker('spa', 1, {
            logger: function(m){
              if (m.status === 'recognizing text') mostrar('Leyendo la tarjeta… ' + Math.round(m.progress * 100) + ' %', 'is-busy', 0.3 + m.progress * 0.7);
              else if (/loading|initializ/.test(m.status)) mostrar('Cargando el lector (solo la primera vez)…', 'is-busy', 0.05 + (m.progress || 0) * 0.25);
            }
          }).then(function(w){ worker = w; return w.recognize(canvas); });
        })
        .then(function(out){
          if (worker) worker.terminate();
          var d = parse(out.data.text || '');
          var marcaSel = document.getElementById('finderMarca');
          var esHK = d.marca === 'HYUNDAI' || d.marca === 'KIA';
          var n = 0;

          if (d.marca) n += poner('finderMarca', esHK ? titulo(d.marca) : 'Otra marca');
          var modelo = [esHK || !d.marca ? '' : d.marca, d.linea].filter(Boolean).join(' ');
          if (modelo) n += poner('finderModelo', titulo(modelo));
          n += poner('finderAnio', d.anio);
          n += poner('finderVin', d.vin);
          n += poner('finderMotor', d.motor);
          n += poner('finderCaja', d.transmision);
          var extra = poner('finderCilindraje', d.cilindraje) + poner('finderCombustible', d.combustible);
          n += extra;
          if (extra) document.getElementById('finderExtra').open = true;
          if (marcaSel.value === 'Otra marca' && !esHK && d.marca) marcaSel.classList.add('is-filled');

          form.dataset.scanned = n ? '1' : '';
          if (typeof gtag === 'function') gtag('event', 'tarjeta_escaneada', { campos: n });

          if (n >= 2) {
            mostrar('Listo: revisa los datos en verde' + (d.vin || d.motor ? ' (sobre todo el VIN y el número de motor, letra por letra)' : '') + (d.transmision ? '' : ', elige la transmisión') + ' y escribe el repuesto.', 'is-ok');
          } else if (n === 1) {
            mostrar('Leímos solo una parte. Revisa los datos y completa lo que falte, o toma otra foto más cerca y con buena luz.', 'is-error');
          } else {
            mostrar('No pudimos leer la tarjeta. Toma la foto de frente, sin reflejos y con buena luz, o escribe los datos.', 'is-error');
          }
          if (n) document.getElementById(d.transmision ? 'finderRepuesto' : 'finderCaja').focus({ preventScroll: false });
        })
        .catch(function(err){
          if (worker) worker.terminate();
          mostrar(err && err.message === 'red'
            ? 'No se pudo cargar el lector. Revisa tu conexión a internet o escribe los datos.'
            : 'No pudimos abrir la foto. Intenta de nuevo o escribe los datos.', 'is-error');
        });
    });
  }

  window.HKTarjeta = { parse: parse };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
