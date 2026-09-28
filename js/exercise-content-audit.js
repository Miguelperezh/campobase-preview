import { findValidatedExercise } from './ejercicios-validados.js';
import { deriveTrainingFocus, exerciseObjective, normalizeSpanishFootballText } from './exercise-content-quality.js';

const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const clean = (value = '') => String(value ?? '').replace(/\s+/g, ' ').trim();
const norm = (value = '') => clean(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');

function flatten(value, output = []) {
  if (value === null || value === undefined) return output;
  if (typeof value === 'string' || typeof value === 'number') {
    output.push(String(value));
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => flatten(item, output));
    return output;
  }
  if (typeof value === 'object') Object.values(value).forEach((item) => flatten(item, output));
  return output;
}

function mechanicsCorpus(exercise = {}) {
  return norm(flatten({
    nombre: exercise.nombre,
    categoria: exercise.categoria,
    etiquetas: exercise.etiquetas,
    secundarios: exercise.objetivos_secundarios,
    vistaRapida: exercise.vista_rapida,
    detalle: exercise.detalle,
    montaje: exercise.montaje,
    comoSeHace: exercise.como_se_hace,
    fases: exercise.fases,
    observar: exercise.que_observar,
    errores: exercise.errores_frecuentes,
    variantes: exercise.variantes,
  }).join(' '));
}

function objectiveIsGeneric(value = '') {
  return /^(control|pase|conduccion|regate|temporizacion|finalizacion|defensa|ataque|transiciones?|posesion|conservacion de balon|amplitud(?: en ataque)?|profundidad|velocidad|agilidad|coordinacion|resistencia|fuerza|potencia|reaccion|calentamiento|activacion|tecnica|tactica|juego reducido|porteros?|entrada por banda|progresar en el campo)$/.test(norm(value));
}

