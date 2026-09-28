import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'library-v2', 'data');
const AUDIT_FILE = path.join(DATA_DIR, 'source_audit.json');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const CATALOG_JS_FILE = path.join(DATA_DIR, 'catalog-data.js');

if (!fs.existsSync(AUDIT_FILE)) {
  throw new Error(`No se encontró el archivo de auditoría: ${AUDIT_FILE}`);
}

const auditRecords = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));

console.log(`=== NORMALIZACIÓN CANÓNICA ENRIQUECIDA DE ${auditRecords.length} EJERCICIOS ===\n`);

const GENERIC_TITLES = new Set([
  'EJERCICIO',
  'DESCRIPCIÓN DEL EJERCICIO Y REGLAS',
  'SESIÓN DE ENTRENAMIENTO',
]);

const SUPABASE_STORAGE_BASE = 'https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/library-v2-preview';

// Taxonomía canónica preferente (Sección 3)
const CATEGORY_MAP = {
  'Agilidad y Coordinación': 'Coordinación y agilidad',
  'Definición y Finalización': 'Finalización',
  'Finalización': 'Finalización',
  'Pase, Técnica y Posesión': 'Pase y posesión',
  'Posesión': 'Pase y posesión',
  'Resistencia y Preparación Física': 'Físico con balón',
  'Defensa y Duelos 1v1': 'Defensa y duelos',
  'Portería': 'Porteros',
  'Transición': 'Transiciones',
  'Táctica': 'Táctica',
  'Técnico-táctico': 'Técnico-táctico',
  'Juego reducido': 'Juego reducido',
};

// Mapeo de pictogramas / iconos para materiales (Sección 19)
const MATERIAL_ICONS = {
  'balón': '⚽',
  'balón de fútbol': '⚽',
  'balon': '⚽',
  'pelota de tenis': '🎾',
  'balon_medicinal': '🏐',
  'cono': '🔺',
  'conos': '🔺',
  'portería': '🥅',
  'porteria': '🥅',
  'miniportería': '🥅',
  'miniporteria': '🥅',
  'escalera': '🪜',
  'valla': '🚧',
  'aro': '⭕',
  'aros': '⭕',
  'pica': '📍',
  'picas': '📍',
  'colchoneta': '🟦',
  'cronometro': '⏱️',
  'cronómetro': '⏱️',
  'goma_elastica': '➰',
  'banda elástica corta': '➰',
  'step': '⏹️',
  'pared': '🧱',
  'marca': '▫️',
  'planilla': '📋',
};

