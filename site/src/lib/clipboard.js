export async function copyText(text, status, fallbackParent) {
  const copy = { en: ['Copied.', 'Automatic copying is unavailable. Select and copy the text below.', 'Text to copy manually'], fr: ['Copié.', 'Copie automatique indisponible. Sélectionnez et copiez le texte ci-dessous.', 'Texte à copier manuellement'], ar: ['تم النسخ.', 'النسخ التلقائي غير متاح. حدّد النص أدناه وانسخه.', 'نص للنسخ يدوياً'], es: ['Copiado.', 'La copia automática no está disponible. Selecciona y copia el texto de abajo.', 'Texto para copiar manualmente'] }[document.documentElement.lang] || ['Copied.', 'Select and copy the text below.', 'Text to copy'];
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = copy[0];
    fallbackParent?.querySelector('[data-copy-fallback]')?.remove();
  } catch {
    status.textContent = copy[1];
    if (!fallbackParent) return;
    let area = fallbackParent.querySelector('[data-copy-fallback]');
    if (!area) {
      area = document.createElement('textarea'); area.dataset.copyFallback = '';
      area.className = 'copy-fallback'; area.readOnly = true;
      area.setAttribute('aria-label', copy[2]); fallbackParent.append(area);
    }
    area.value = text; area.focus(); area.select();
  }
}