function derivedObjective(exercise = {}) {
  const text = mechanicsCorpus(exercise);
  const category = norm(exercise.categoria || exercise.vista_rapida?.tipo_principal || '');
  const name = norm(exercise.nombre || exercise.name || '');
  const has = (pattern) => pattern.test(text);
  const oneVOne = has(/\b1\s*(?:v|x|contra)\s*1\b|\buno contra uno\b|\bduelo\b/);
  const defensive = has(/defens|temporiz|replieg|cobertura|bascul|marcaje|intercept|anticip|entrada|sombreado/);
  const attacking = has(/atac|regate|desbord|conduccion|conducción|superar al defensor|finaliz|remate|tiro/);
  const possession = has(/posesion|posesión|conservar|conservacion|conservación|rondo|pases/);
  const switchPlay = has(/cambio de orientacion|cambio de orientación|lado a lado|cambiar.*lado/);
  const finishing = has(/finaliz|remate|tiro|definicion|definición|golpear a porteria|golpear a portería|centro.*remate/);
  const transitions = has(/transicion|transición|tras perdida|tras pérdida|tras recuper|cambio de rol|contraataque/);
  const secondBall = has(/segunda jugada|segundas jugadas|2ª jugada|juego directo|prolongacion|prolongación/);
  const widePlay = has(/carril lateral|banda|centro lateral|centros laterales|llegar al fondo/);
  const physical = has(/fuerza|salto|potencia|velocidad|aceleracion|aceleración|sprint|resistencia|skipping|goma elastica|goma elástica/);

  if (/portero/.test(category)) {
    if (has(/salida|achique|1v1|uno contra uno/)) return 'Mejorar la colocación, la decisión y la ejecución del portero en salidas y situaciones de 1v1.';
    if (has(/blocaje|estirada|caida|caída|desvio|desvío/)) return 'Mejorar la colocación y la técnica de intervención del portero en blocajes, caídas y estiradas.';
    if (has(/juego de pies|pase|saque|distribucion|distribución/)) return 'Mejorar el juego de pies y la distribución del portero para dar continuidad a la acción.';
    return 'Mejorar la colocación, lectura y ejecución técnica del portero en la situación planteada.';
  }

  if (/transicion/.test(category)) {
    if (has(/contraataque|tras recuper|superioridad/)) return 'Reaccionar al cambio de posesión para progresar y contraatacar con rapidez, aprovechando la superioridad cuando aparezca.';
    if (finishing) return 'Reaccionar con rapidez al cambio de situación y terminar el ataque antes de que el rival pueda reorganizarse.';
    return 'Mejorar la velocidad de reacción y el cambio de rol entre ataque y defensa tras cada cambio de posesión.';
  }

  if (/finaliz/.test(category)) {
    if (/amplitud/.test(name)) return 'Utilizar la amplitud y los cambios de orientación para crear espacio y encontrar mejores opciones de finalización.';
    if (/conduccion/.test(name)) return 'Conducir a máxima velocidad hacia portería y finalizar con precisión desde la zona permitida.';
    if (/control/.test(name) && physical) return 'Integrar fuerza específica con control, conducción y acciones de finalización manteniendo máxima intensidad.';
    if (/temporizacion/.test(name) && oneVOne) return 'Mejorar la temporización defensiva en el 1v1 y la capacidad de finalizar cuando el atacante supera al defensor.';
    if (widePlay && finishing) return 'Progresar por carriles laterales y finalizar el ataque mediante desborde, centro y ocupación correcta de las zonas de remate.';
    if (secondBall) return 'Generar, disputar y aprovechar las segundas jugadas para dar continuidad al ataque y finalizar con ventaja.';
    if (oneVOne) return 'Resolver el 1v1 a alta intensidad y finalizar la acción con un remate eficaz cuando se supera al defensor.';
    return 'Mejorar la finalización del ataque eligiendo y ejecutando el remate adecuado a la situación planteada.';
  }

  if (/pase|posesion/.test(category)) {
    if (switchPlay) return 'Conservar el balón y cambiar la orientación del juego mediante apoyos, circulación rápida y amplitud.';
    if (possession) return 'Conservar el balón bajo oposición mediante pase, control, apoyos y creación continua de líneas de pase.';
    return 'Dar continuidad al juego mediante pase, recepción y control orientado con precisión y buen ritmo.';
  }

  if (/defens|duelo/.test(category)) {
    if (widePlay && has(/centro/)) return 'Defender los centros laterales coordinando orientación corporal, marcaje, anticipación y ayudas defensivas.';
    if (oneVOne) return 'Mejorar la defensa del 1v1 mediante temporización, orientación corporal y control de la distancia.';
    if (has(/presion|presión|robo|recuperacion|recuperación/)) return 'Coordinar la presión, el marcaje y las ayudas defensivas para recuperar el balón y proteger las zonas de mayor peligro.';
    return 'Mejorar los comportamientos defensivos mediante colocación, marcaje, anticipación y coordinación con los compañeros.';
  }

  if (/coord|agil/.test(category)) {
    if (has(/reaccion|reacción|reactiv|estimulo|estímulo|señal|color|numero|número/)) return 'Mejorar la coordinación, la agilidad y la velocidad de reacción ante los estímulos de la tarea.';
    return 'Mejorar la coordinación, la agilidad y el control corporal en desplazamientos y cambios de dirección.';
  }

  if (/calent|activ/.test(category)) return 'Activar al jugador mediante movilidad, coordinación y acciones progresivas específicas de fútbol.';
  if (/fisic/.test(category)) return 'Mejorar la capacidad física específica integrándola con acciones técnicas propias del fútbol.';

  if (/juego reducido/.test(category)) {
    if (possession && finishing) return 'Conservar y progresar bajo oposición para identificar el momento adecuado de finalizar el ataque.';
    if (finishing) return 'Finalizar con decisión las situaciones favorables dentro de un juego reducido con oposición real.';
    if (possession) return 'Conservar el balón y ofrecer apoyos constantes dentro de un juego reducido con oposición real.';
    return 'Aplicar con intensidad los principios técnicos y tácticos de la tarea en una situación reducida con oposición.';
  }

  if (/tecnico-tact|técnico-táct/.test(category)) {
    if (/^control$/.test(name)) return 'Mejorar el control orientado para iniciar el 1v1 con ventaja y enlazar con regate, pase o finalización.';
    if (/progresar en el campo/.test(name)) return 'Progresar con balón superando oposición mediante conducción, regate y cambios de ritmo, reaccionando también tras la pérdida.';
    if (/temporizacion/.test(name)) return 'Mejorar la temporización defensiva y la resolución del 1v1, alternando con rapidez los roles de ataque y defensa.';
    if (/conservacion de balon/.test(name)) return 'Proteger y conservar el balón en duelos reducidos, mejorando conducción, regate y respuesta tras el cambio de rol.';
    if (/^conduccion$/.test(name)) return 'Mejorar la conducción con ambas piernas, especialmente con la menos hábil, manteniendo control y visión durante el recorrido.';
    if (/^pase$/.test(name) && physical && finishing) return 'Integrar pase, control, conducción, velocidad y finalización manteniendo calidad técnica durante todo el circuito.';
    if (physical && finishing && has(/pase|control|conduccion|conducción/)) return 'Integrar pase, control, conducción, velocidad y finalización manteniendo calidad técnica durante todo el circuito.';
    if (oneVOne && defensive && attacking) return 'Resolver el 1v1 mejorando el primer control y la acción ofensiva o defensiva según el rol.';
    if (finishing) return 'Dar continuidad a la acción técnica y finalizar con eficacia según la oposición y el espacio disponible.';
    if (possession || has(/pase|control|recepcion|recepción/)) return 'Mejorar pase, control y toma de decisiones para dar continuidad y progresión al juego.';
  }

  if (/tactic/.test(category)) {
    if (/progresar en el campo/.test(name)) return 'Mejorar la progresión colectiva mediante buena ocupación de espacios, apoyos y elección del momento de avanzar.';
    if (widePlay && defensive && has(/centro/)) return 'Defender los centros laterales coordinando orientación corporal, marcaje, anticipación y comunicación.';
    if (transitions) return 'Mejorar la organización colectiva y la reacción del equipo ante los cambios de posesión.';
    if (possession && switchPlay) return 'Conservar y cambiar la orientación del juego para encontrar espacios libres y progresar.';
    if (has(/amplitud|profundidad|ocupacion de espacios|ocupación de espacios|progresion|progresión/)) return 'Mejorar la ocupación de espacios para progresar con amplitud, profundidad y apoyos adecuados.';
    if (defensive) return 'Mejorar la organización defensiva mediante colocación, marcaje, coberturas y coordinación colectiva.';
    return 'Mejorar la comprensión táctica y la ocupación racional del espacio en la situación propuesta.';
  }

  if (transitions) return 'Mejorar la reacción al cambio de posesión y el cambio rápido de rol entre ataque y defensa.';
  if (oneVOne && defensive && attacking) return 'Resolver el 1v1 mejorando el primer control y la acción ofensiva o defensiva según el rol.';
  if (oneVOne && defensive) return 'Mejorar la defensa del 1v1 mediante temporización, orientación corporal y control de la distancia.';
  if (oneVOne && attacking) return 'Superar al defensor en 1v1 mediante un buen primer control, conducción o regate y cambio de ritmo.';
  if (possession && switchPlay) return 'Conservar el balón y cambiar la orientación del juego mediante apoyos, circulación rápida y amplitud.';
  if (possession) return 'Conservar el balón bajo oposición creando líneas de pase y tomando decisiones rápidas en apoyo.';
  if (finishing) return 'Mejorar la finalización eligiendo y ejecutando el remate adecuado a la situación planteada.';
  if (has(/pase|recepcion|recepción|control orientado|primer toque/)) return 'Dar continuidad al juego mediante pase, recepción y control orientado con precisión y buen ritmo.';
  if (has(/regate|conduccion|conducción|slalom/)) return 'Mejorar la conducción y el regate adaptando el control del balón a los cambios de dirección y velocidad.';
  if (physical) return 'Mejorar la capacidad física específica integrándola con acciones técnicas propias del fútbol.';
  return 'Mejorar la ejecución y la toma de decisiones en la situación de juego propuesta.';
}

