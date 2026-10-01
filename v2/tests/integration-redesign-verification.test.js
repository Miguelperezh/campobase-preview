import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { MODULE_CONFIG } from '../js/redesign-nav.js';
import { STAFF_ROLES, getRoleMeta, saveStaffMember, getStaffMembers, deleteStaffMember } from '../js/staff-management.js';
import { createDemoSession } from '../js/demo-session.js';
import { configureDemoDatabase, configureRealDatabase, isDemoDatabase } from '../js/db.js';
import { hashPin, verifyPin } from '../js/domain.js';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1, 2, 3: Autenticación de PINs (Migue, Delegado, Demo) funciona con hashes criptográficos reales', async () => {
  const salt = crypto.randomUUID();
  const ownerPin = '8392';
  const delegatePin = '4019';
  const ownerHash = await hashPin(ownerPin, salt);
  const delegateHash = await hashPin(delegatePin, salt);

  assert.equal(await verifyPin('8392', salt, ownerHash), true, 'PIN de Migue debe verificar');
  assert.equal(await verifyPin('4019', salt, delegateHash), true, 'PIN de Delegado debe verificar');
  assert.equal(await verifyPin('0000', salt, ownerHash), false, 'PIN erróneo debe ser rechazado');
  assert.equal(await verifyPin('1234', salt, ownerHash), false, 'PIN de prueba debe ser rechazado');
});

test('6: Submenús y navegación mapean exclusivamente a vistas reales en index.html', async () => {
  const html = await projectFile('index.html');
  const allViewsInConfig = [];

  for (const [modKey, mod] of Object.entries(MODULE_CONFIG)) {
    for (const viewId of mod.views) {
      allViewsInConfig.push(viewId);
      assert.match(
        html,
        new RegExp(`<section id="${viewId}"`),
        `La subvistas '${viewId}' del módulo '${modKey}' debe existir físicamente en index.html`
      );
    }
    for (const tab of mod.subTabs) {
      assert.ok(mod.views.includes(tab.id), `La subpestaña '${tab.id}' debe estar en la lista de vistas de '${modKey}'`);
    }
  }

  assert.ok(allViewsInConfig.includes('hoy'));
  assert.ok(allViewsInConfig.includes('plantilla'));
  assert.ok(allViewsInConfig.includes('cuerpo-tecnico'));
  assert.ok(allViewsInConfig.includes('asistencia'));
  assert.ok(allViewsInConfig.includes('convocatorias'));
  assert.ok(allViewsInConfig.includes('preparacion'));
  assert.ok(allViewsInConfig.includes('partido'));
  assert.ok(allViewsInConfig.includes('calendario'));
  assert.ok(allViewsInConfig.includes('sesiones'));
  assert.ok(allViewsInConfig.includes('ejercicios'));
  assert.ok(allViewsInConfig.includes('tacticas'));
  assert.ok(allViewsInConfig.includes('ajustes'));
});

test('7 y 8: Cuerpo Técnico persiste perfiles con fotos, teléfonos y WhatsApp en base aislada', async () => {
  const session = createDemoSession('test-verify-staff');
  configureDemoDatabase(session);

  const photoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const member1 = await saveStaffMember({
    name: 'Carlos Morales',
    role: 'head_coach',
    phone: '+34 612 345 678',
    notes: 'UEFA Pro Licencia A',
    photo: photoBase64,
  });

  assert.equal(member1.name, 'Carlos Morales');
  assert.equal(member1.roleTitle, 'Primer Entrenador');
  assert.equal(member1.photo, photoBase64);

  const member2 = await saveStaffMember({
    name: 'Elena Díaz',
    role: 'other',
    customRole: 'Readaptadora y Fisioterapeuta',
    phone: '600112233',
    notes: 'Colegiada 4821',
  });

  assert.equal(member2.name, 'Elena Díaz');
  assert.equal(member2.roleTitle, 'Readaptadora y Fisioterapeuta');
  assert.equal(member2.badgeText, 'Readaptadora y Fisioterapeuta');

  const list = await getStaffMembers();
  assert.equal(list.length, 2);

  await deleteStaffMember(member1.id);
  const updated = await getStaffMembers();
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, member2.id);

  configureRealDatabase();
});

test('9: Creador de ejercicios (+Ejercicios) descomprime íntegro sin truncamiento', async () => {
  const binaryGz = await readFile(new URL('../assets/exercise-board.html.gz', import.meta.url));
  assert.ok(binaryGz.length > 20000, `El archivo comprimido debe superar los 20 KB (actual: ${binaryGz.length})`);

  const decompressed = gunzipSync(binaryGz).toString('utf-8');
  assert.ok(decompressed.length > 100000, `El archivo HTML descomprimido debe superar los 100 KB (actual: ${decompressed.length})`);
  assert.match(decompressed, /<!doctype html>/i);
  assert.match(decompressed, /pizarra táctica|tactical board|crear ejercicio/i);
});

test('5: Cache PWA (sw.js) incluye estilos y scripts del rediseño para offline', async () => {
  const sw = await projectFile('sw.js');
  assert.match(sw, /styles-redesign\.css/);
  assert.match(sw, /staff-management\.js/);
  assert.match(sw, /redesign-nav\.js/);
});

test('Auditoría de seguridad: CERO residuos de laboratorio (demo-salt, bypasses)', async () => {
  const [app, nav, index] = await Promise.all([
    projectFile('js/app.js'),
    projectFile('js/redesign-nav.js'),
    projectFile('index.html'),
  ]);

  assert.doesNotMatch(app, /demo-salt-redesign-2026/);
  assert.doesNotMatch(nav, /demo-salt/);
  assert.doesNotMatch(nav, /seedDemoDataIsolated/);
  assert.doesNotMatch(index, /seedDemoDataIsolated/);
  assert.doesNotMatch(index, /demo-salt/);
});
