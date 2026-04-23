from pathlib import Path
p = Path(r'C:\Users\racin\Desktop\ovesubs\Deploy\site_ove\index.html')
text = p.read_text(encoding='utf-8')
text = text.replace("function renderHero(tasks){\n", "function renderHero(tasks){\n  const taskScheduleEndLocal=(t)=>{\n    if(typeof taskScheduleEnd=='function') return taskScheduleEnd(t);\n    return t.endDate||t.startDate||null;\n  };\n")
text = text.replace("    const end=t.endDate||t.startDate;\n", "    const end=taskScheduleEndLocal(t)||t.endDate||t.startDate;\n")
text = text.replace("    if(t.endDate)gMax=Math.max(gMax,t.endDate.getTime());\n", "    const effEnd=taskScheduleEndLocal(t)||t.endDate;\n    if(effEnd)gMax=Math.max(gMax,effEnd.getTime());\n")
text = text.replace("    const s=t.startDate,e=t.endDate||s;\n", "    const s=t.startDate,e=taskScheduleEndLocal(t)||t.endDate||s;\n")
p.write_text(text, encoding='utf-8')
Path(r'C:\Users\racin\Desktop\ovesubs\Deploy\site_ove\gantt.html').write_text(text, encoding='utf-8')
