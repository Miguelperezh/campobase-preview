#!/usr/bin/env node
const OWNER = 'Miguelperezh';
const REPO = 'campobase';
const TAG = process.env.CAMPOBASE_VIDEO_RELEASE_TAG || 'campobase-videos-v1';
const SUPABASE_BASE = 'https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('Falta GH_TOKEN/GITHUB_TOKEN. No guardes tokens en Git.');
  process.exit(2);
}

const fs = await import('node:fs/promises');
const manifest = JSON.parse(await fs.readFile(new URL('./github-release-video-manifest.json', import.meta.url), 'utf8'));

const onlyArg = process.argv.find(v => v.startsWith('--only='));
const limitArg = process.argv.find(v => v.startsWith('--limit='));
const only = onlyArg ? onlyArg.slice('--only='.length) : null;
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) : null;
const dryRun = process.argv.includes('--dry-run');

let items = only ? manifest.filter(x => x.name === only) : manifest;
if (only && items.length !== 1) throw new Error('No existe en el manifiesto: ' + only);
if (Number.isFinite(limit) && limit > 0) items = items.slice(0, limit);

function sourceUrl(path) {
  return SUPABASE_BASE + '/' + path.split('/').map(encodeURIComponent).join('/');
}
function assetName(path) {
  return path.replaceAll('/', '__');
}
function publicUrl(asset) {
  return `https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/${encodeURIComponent(asset)}`;
}
async function gh(path, options = {}) {
  const res = await fetch('https://api.github.com' + path, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': '2026-03-10',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`GitHub ${options.method || 'GET'} ${path}: HTTP ${res.status} ${body.slice(0, 500)}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}
async function getOrCreateRelease() {
  try {
    return await gh(`/repos/${OWNER}/${REPO}/releases/tags/${TAG}`);
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  return gh(`/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: TAG,
      target_commitish: process.env.GITHUB_SHA || 'main',
      name: 'CampoBase video assets v1',
      body: 'Almacenamiento de vídeo de CampoBase. Gestionado automáticamente; no borrar assets manualmente.',
      draft: false,
      prerelease: true,
      make_latest: 'false',
    }),
  });
}
async function listAllAssets(releaseId) {
  const out = [];
  for (let page = 1; ; page++) {
    const batch = await gh(`/repos/${OWNER}/${REPO}/releases/${releaseId}/assets?per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}
async function downloadSource(item) {
  const res = await fetch(sourceUrl(item.name));
  if (!res.ok) throw new Error(`Supabase GET ${item.name}: HTTP ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length !== Number(item.size)) {
    throw new Error(`Tamaño origen distinto ${item.name}: esperado ${item.size}, recibido ${body.length}`);
  }
  return body;
}
async function uploadAsset(releaseId, asset, body) {
  const url = `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(asset)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': '2026-03-10',
      'Content-Type': 'video/mp4',
      'Content-Length': String(body.length),
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload ${asset}: HTTP ${res.status} ${text.slice(0, 500)}`);
  }
  return res.json();
}
async function verifyRange(asset, expectedSize) {
  const url = publicUrl(asset);
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 12; attempt++) {
    const res = await fetch(url, { headers: { Range: 'bytes=0-0' }, redirect: 'follow' });
    lastStatus = res.status;
    if (res.status === 206) {
      const range = res.headers.get('content-range') || '';
      if (!range.endsWith('/' + expectedSize)) {
        throw new Error(`Content-Range incorrecto ${asset}: ${range}`);
      }
      const one = Buffer.from(await res.arrayBuffer());
      if (one.length !== 1) throw new Error(`Range devolvió ${one.length} bytes en ${asset}`);
      return;
    }
    // Un asset recién subido puede tardar unos segundos en propagarse al CDN público.
    if (res.status !== 404 && res.status !== 403 && res.status !== 502 && res.status !== 503) {
      throw new Error(`Range no válido ${asset}: HTTP ${res.status}`);
    }
    await new Promise(resolve => setTimeout(resolve, Math.min(1000 * attempt, 5000)));
  }
  throw new Error(`El asset no se propagó a tiempo ${asset}: último HTTP ${lastStatus}`);
}

console.log(`Destino: GitHub Release ${TAG}`);
console.log(`Objetos solicitados: ${items.length}${dryRun ? ' [DRY RUN]' : ''}`);
if (dryRun) {
  for (const item of items) console.log(item.name, '=>', assetName(item.name), item.size);
  process.exit(0);
}

const release = await getOrCreateRelease();
const assets = await listAllAssets(release.id);
const byName = new Map(assets.map(a => [a.name, a]));

let uploaded = 0, skipped = 0, replaced = 0;
for (const [index, item] of items.entries()) {
  const asset = assetName(item.name);
  const existing = byName.get(asset);
  process.stdout.write(`[${index + 1}/${items.length}] ${item.name} -> ${asset} ... `);

  if (existing && Number(existing.size) === Number(item.size)) {
    await verifyRange(asset, Number(item.size));
    skipped++;
    console.log('OK existente');
    continue;
  }

  if (existing) {
    await gh(`/repos/${OWNER}/${REPO}/releases/assets/${existing.id}`, { method: 'DELETE' });
    replaced++;
  }

  const body = await downloadSource(item);
  const created = await uploadAsset(release.id, asset, body);
  if (Number(created.size) !== Number(item.size)) {
    throw new Error(`GitHub informó tamaño incorrecto para ${asset}: ${created.size}`);
  }
  await verifyRange(asset, Number(item.size));
  byName.set(asset, created);
  uploaded++;
  console.log('OK subido');
}

const finalAssets = await listAllAssets(release.id);
const expected = new Set(manifest.map(x => assetName(x.name)));
const presentExpected = finalAssets.filter(a => expected.has(a.name));
const totalBytes = presentExpected.reduce((sum, a) => sum + Number(a.size || 0), 0);

console.log(JSON.stringify({
  tag: TAG,
  expectedFiles: manifest.length,
  presentExpectedFiles: presentExpected.length,
  expectedBytes: manifest.reduce((s,x)=>s+Number(x.size),0),
  presentExpectedBytes: totalBytes,
  uploaded,
  skipped,
  replaced
}, null, 2));

if (presentExpected.length !== manifest.length) process.exit(3);
if (totalBytes !== manifest.reduce((s,x)=>s+Number(x.size),0)) process.exit(4);
