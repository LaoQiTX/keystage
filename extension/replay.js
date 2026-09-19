function chunk(text) {
  let end = 0;
  while (end < text.length && /\s/u.test(text[end])) end++;
  if (end < text.length) end += text.codePointAt(end) > 0xffff ? 2 : 1;
  while (end < text.length && /\s/u.test(text[end])) end++;
  return text.slice(0, end);
}

class Replay {
  constructor() { this.gaps = []; }
  change(offset, removed, inserted) {
    const end = offset + removed.length;
    const delta = inserted.length - removed.length;
    const adjacent = [];
    this.gaps = this.gaps.filter(gap => {
      if (!inserted && removed && gap.offset >= offset && gap.offset <= end) {
        adjacent.push(gap);
        return false;
      }
      if (gap.offset >= end) gap.offset += delta;
      else if (gap.offset > offset) return false;
      return true;
    });
    if (!inserted && removed) {
      // Reconstruct the original order, including earlier gaps inside this deletion.
      let text = '', position = 0;
      for (const gap of adjacent.sort((a, b) => a.offset - b.offset)) {
        const next = gap.offset - offset;
        text += removed.slice(position, next) + gap.text;
        position = next;
      }
      this.gaps.push({ offset, text: text + removed.slice(position) });
    }
  }
  peek(offset) { return this.gaps.find(g => g.offset === offset); }
  consume(gap, text) {
    gap.text = gap.text.slice(text.length);
    if (!gap.text) this.gaps = this.gaps.filter(g => g !== gap);
  }
}
module.exports = { Replay, chunk };
