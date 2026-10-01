import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { optimizeCrestImage } from "../js/image-crop-utils.js";

test("optimizeCrestImage está exportada y maneja cadenas de datos o entorno headless", async () => {
  assert.equal(typeof optimizeCrestImage, "function");
  const dummyDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const res = await optimizeCrestImage(dummyDataUrl);
  assert.equal(res, dummyDataUrl);
});

test("index.html contiene los controles completos de Identidad del club", () => {
  const html = fs.readFileSync("index.html", "utf8");

  assert.match(html, /id="preview-crest-thumb"/, "Debe existir la previsualización del escudo");
  assert.match(html, /id="crest-file-input"/, "Debe existir el input file de escudo");
  assert.match(html, /id="club-crest-value"/, "Debe existir el campo hidden club-crest-value");
  assert.match(html, /id="upload-crest-btn"/, "Debe existir el botón Subir escudo");
  assert.match(html, /id="save-crest-btn"/, "Debe existir el botón explícito Guardar escudo");
  assert.match(html, /id="reset-crest-btn"/, "Debe existir el botón Restaurar escudo por defecto");
});

test("js/app.js conecta la subida con optimización automática, guardado explícito y reseteo persistente", () => {
  const app = fs.readFileSync("js/app.js", "utf8");

  assert.match(app, /import\s*\{[^}]*optimizeCrestImage[^}]*\}\s*from\s*\x27\.\/image-crop-utils\.js\x27/, "Debe importar optimizeCrestImage");
  assert.match(app, /saveCrestBtn/, "Debe gestionar saveCrestBtn");
  assert.match(app, /optimizeCrestImage\(file\)/, "Debe optimizar automáticamente la imagen seleccionada");
  assert.match(app, /Escudo actualizado y guardado con éxito/, "Debe notificar con éxito al subir el escudo");
  assert.match(app, /Escudo guardado con éxito/, "Debe notificar con éxito al pulsar Guardar escudo");
  assert.match(app, /Escudo restaurado por defecto/, "Debe notificar al restaurar escudo");
  assert.match(app, /applyTeamIdentity\(state\.settings\)/, "Debe refrescar la identidad tras guardar");
});
