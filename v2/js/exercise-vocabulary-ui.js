import { normalizeSpanishFootballText } from './exercise-content-quality.js';
import './exercise-content-audit.js?v=1';

const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

function normalizeRoot(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const next = normalizeSpanishFootballText(node.nodeValue || '');
    if (next !== node.nodeValue) node.nodeValue = next;
  }
}

function observeRoot(root) {
  if (!root || root.dataset.cbVocabularyObserved === '1') return;
  root.dataset.cbVocabularyObserved = '1';
  normalizeRoot(root);
  const observer = new MutationObserver(() => normalizeRoot(root));
  observer.observe(root, { childList: true, subtree: true });
}

function install() {
  observeRoot(document.getElementById('exercises-list'));
  observeRoot(document.getElementById('session-builder'));
  observeRoot(document.getElementById('exercise-detail-body'));
}

if (hasBrowser) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
