import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, detectBrowser, getInstallButtonLabel } from '../js/pwa-install-manager.js';

test('detecta iPhone con Safari', () => {
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
  assert.equal(detectPlatform(ua), 'ios');
  assert.equal(detectBrowser(ua), 'safari');
});

test('detecta iPhone con Chrome', () => {
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/140.0.0.0 Mobile/15E148 Safari/604.1';
  assert.equal(detectPlatform(ua), 'ios');
  assert.equal(detectBrowser(ua), 'chrome-ios');
});

test('detecta Android con Samsung Internet', () => {
  const ua = 'Mozilla/5.0 (Linux; Android 16; SM-S938B) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36 SamsungBrowser/28.0';
  assert.equal(detectPlatform(ua), 'android');
  assert.equal(detectBrowser(ua), 'samsung');
});

test('detecta Windows con Edge', () => {
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0';
  assert.equal(detectPlatform(ua), 'windows');
  assert.equal(detectBrowser(ua), 'edge');
  assert.equal(getInstallButtonLabel('windows'), 'Instalar aplicación');
});

test('detecta Mac con Safari', () => {
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';
  assert.equal(detectPlatform(ua), 'mac');
  assert.equal(detectBrowser(ua), 'safari');
  assert.equal(getInstallButtonLabel('mac'), 'Instalar aplicación');
});