function pushUnique(items, value) {
  const key = norm(value);
  if (!key || items.some((item) => norm(item) === key)) return;
  items.push(value);
}

function auditedFocus(exercise = {}, objective = '') {
  const base = deriveTrainingFocus(exercise);
  const text = mechanicsCorpus(exercise);
  const category = norm(exercise.categoria || exercise.vista_rapida?.tipo_principal || '');
  const name = norm(exercise.nombre || exercise.name || '');
  const items = [];
  const has = (pattern) => pattern.test(text);

  if (/pase|posesion/.test(category)) {
    if (/amplitud/.test(name)) pushUnique(items, 'Ocupación de espacios, amplitud y progresión.');
    if (has(/pase|recepcion|recepción|control orientado|primer toque/)) pushUnique(items, 'Pase, recepción y control orientado.');
    if (has(/posesion|posesión|conservar|conservacion|conservación|apoyo|lineas de pase|líneas de pase/)) pushUnique(items, 'Conservación, apoyos y líneas de pase.');
  } else if (/finaliz/.test(category)) {
    if (/control/.test(name)) pushUnique(items, 'Control orientado y preparación de la siguiente acción.');
    if (/conduccion/.test(name)) pushUnique(items, 'Conducción, regate y dominio del balón.');
    if (/amplitud/.test(name)) pushUnique(items, 'Ocupación de espacios, amplitud y progresión.');
    if (/temporizacion/.test(name)) pushUnique(items, 'Desplazamientos defensivos, temporización y control de distancia.');
    pushUnique(items, 'Finalización y ejecución del remate.');
  } else if (/transicion/.test(category)) {
    pushUnique(items, 'Transición y cambio rápido de rol.');
  } else if (/defens|duelo/.test(category)) {
    if (has(/1\s*(?:v|x|contra)\s*1|uno contra uno|duelo/)) pushUnique(items, 'Desplazamientos defensivos, temporización y control de distancia.');
    else pushUnique(items, 'Marcaje, anticipación, cobertura y ayudas defensivas.');
  } else if (/coord|agil/.test(category)) {
    pushUnique(items, 'Coordinación, agilidad y calidad de apoyos.');
  } else if (/portero/.test(category)) {
    if (has(/blocaje|estirada|caida|caída|desvio|desvío/)) pushUnique(items, 'Técnica de blocaje, caída y estirada del portero.');
    else if (has(/salida|achique|uno contra uno|1v1/)) pushUnique(items, 'Colocación, salida y achique del portero.');
    else if (has(/juego de pies|pase|saque|distribucion|distribución/)) pushUnique(items, 'Juego de pies y distribución del portero.');
    else pushUnique(items, 'Colocación e intervención específica del portero.');
  } else if (/fisic/.test(category)) {
    pushUnique(items, 'Capacidad física integrada en acciones específicas de fútbol.');
  } else if (/calent|activ/.test(category)) {
    pushUnique(items, 'Movilidad, activación y preparación motriz.');
  } else if (/tecnico-tact|técnico-táct/.test(category)) {
    if (/^control$/.test(name)) pushUnique(items, 'Control orientado y preparación de la siguiente acción.');
    else if (/progresar en el campo/.test(name)) pushUnique(items, 'Conducción, regate y dominio del balón.');
    else if (/temporizacion/.test(name)) pushUnique(items, 'Desplazamientos defensivos, temporización y control de distancia.');
    else if (/conservacion de balon/.test(name)) pushUnique(items, 'Protección y conservación del balón bajo oposición.');
    else if (/^conduccion$/.test(name)) pushUnique(items, 'Conducción, regate y dominio del balón.');
    else if (/^pase$/.test(name)) pushUnique(items, 'Pase, recepción y control orientado.');
  } else if (/tactic/.test(category) && /progresar en el campo/.test(name)) {
    pushUnique(items, 'Ocupación de espacios, amplitud y progresión.');
  }

  base.forEach((item) => pushUnique(items, item));
  const objectiveKey = norm(objective);
  const distinct = items.filter((item) => norm(item) !== objectiveKey);
  return (distinct.length ? distinct : items).slice(0, 4).map(normalizeSpanishFootballText);
}

