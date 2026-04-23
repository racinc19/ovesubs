from pathlib import Path
p = Path(r'C:\Users\racin\Desktop\ovesubs\Deploy\site_ove\shared.js')
text = p.read_text(encoding='utf-8', errors='replace')
needle = "return html;\n}\n\n// ═══ LOAD ALL DATA LIVE ═══"
replacement = "return html;\n}\n\nfunction renderActivityTrackersOnly(main){\n  const full=renderPhaseTrackerHTML(main)||'';\n  const start=full.indexOf('<div class=\"item-steps\">');\n  return start>=0?full.slice(start):'';\n}\n\n// ═══ LOAD ALL DATA LIVE ═══"
if needle not in text:
    needle = "return html;\r\n}\r\n\r\n// ═══ LOAD ALL DATA LIVE ═══"
text = text.replace(needle, replacement)
p.write_text(text, encoding='utf-8')