function getMaterialIcon(name = '') {
  const lower = name.toLowerCase().trim();
  for (const [key, icon] of Object.entries(MATERIAL_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📦';
}

function deriveVisibleTitle(raw, collection) {
  const original = (raw.nombre || '').trim();
  if (collection === 'PDF98' && GENERIC_TITLES.has(original.toUpperCase())) {
    const candidate = (raw.que_se_busca && raw.que_se_busca[0])
      || (raw.objetivos?.generales && raw.objetivos.generales[0])
      || (raw.objetivos?.general && raw.objetivos.general[0]);
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }
  return original || 'Ejercicio';
}

function normalizeFormatoJuego(val, defaultVal = 'futbol_11') {
  if (!val) return defaultVal;
  const cleanStr = String(val)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const stripped = cleanStr.replace(/[\s_\-]+/g, '');

  if (stripped === 'todos') {
    return 'todos';
  }
  if (stripped === 'f7' || stripped === 'futbol7' || stripped === 'futbolsiete') {
    return 'futbol_7';
  }
  if (stripped === 'f11' || stripped === 'futbol11' || stripped === 'futbolonce') {
    return 'futbol_11';
  }
  return defaultVal;
}

function normalizeExercise(record) {
  const raw = record.raw_json;
  const collection = record.collection;
  const id = record.exercise_id;

  const visibleTitle = deriveVisibleTitle(raw, collection);
  const originalTitle = (raw.nombre || '').trim();

  // 1. Identidad
  const identidad = {
    id,
    nombre: visibleTitle,
    titulo_original_fuente: originalTitle,
  };

  // 2. Formato de juego canónico
  const rawFormato = raw.clasificacion?.formato_juego
    || raw.formato_juego
    || raw.clasificacion?.formato
    || raw.formato
    || raw.format
    || '';
  const formato_juego = normalizeFormatoJuego(rawFormato);

  // 3. Categoría canónica (Sección 3)
  const rawCat = raw.clasificacion?.categoria_fuente
    || raw.clasificacion?.categoria_principal
    || '';
  let categoria = CATEGORY_MAP[rawCat] || rawCat || 'Técnico-táctico';
  if (categoria === 'Físico con balón') {
    const hasBall = (raw.materiales || []).some((m) => (m.tipo || m.nombre_es || '').toLowerCase().includes('balón'));
    if (!hasBall) categoria = 'Calentamiento / activación';
  }

  const subcategoria = raw.clasificacion?.subcategoria || null;
  const rawTags = Array.isArray(raw.clasificacion?.etiquetas) ? raw.clasificacion.etiquetas : [];
  const etiquetas = [...new Set(rawTags.filter((t) => t && t !== 'PDF150' && t !== 'PDF98' && t !== rawCat))];

  // 3. Qué se trabaja (Sección 4: 3-6 conceptos futbolísticos prioritarios)
  const conceptSet = new Set();
  if (Array.isArray(raw.que_se_busca)) {
    raw.que_se_busca.forEach((s) => { if (typeof s === 'string' && s.trim()) conceptSet.add(s.trim()); });
  }
  if (Array.isArray(raw.que_se_trabaja)) {
    for (const item of raw.que_se_trabaja) {
      if (typeof item === 'string' && item.trim()) conceptSet.add(item.trim());
      else if (item && Array.isArray(item.contenidos)) {
        item.contenidos.forEach((c) => { if (typeof c === 'string' && c.trim()) conceptSet.add(c.trim()); });
      }
    }
  }
  if (raw.objetivos) {
    ['tecnicos', 'tecnicos_ofensivos', 'tecnicos_defensivos', 'tacticos', 'coordinativos', 'fisicos'].forEach((k) => {
      (raw.objetivos[k] || []).forEach((o) => { if (typeof o === 'string' && o.trim()) conceptSet.add(o.trim()); });
    });
  }
  const allConcepts = [...conceptSet];
  // Priorizar entre 3 y 6 conceptos sin redundancias
  const queSeTrabaja = allConcepts.slice(0, 6);

  // 4. Objetivos (Sección 5: Principal + Secundarios deduplicados)
  const rawObjGeneral = (raw.objetivos?.general && raw.objetivos.general[0])
    || (raw.objetivos?.generales && raw.objetivos.generales[0])
    || (raw.que_se_busca && raw.que_se_busca[0])
    || (raw.explicacion?.breve)
    || visibleTitle;
  const objetivoPrincipal = String(rawObjGeneral).trim();

  const secundariosSet = new Set();
  const subKeys = ['tacticos', 'tecnicos', 'tecnicos_ofensivos', 'tecnicos_defensivos', 'coordinativos', 'fisicos'];
  for (const k of subKeys) {
    const list = raw.objetivos?.[k] || [];
    for (const item of list) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed && trimmed.toLowerCase() !== objetivoPrincipal.toLowerCase() && trimmed.toLowerCase() !== visibleTitle.toLowerCase()) {
          secundariosSet.add(trimmed);
        }
      }
    }
  }
  const objetivosSecundarios = [...secundariosSet].slice(0, 4);

  // 5. Jugadores y Roles (Sección 6)
  const numTotal = raw.organizacion?.numero_total_jugadores
    ?? raw.organizacion?.participantes_totales
    ?? raw.organizacion?.numero_representado
    ?? (raw.roles && raw.roles.length)
    ?? null;
  const porteros = raw.organizacion?.porteros_representados
    ?? (typeof raw.organizacion?.porteros === 'number' ? raw.organizacion.porteros : null);
  const atacantes = raw.organizacion?.atacantes_representados ?? null;
  const defensores = raw.organizacion?.defensores_representados ?? null;
  const neutros = raw.organizacion?.neutros_representados ?? null;
  const entrenadores = raw.organizacion?.entrenadores_representados
    ?? ((raw.roles || []).filter((r) => (r.rol || '').toLowerCase().includes('entrenador')).length || null);

  let jugadoresTexto = '';
  if (numTotal) {
    if (porteros && porteros > 0) {
      const deCampo = numTotal - porteros - (entrenadores || 0);
      jugadoresTexto = `${deCampo > 0 ? `${deCampo} de campo` : `${numTotal} jugadores`} + ${porteros} portero${porteros > 1 ? 's' : ''}`;
    } else {
      jugadoresTexto = `${numTotal} jugadores`;
    }
  } else if (raw.organizacion?.descripcion_fuente) {
    jugadoresTexto = raw.organizacion.descripcion_fuente;
  }

  // Roles estructurados con colores exactos del render
  const rawRoles = Array.isArray(raw.roles) ? raw.roles : (raw.organizacion?.roles_iniciales || []);
  const roleColors = {
    atacante: '#3477DB',
    defensor: '#CC272D',
    portero: '#7957B5',
    entrenador: '#657078',
    apoyo: '#E5C449',
    neutral: '#159A91',
  };

  const roles = rawRoles.map((r) => {
    const rolName = r.rol || r.nombre || 'Jugador';
    const lower = rolName.toLowerCase();
    let color = r.color_token || r.color;
    if (!color) {
      if (lower.includes('atacante')) color = roleColors.atacante;
      else if (lower.includes('defensor') || lower.includes('oposicion') || lower.includes('oposición')) color = roleColors.defensor;
      else if (lower.includes('portero')) color = roleColors.portero;
      else if (lower.includes('entrenador') || lower.includes('evaluador')) color = roleColors.entrenador;
      else if (lower.includes('apoyo')) color = roleColors.apoyo;
      else color = '#3477DB';
    }

    let posicionText = null;
    if (r.posicion_inicial?.descripcion) {
      posicionText = r.posicion_inicial.descripcion;
    } else if (r.posicion_inicial?.x !== undefined && r.posicion_inicial?.y !== undefined) {
      const x = r.posicion_inicial.x;
      const y = r.posicion_inicial.y;
      const horiz = x < 0.35 ? 'banda izquierda' : (x > 0.65 ? 'banda derecha' : 'carril central');
      const vert = y < 0.35 ? 'zona inicial/defensiva' : (y > 0.65 ? 'zona de finalización' : 'medio campo');
      posicionText = `${horiz}, ${vert}`;
    }

    return {
      id: r.id || null,
      rol: rolName,
      color,
      funcion: r.funcion || r.cometido || null,
      posicion: posicionText,
      grupo: r.grupo || null,
    };
  });

  // 6. Montaje (Sección 7)
  const espacioDims = raw.espacio?.dimensiones
    || raw.espacio?.dimensiones_fuente
    || (raw.espacio?.zona_utilizada && !raw.espacio.zona_utilizada.includes('Se juega') ? raw.espacio.zona_utilizada : null);
  const espacioTipo = raw.espacio?.tipo || raw.espacio?.zona_utilizada || null;

  let montajeTexto = raw.montaje?.descripcion;
  if (!montajeTexto) {
    if (espacioDims) {
      montajeTexto = `Delimitar un espacio de ${espacioDims} según el esquema indicado.`;
    } else if (espacioTipo) {
      montajeTexto = `Montaje sobre ${espacioTipo}.`;
    }
  }

  // 7. Material Operativo (Sección 8)
  const rawMats = Array.isArray(raw.materiales) ? raw.materiales : [];
  const matsMap = new Map();
  for (const m of rawMats) {
    const name = m.nombre_es || m.tipo || m.nombre || 'Material';
    const icon = getMaterialIcon(name);
    const cant = m.cantidad ?? m.cantidad_observada_diagrama ?? m.cantidad_representada ?? null;
    const func = m.funcion || null;
    const key = name.toLowerCase().trim();
    if (!matsMap.has(key)) {
      matsMap.set(key, { nombre: name, cantidad: cant, funcion: func, icono: icon });
    } else if (cant && !matsMap.get(key).cantidad) {
      matsMap.get(key).cantidad = cant;
    }
  }
  const materiales = [...matsMap.values()];

  // 8. Cómo se hace (Desarrollo paso a paso numerado) (Sección 9)
  let pasos = [];
  if (Array.isArray(raw.explicacion?.desarrollo_paso_a_paso) && raw.explicacion.desarrollo_paso_a_paso.length) {
    pasos = raw.explicacion.desarrollo_paso_a_paso;
  } else if (Array.isArray(raw.reglas) && raw.reglas.length) {
    pasos = raw.reglas;
  } else if (typeof raw.explicacion?.completa === 'string') {
    pasos = raw.explicacion.completa.split('\n').map((s) => s.trim()).filter((s) => s.length > 5);
  } else if (Array.isArray(raw.fases) && raw.fases.length) {
    pasos = raw.fases.map((f) => f.descripcion || f.accion_principal).filter(Boolean);
  }
  const pasosUnicos = [];
  const pasosSet = new Set();
  for (const p of pasos) {
    const text = typeof p === 'string' ? p.trim() : String(p).trim();
    if (text.length > 2 && !pasosSet.has(text.toLowerCase())) {
      pasosSet.add(text.toLowerCase());
      pasosUnicos.push(text);
    }
  }
  pasos = pasosUnicos;

  // 9. Fases (Sección 10: solo si son múltiples y estructuradas)
  let fases = [];
  if (Array.isArray(raw.fases) && raw.fases.length > 1) {
    fases = raw.fases.map((f, idx) => ({
      orden: f.orden ?? idx + 1,
      titulo: f.fase_id ? `Fase ${idx + 1}` : (f.nombre || `Paso ${idx + 1}`),
      descripcion: f.descripcion || f.accion_principal || f.accion || '',
      poseedor_balon: f.poseedor_inicial || null,
      que_ocurre_despues: f.que_ocurre_despues || null,
      condicion_final: f.condicion_final || null,
    })).filter((f) => f.descripcion);
  }

  // 10. Carga y Ciclo de Repetición (Sección 11)
  const duracion = raw.tiempos_fuente?.duracion_total
    || raw.tiempos_fuente?.duracion_bloque
    || raw.tiempos_recomendados_editoriales?.duracion_bloque
    || null;
  const series = raw.series ? (typeof raw.series === 'object' ? `${raw.series.cantidad || ''} ${raw.series.detalle || ''}`.trim() : String(raw.series)) : null;
  const repeticiones = raw.repeticiones ? (typeof raw.repeticiones === 'object' ? `${raw.repeticiones.cantidad || ''} ${raw.repeticiones.detalle || ''}`.trim() : String(raw.repeticiones)) : null;
  const descanso = raw.tiempos_fuente?.descanso
    || raw.tiempos_recomendados_editoriales?.pausa_repeticion
    || null;
  const restartLogic = raw.animation?.restart_logic || null;

  // 11. Rotación (Sección 12: Bloque independiente)
  let rotacionInfo = null;
  const rotRaw = raw.rotaciones;
  if (rotRaw) {
    const hayRot = rotRaw.hay_rotacion !== false && (Boolean(rotRaw.hay_rotacion) || Boolean(rotRaw.descripcion?.length) || Boolean(rotRaw.cambios_de_posicion?.length) || Boolean(rotRaw.cambio_rol));
    const descripciones = [
      ...(Array.isArray(rotRaw.descripcion) ? rotRaw.descripcion : (rotRaw.descripcion ? [rotRaw.descripcion] : [])),
      ...(Array.isArray(rotRaw.cambios_de_posicion) ? rotRaw.cambios_de_posicion : []),
    ];
    if (hayRot || descripciones.length > 0) {
      rotacionInfo = {
        hay_rotacion: true,
        explicacion: descripciones[0] || 'Intercambio de roles o posiciones al terminar la acción.',
        detalles: descripciones.slice(1),
      };
    }
  }
  // Si no había objeto explícito, buscar menciones de rotación en pasos o restart logic
  if (!rotacionInfo && restartLogic && /cambio de rol|rotan|intercambio|vuelve caminando/i.test(restartLogic)) {
    rotacionInfo = {
      hay_rotacion: true,
      explicacion: restartLogic,
      detalles: [],
    };
  }

  // 12. Qué debo observar (Sección 13)
  const queObservarSet = new Set();
  const queObservar = [];
  (Array.isArray(raw.que_debemos_observar) ? raw.que_debemos_observar : []).forEach((s) => {
    if (typeof s === 'string' && s.trim().length > 3) {
      const trimmed = s.trim();
      const norm = trimmed.toLowerCase();
      if (!queObservarSet.has(norm)) {
        queObservarSet.add(norm);
        queObservar.push(trimmed);
      }
    }
  });

  // 13. Consignas (Sección 14: frases directas del entrenador)
  const consignasSet = new Set();
  const consignas = [];
  const rawConsignas = [
    ...(Array.isArray(raw.consignas) ? raw.consignas : []),
    ...(Array.isArray(raw.consignas_fuente) ? raw.consignas_fuente : []),
  ];
  for (const c of rawConsignas) {
    if (typeof c === 'string' && c.trim().length > 3) {
      const trimmed = c.trim();
      const norm = trimmed.toLowerCase();
      if (!queObservarSet.has(norm) && !consignasSet.has(norm)) {
        consignasSet.add(norm);
        consignas.push(trimmed);
      }
    }
  }

  // 14. Errores y Correcciones (Sección 15)
  // Deduplicación estricta de fuentes de corrección
  const rawCorreccionesSet = new Set();
  const rawCorrecciones = [];
  const candidatesCorr = [
    ...(Array.isArray(raw.correcciones_fuente) ? raw.correcciones_fuente : []),
    ...(Array.isArray(raw.correcciones?.fuente) ? raw.correcciones.fuente : []),
    ...(Array.isArray(raw.correcciones) ? raw.correcciones : []),
  ];
  for (const c of candidatesCorr) {
    if (typeof c === 'string' && c.trim().length > 3) {
      const trimmed = c.trim();
      const norm = trimmed.toLowerCase();
      if (!rawCorreccionesSet.has(norm)) {
        rawCorreccionesSet.add(norm);
        rawCorrecciones.push(trimmed);
      }
    }
  }

  const erroresCorrecciones = [];
  const seenEC = new Set();

  if (Array.isArray(raw.errores) && raw.errores.length > 0) {
    raw.errores.forEach((err, idx) => {
      const errText = typeof err === 'string' ? err.trim() : (err?.descripcion?.trim() || null);
      const corrCandidate = rawCorrecciones[idx] || null;
      const corrText = typeof corrCandidate === 'string' ? corrCandidate.trim() : (corrCandidate?.descripcion?.trim() || null);
      if (errText || corrText) {
        const key = `${(errText || '').toLowerCase()}___${(corrText || '').toLowerCase()}`;
        if (!seenEC.has(key)) {
          seenEC.add(key);
          erroresCorrecciones.push({
            error: errText,
            correccion: corrText,
          });
        }
      }
    });
  } else if (rawCorrecciones.length > 0) {
    // Si no hay errores catalogados explícitamente, solo incluir correcciones que NO repitan lo ya dicho en que_observar o consignas
    rawCorrecciones.forEach((c) => {
      const norm = c.toLowerCase();
      if (!queObservarSet.has(norm) && !consignasSet.has(norm)) {
        const key = `null___${norm}`;
        if (!seenEC.has(key)) {
          seenEC.add(key);
          erroresCorrecciones.push({ error: null, correccion: c });
        }
      }
    });
  }

  // 15. Variantes (Sección 16)
  const variantesSet = new Set();
  const variantes = [];
  (Array.isArray(raw.variantes_fuente) ? raw.variantes_fuente : [])
    .filter((v) => typeof v === 'string' && v.trim().length > 3)
    .forEach((v) => {
      const trimmed = v.trim();
      const norm = trimmed.toLowerCase();
      if (!variantesSet.has(norm)) {
        variantesSet.add(norm);
        const parts = trimmed.split(/\.\s*|\:\s*/);
        variantes.push({
          texto: trimmed,
          cambio: parts[0]?.trim() || trimmed,
          proposito: parts.slice(1).join('. ').trim() || null,
        });
      }
    });

  // 16. Leyenda Visual Real (Secciones 17 a 21)
  const leyRaw = raw.leyenda || {};

  // Jugadores en la leyenda
  const leyJugadores = [];
  const seenPlayerRoles = new Set();
  const rawLeyPlayers = leyRaw.jugadores_y_roles || leyRaw.jugadores || [];
  for (const p of rawLeyPlayers) {
    const rol = p.rol || p.significado || p.tipo || 'Jugador';
    const key = rol.toLowerCase().trim();
    if (!seenPlayerRoles.has(key)) {
      seenPlayerRoles.add(key);
      let color = p.color_token || p.color;
      const SPANISH_COLOR_TO_HEX = {
        'azul': '#3477DB',
        'rojo': '#CC272D',
        'amarillo': '#E5C449',
        'morado': '#7957B5',
        'gris': '#657078',
        'verde': '#22C55E',
        'naranja': '#F97316',
        'negro': '#1F2937',
        'blanco': '#FFFFFF',
      };
      if (color && SPANISH_COLOR_TO_HEX[color.toLowerCase()]) {
        color = SPANISH_COLOR_TO_HEX[color.toLowerCase()];
      }
      if (!color) {
        if (key.includes('atacante')) color = '#3477DB';
        else if (key.includes('defensor') || key.includes('oposición') || key.includes('oposicion')) color = '#CC272D';
        else if (key.includes('portero')) color = '#7957B5';
        else if (key.includes('entrenador') || key.includes('evaluador')) color = '#657078';
        else if (key.includes('apoyo')) color = '#E5C449';
        else color = '#3477DB';
      }

      let letra = 'J';
      if (key.includes('atacante')) letra = 'A';
      else if (key.includes('defensor') || key.includes('oposición') || key.includes('oposicion')) letra = 'D';
      else if (key.includes('portero')) letra = 'P';
      else if (key.includes('entrenador') || key.includes('evaluador')) letra = 'E';
      else if (key.includes('apoyo') || key.includes('comodín')) letra = 'C';

      leyJugadores.push({
        rol,
        color,
        letra,
        funcion: p.funcion_en_el_ejercicio || p.significado || null,
      });
    }
  }

  // Materiales en la leyenda
  const leyMateriales = materiales.map((m) => ({
    nombre: m.nombre,
    icono: m.icono,
    cantidad: m.cantidad,
    funcion: m.funcion,
  }));

  // Acciones en la leyenda (Trazos gráficos reales)
  const leyAcciones = [];
  const rawActions = leyRaw.acciones_graficas || leyRaw.acciones || [];
  const seenActions = new Set();
  for (const a of rawActions) {
    const tipo = a.tipo || a.nombre_es || 'acción';
    const key = tipo.toLowerCase().trim();
    if (!seenActions.has(key)) {
      seenActions.add(key);
      let estilo = a.estilo_linea || 'continua';
      let trazo = '──────▶';
      let nombre = a.nombre_es || tipo;
      let color = a.color || '#FFFFFF';

      if (key.includes('carrera') || key.includes('desplazamiento') || key.includes('discontinua')) {
        estilo = 'discontinua';
        trazo = '- - - - ▶';
        nombre = 'Desplazamiento / carrera';
        color = '#3477DB';
      } else if (key.includes('conduccion') || key.includes('conducción')) {
        estilo = 'ondulada';
        trazo = '~~~~~~▶';
        nombre = 'Conducción con balón';
        color = '#3477DB';
      } else if (key.includes('pase') || key.includes('remate') || key.includes('centro') || key.includes('blanca')) {
        estilo = 'continua';
        trazo = '──────▶';
        nombre = 'Pase / remate';
        color = '#FFFFFF';
      }

      leyAcciones.push({
        tipo,
        nombre,
        estilo,
        trazo,
        color,
        significado: a.significado || nombre,
      });
    }
  }

  // Zonas en la leyenda (solo si existen de verdad)
  let leyZonas = null;
  const rawZonas = leyRaw.zonas || raw.montaje?.zonas || raw.espacio?.zonas_funcionales || [];
  if (Array.isArray(rawZonas) && rawZonas.length > 0) {
    leyZonas = rawZonas.map((z, idx) => ({
      id: z.id || `Z${idx + 1}`,
      detalle: z.detalle || z.nombre || 'Zona de trabajo delimitada',
      estilo: 'contorno discontinuo',
    }));
  }

  // Datos Rápidos (Sección 24)
  const datosRapidos = {
    jugadores: jugadoresTexto || (numTotal ? `${numTotal} jugadores` : null),
    duracion: duracion || (raw.tiempos_recomendados_editoriales?.duracion_bloque ? `${raw.tiempos_recomendados_editoriales.duracion_bloque}` : null),
    espacio: espacioDims || espacioTipo || null,
    material: materiales.length ? `${materiales.slice(0, 3).map((m) => (m.cantidad ? `${m.cantidad} ${m.nombre}` : m.nombre)).join(' + ')}` : null,
  };

  // 17. Media
  const media = {
    preview: `library-v2/assets/previews/${id}.png`,
    video: `${SUPABASE_STORAGE_BASE}/${id}/ejercicio.mp4`,
  };

  // 18. Trazabilidad interna QA
  const qaInterna = {
    source_zip: record.source_zip,
    source_folder: record.source_folder,
    collection: record.collection,
    hash_data_json: record.hash_data_json,
    hash_preview: record.hash_preview,
    hash_mp4: record.hash_mp4,
  };

  return {
    ...identidad,
    categoria,
    formato_juego,
    subcategoria,
    etiquetas,
    que_se_trabaja: queSeTrabaja,
    objetivo_principal: objetivoPrincipal,
    objetivos_secundarios: objetivosSecundarios,
    datos_rapidos: datosRapidos,
    organizacion: {
      resumen_jugadores: jugadoresTexto,
      participantes_totales: numTotal,
      porteros,
      entrenadores,
      roles,
      grupos: raw.organizacion?.grupos || null,
      equipos: raw.organizacion?.equipos || null,
      oposicion: raw.organizacion?.oposicion || null,
    },
    montaje: {
      explicacion: montajeTexto,
      dimensiones: espacioDims,
      espacio_tipo: espacioTipo,
    },
    materiales,
    como_se_hace: pasos,
    fases,
    carga: {
      duracion,
      series,
      repeticiones,
      descanso,
      ciclo_repeticion: restartLogic,
    },
    rotacion: rotacionInfo,
    que_observar: queObservar,
    consignas,
    errores_correcciones: erroresCorrecciones,
    variantes,
    leyenda_visual: {
      jugadores: leyJugadores,
      materiales: leyMateriales,
      acciones: leyAcciones,
      zonas: leyZonas,
    },
    media,
    _qa: qaInterna,
  };
}

const catalog = auditRecords.map(normalizeExercise);

fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf8');
fs.writeFileSync(CATALOG_JS_FILE, 'window.CATALOG_V2 = ' + JSON.stringify(catalog) + ';\n', 'utf8');

console.log(`Catálogo canónico generado exitosamente:`);
console.log(`Total ejercicios: ${catalog.length}/248`);
console.log(`Tamaño catalog.json: ${(fs.statSync(CATALOG_FILE).size / 1024).toFixed(1)} KB`);
console.log(`Tamaño catalog-data.js: ${(fs.statSync(CATALOG_JS_FILE).size / 1024).toFixed(1)} KB`);
