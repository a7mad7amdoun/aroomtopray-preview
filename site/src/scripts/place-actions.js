import { readSaved, writeSaved, toggleSaved, formatPlaceNotes } from '../lib/saved-places.js';
import { copyText } from '../lib/clipboard.js';
const area = document.querySelector('[data-place-actions]');
if (area) {
  const language = document.documentElement.lang;
  const messages = {en:{saved:'Saved on this device. Open Saved places to compare or print your notes.',removed:'Removed from saved places.',unavailable:'Saved places are unavailable. You can still copy or print these details.',failed:'Could not save on this device. Check browser storage settings, or copy these details instead.',limit:'You can save up to 24 places. Remove a place before adding another.'},fr:{saved:'Enregistré sur cet appareil. Consultez les lieux enregistrés pour comparer ou imprimer vos notes.',removed:'Retiré des lieux enregistrés.',unavailable:'Enregistrement indisponible. Vous pouvez copier ou imprimer ces informations.',failed:'Impossible d’enregistrer sur cet appareil. Vérifiez les paramètres de stockage ou copiez les informations.',limit:'Vous pouvez enregistrer 24 lieux. Retirez-en un avant d’en ajouter un autre.'},ar:{saved:'تم الحفظ على هذا الجهاز. افتح الأماكن المحفوظة للمقارنة أو الطباعة.',removed:'تمت الإزالة من الأماكن المحفوظة.',unavailable:'الأماكن المحفوظة غير متاحة. يمكنك نسخ التفاصيل أو طباعتها.',failed:'تعذّر الحفظ على هذا الجهاز. راجع إعدادات تخزين المتصفح أو انسخ التفاصيل.',limit:'يمكنك حفظ 24 مكاناً. احذف مكاناً قبل إضافة آخر.'},es:{saved:'Guardado en este dispositivo. Abre los lugares guardados para comparar o imprimir las notas.',removed:'Eliminado de los lugares guardados.',unavailable:'No se puede guardar. Puedes copiar o imprimir estos detalles.',failed:'No se ha podido guardar. Revisa el almacenamiento del navegador o copia los detalles.',limit:'Puedes guardar 24 lugares. Elimina uno antes de añadir otro.'}}[language] || {saved:'Saved.',removed:'Removed.',unavailable:'Unavailable.',failed:'Could not save.',limit:'24-place limit.'};
  const button = area.querySelector('[data-save-place]');
  const status = area.querySelector('[data-place-status]');
  const notes = JSON.parse(area.querySelector('[data-place-notes]').textContent);
  const copy = area.querySelector('[data-copy-place]');
  button.hidden = false; copy.hidden = false;
  const update = () => {
    try {
      const saved = readSaved(localStorage).includes(button.dataset.savePlace);
      button.setAttribute('aria-pressed', String(saved)); button.querySelector('[data-action-label]').textContent = saved ? `✓ ${area.dataset.savedLabel}` : area.dataset.saveLabel;
    } catch { status.textContent = messages.unavailable; }
  };
  button.addEventListener('click', () => {
    try {
      const next = toggleSaved(readSaved(localStorage), button.dataset.savePlace);
      writeSaved(localStorage, next); update();
      status.textContent = next.includes(button.dataset.savePlace) ? messages.saved : messages.removed;
      window.dispatchEvent(new Event('saved-places-change'));
    } catch (error) { status.textContent = error.message.includes('24') ? messages.limit : messages.failed; }
  });
  copy.addEventListener('click', () => copyText(formatPlaceNotes(notes), status, area));
  window.addEventListener('storage', update);
  window.addEventListener('pageshow', update); update();
}