function auditedObjective(exercise = {}) {
  const original = exerciseObjective(exercise);
  if (!objectiveIsGeneric(original)) return normalizeSpanishFootballText(original);
  return normalizeSpanishFootballText(derivedObjective(exercise));
}

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);

function applyAuditToRoot(root, exerciseId = '') {
  if (!root) return;
  const id = exerciseId || root.dataset?.id || root.getAttribute?.('data-id') || '';
  if (!id) return;
  const exercise = findValidatedExercise(id);
  if (!exercise) return;

  const objective = auditedObjective(exercise);
  const focus = auditedFocus(exercise, objective);
  const objectiveBox = root.querySelector('#section-objetivo .main-objective-box');
  if (objectiveBox && objective && objectiveBox.textContent !== objective) objectiveBox.textContent = objective;

  const section = root.querySelector('#section-que-se-trabaja');
  if (section) {
    let container = section.querySelector('.pills-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'pills-container';
      section.appendChild(container);
    }
    const markup = focus.map((item) => `<span class="pill-tag">${escapeHtml(item)}</span>`).join(' ');
    if (container.innerHTML !== markup) container.innerHTML = markup;
  }
  root.dataset.exerciseContentAuditId = id;
}

function applyAudit(exerciseId) {
  const body = document.getElementById('exercise-detail-body');
  if (!body || !exerciseId) return;
  const root = body.querySelector(`.ejercicio-validado[data-id="${CSS.escape(exerciseId)}"]`) || body.querySelector('.ejercicio-validado[data-id]') || body;
  applyAuditToRoot(root, exerciseId);
}

