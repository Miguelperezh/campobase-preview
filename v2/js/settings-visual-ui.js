// Presentation only: keep the existing pickers, listeners and stored keys.
const lifetimes = new WeakMap();
export function enhanceColorSettings(root, elements = []) {
  lifetimes.get(root)?.abort();
  const lifetime = new AbortController();
  lifetimes.set(root,lifetime);
  const signal = lifetime.signal;
  const controls = root.querySelector('.cbx-adjustments-controls');
  if (!controls) return;
  const general = controls.querySelector('.cbx-general-color-controls');
  const concrete = controls.querySelector('.cbx-named-colors');
  const toolbar = document.createElement('div');
  toolbar.className = 'cbx-settings-sections';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Qué quieres personalizar');
  for (const [label, section] of [['🎨 Colores de la sección', general], ['🔎 Un elemento concreto', concrete]]) {
    if (!section) continue;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'secondary'; button.textContent = label;
    button.setAttribute('aria-pressed', String(section === general));
    button.onclick = () => {
      general.hidden = section !== general; concrete.hidden = section !== concrete;
      [...toolbar.children].forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    };
    toolbar.append(button);
  }
  controls.prepend(toolbar);
  if (concrete) concrete.hidden = true;
  general?.querySelectorAll(':scope > .cbx-color-control-row').forEach(row => {
    const prop = row.querySelector('[data-prop]')?.dataset.prop || '';
    const title = row.querySelector('span')?.textContent || '';
    const symbol = /Ink|Color|Title/.test(prop) && !/Bg|Border|Bar|Track|Cursor|Selection/.test(prop) ? 'Aa' : /Border|Selection/.test(prop) ? '▢' : '▰';
    row.dataset.visualSymbol = symbol;
    row.setAttribute('aria-label', title);
  });
  // Pair background/foreground controls so each sample shows the chosen combination.
  root.querySelectorAll('.cbx-color-control-row').forEach(row => {
    const picker = row.querySelector('input[type=color]');
    if (!picker) return;
    const label = row.querySelector('span')?.textContent || picker.getAttribute('aria-label') || row.querySelector('label')?.textContent || 'Ejemplo';
    const target = elements[Number(picker.dataset.element)]?.selector;
    const source = target && document.querySelector(target);
    const sample = document.createElement('div');
    if (source) sample.style.fontFamily = getComputedStyle(source).fontFamily;
    sample.className = 'cbx-setting-live-sample';
    sample.textContent = /fuente|texto|nombre/i.test(label) ? 'Así se leerá este texto · Aa 123' : /barra|minutos/i.test(label) ? '▰ 35 minutos' : /bot[oó]n|cerrar|editar/i.test(label) ? 'Ejemplo de botón' : 'Ejemplo de ' + label.toLocaleLowerCase('es');
    const prop = picker.dataset.prop || picker.dataset.elementProp;
    const isInk = /Ink|fontColor|textColor|cardTitle|planTextColor|^color$/.test(prop);
    const paired = picker.dataset.prop ? prop.replace(/Ink$/, 'Bg').replace(/Bg$/, 'Ink') : null;
    const update = () => {
      const counterpart = paired && paired !== prop ? root.querySelector(`input[data-prop="${paired}"]`) : null;
      sample.style.backgroundColor = isInk ? counterpart?.value || '#f1f5f9' : picker.value;
      sample.style.color = isInk ? picker.value : counterpart?.value || '#17202a';
      if (/border|Border|stroke/.test(prop)) { sample.style.backgroundColor = '#f8fafc'; sample.style.borderColor = picker.value; }
      sample.title = label + ': ' + picker.value;
    };
    row.append(sample); update();
    root.addEventListener('input', update, {signal});
    root.addEventListener('click', event => { if (event.target.closest('.cbx-swatch-btn')) queueMicrotask(update); }, {signal});
  });
  root.querySelectorAll('.cbx-colour-group').forEach(group => {
    group.addEventListener('toggle', () => {
      if (group.open) root.querySelectorAll('.cbx-colour-group').forEach(other => { if (other !== group) other.open = false; });
    });
  });
}
