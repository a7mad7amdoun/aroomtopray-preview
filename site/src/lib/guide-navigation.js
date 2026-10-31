export function tabIndexForKey(key, index, count, rtl = false) {
  if (!count) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const direction = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
  return direction ? (index + direction * (rtl ? -1 : 1) + count) % count : null;
}

export function panelIndexForTarget(panels, target) {
  return target ? panels.findIndex(panel => panel === target || panel.contains(target)) : -1;
}
