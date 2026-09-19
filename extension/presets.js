function validatePresets(value) {
  if (!Array.isArray(value) || value.length !== 10) return null;
  if (value.some(item => !item || typeof item.name !== 'string' || typeof item.text !== 'string')) return null;
  return value.map((item, i) => ({ name: item.name.trim().slice(0, 80) || `预设 ${i + 1}`, text: item.text.replace(/\r\n|\r/g, '\n') }));
}
function loadPresets(storage) {
  const saved = validatePresets(storage.get('presetsV2'));
  if (saved) return saved;
  const legacy = storage.get('preset', '');
  return Array.from({ length: 10 }, (_, i) => ({ name: `预设 ${i + 1}`, text: i === 0 && typeof legacy === 'string' ? legacy : '' }));
}
module.exports = { validatePresets, loadPresets };