function auditRenderedExercises() {
  document.querySelectorAll('.ejercicio-validado[data-id]').forEach((root) => applyAuditToRoot(root));
}

function installBoardMaterialControls(frame) {
  if (!frame || frame.dataset.materialOrientationPatched === '1') return;
  frame.dataset.materialOrientationPatched = '1';

  const patch = () => {
    let doc;
    try { doc = frame.contentDocument; } catch { return; }
    if (!doc?.body || doc.getElementById('campobase-material-orientation-runtime')) return;
    if (!doc.getElementById('rotationControl') && !doc.getElementById('rotRange')) return;

    const runtime = doc.createElement('script');
    runtime.id = 'campobase-material-orientation-runtime';
    runtime.textContent = `
      (() => {
        if (window.__campobaseMaterialOrientationInstalled) return;
        if (typeof selectedItem !== 'function' || typeof pushHistory !== 'function' || typeof render !== 'function' || typeof itemGraphic !== 'function') return;
        window.__campobaseMaterialOrientationInstalled = true;
        const MATERIALS = new Set(['goalLarge','goalSmall','cone','marker','pole','hurdle','ladder','ring','mannequin']);
        const GOALS = new Set(['goalLarge','goalSmall']);
        const anchor = document.getElementById('rotationControl') || document.getElementById('rotRange')?.closest('.field-row');
        const inspector = document.getElementById('inspectorBody');
        if (!anchor || !inspector) return;

        const style = document.createElement('style');
        style.id = 'campobase-material-orientation-style';
        style.textContent = '.cb-material-orientation{display:grid;gap:7px;margin-top:8px}.cb-material-orientation>label{font-size:10px;color:var(--muted);font-weight:900;text-transform:uppercase;letter-spacing:.07em}.cb-material-orientation-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}.cb-material-orientation-actions button{min-height:38px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);font-weight:850;font-size:11px;padding:6px 8px}.cb-material-orientation-actions button.active{border-color:#d2ad00;background:#fff7c7;box-shadow:0 0 0 2px rgba(210,173,0,.15)}.cb-material-orientation-actions button.goal-net{grid-column:1/-1}.cb-material-orientation.hidden{display:none!important}';
        document.head.append(style);

        const controls = document.createElement('div');
        controls.id = 'campobaseMaterialOrientationControls';
        controls.className = 'cb-material-orientation hidden';
        controls.innerHTML = '<label>Colocación del material</label><div class="cb-material-orientation-actions"><button type="button" id="rotateLeft90" title="Girar 90 grados a la izquierda">↺ 90°</button><button type="button" id="rotateRight90" title="Girar 90 grados a la derecha">↻ 90°</button><button type="button" id="flipVerticalSelected" title="Reflejar el material de arriba abajo">↕ Reflejo vertical</button><button type="button" id="invertGoalNet" class="goal-net hidden" title="Cambiar el lado hacia el que sale el fondo de la red">Invertir fondo de red</button></div>';
        anchor.insertAdjacentElement('afterend', controls);

        const left = document.getElementById('rotateLeft90');
        const right = document.getElementById('rotateRight90');
        const flipY = document.getElementById('flipVerticalSelected');
        const net = document.getElementById('invertGoalNet');
        const normaliseAngle = (value) => ((Number(value || 0) % 360) + 360) % 360;
        const mutate = (callback) => {
          const it = selectedItem();
          if (!it || !MATERIALS.has(it.type)) return;
          pushHistory();
          callback(it);
          render();
        };

        left.addEventListener('click', () => mutate((it) => { it.rot = normaliseAngle((it.rot || 0) - 90); }));
        right.addEventListener('click', () => mutate((it) => { it.rot = normaliseAngle((it.rot || 0) + 90); }));
        flipY.addEventListener('click', () => mutate((it) => { it.flipY = !it.flipY; }));
        net.addEventListener('click', () => mutate((it) => { if (GOALS.has(it.type)) it.netDepth = it.netDepth === -1 ? 1 : -1; }));

        const baseItemTransform = typeof itemTransform === 'function' ? itemTransform : null;
        if (baseItemTransform) {
          itemTransform = function(a, x, y, rot, scale, mirror) {
            const transformed = baseItemTransform(a, x, y, rot, scale, mirror);
            return a?.flipY ? transformed + ' scale(1 -1)' : transformed;
          };
        }

        const baseItemGraphic = itemGraphic;
        itemGraphic = function(it) {
          const graphic = baseItemGraphic(it);
          if (!baseItemTransform && it?.flipY) {
            graphic.setAttribute('transform', (graphic.getAttribute('transform') || '') + ' scale(1 -1)');
          }
          if (GOALS.has(it?.type) && it.netDepth === -1) {
            const children = [...graphic.children];
            const netGroup = children.at(-1);
            const depthPath = children.at(-2);
            if (depthPath?.tagName?.toLowerCase() === 'path') depthPath.setAttribute('transform', 'scale(-1 1)');
            if (netGroup?.tagName?.toLowerCase() === 'g') netGroup.setAttribute('transform', 'scale(-1 1)');
          }
          return graphic;
        };

        const baseUpdateInspector = typeof updateInspector === 'function' ? updateInspector : null;
        if (baseUpdateInspector) {
          updateInspector = function() {
            baseUpdateInspector();
            const it = selectedItem();
            const materialSelected = Boolean(it && MATERIALS.has(it.type));
            controls.classList.toggle('hidden', !materialSelected);
            net.classList.toggle('hidden', !(it && GOALS.has(it.type)));
            flipY.classList.toggle('active', Boolean(it?.flipY));
            net.classList.toggle('active', it?.netDepth === -1);
          };
        }
        render();
      })();
    `;
    doc.body.append(runtime);
  };

  frame.addEventListener('load', () => setTimeout(patch, 0));
  setTimeout(patch, 0);
}

function discoverBoardFrames() {
  document.querySelectorAll('iframe[title="Creador de ejercicios CampoBase"]').forEach(installBoardMaterialControls);
}

function install() {
  let currentExerciseId = '';
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      if (currentExerciseId) applyAudit(currentExerciseId);
      auditRenderedExercises();
      discoverBoardFrames();
    }, 0);
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-exercise-id]');
    if (trigger?.dataset.exerciseId) currentExerciseId = trigger.dataset.exerciseId;
    schedule();
  }, true);

  schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
}

if (hasBrowser) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
