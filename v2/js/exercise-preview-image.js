// Creator covers are saved as SVG markup; image/PDF consumers need an image URL.
export function exercisePreviewImage(value = '') {
  const source=String(value||'').trim();
  if(/^<svg\b/i.test(source)) {
    const svg=/\bxmlns\s*=/.test(source)?source:source.replace(/<svg\b/i,'<svg xmlns="http://www.w3.org/2000/svg"');
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  return source.startsWith('<')?'':source;
}
export function sessionExerciseReference(block) {
  return block?.exerciseId || block?.exercise?.id || block?.exercise || block?.exerciseSnapshot || '';
}
