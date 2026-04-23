from pathlib import Path

ove = Path(r'C:\Users\racin\AppData\Local\Temp\ove_nav_base.html').read_text(encoding='utf-8', errors='replace')
oak = Path(r'C:\Users\racin\Desktop\Oak-Valley-Estates\Deploy\deploy_live\gantt.html').read_text(encoding='utf-8', errors='replace')

nav_start = ove.index('<nav class="topnav">')
nav_end = ove.index('</nav>', nav_start) + len('</nav>')
ove_nav = ove[nav_start:nav_end]

oak_body_start = oak.index('<div id="loading">')
oak_body_end = oak.index('<script src="shared.js?v20260424_schedulecols"></script>')
oak_body = oak[oak_body_start:oak_body_end]

oak_script_start = oak.index('<script src="shared.js?v20260424_schedulecols"></script>')
oak_script_end = oak.index('</body>')
oak_script = oak[oak_script_start:oak_script_end]

title_start = ove.index('<title>')
title_end = ove.index('</title>') + len('</title>')
new_title = '<title>OVE subs — Schedule</title>'

style_start = oak.index('<style>')
style_end = oak.index('</style>') + len('</style>')
oak_style = oak[style_start:style_end]

oak_style = oak_style.replace('.topnav-refresh{flex:0 0 auto;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:500;border:1px solid var(--bdr);background:none;color:var(--txt2);cursor:pointer;transition:all .2s;white-space:nowrap}\n.topnav-refresh:hover{border-color:var(--blue);color:var(--txt)}\n\n', '.topnav-right{display:flex;gap:8px;align-items:center}\n.topnav-btn{padding:6px 14px;border-radius:8px;font-size:12px;font-weight:500;border:1px solid var(--bdr);background:none;color:var(--txt2);cursor:pointer;transition:all .2s;white-space:nowrap}\n.topnav-btn:hover{border-color:var(--blue);color:var(--txt)}\n.unlock{border-color:rgba(234,179,8,.4);color:var(--yellow)}\n.unlock:hover{background:rgba(234,179,8,.08)}\n.locked{border-color:rgba(34,197,94,.4);color:var(--green)}\n\n')

oak_body = oak_body.replace('<div class="gantt-phase-tracker" id="ganttPhaseTracker"></div>','')
oak_body = oak_body.replace('<button class="topnav-refresh" onclick="doRefresh()">↻ Refresh</button>','')

oak_script = oak_script.replace('<script src="shared.js?v20260424_schedulecols"></script>', '<script src="shared.js?v20260424_schedulecols"></script>')
oak_script = oak_script.replace('const GANTT_LBL=250;\nlet allTasks=[];','const ADMIN_PIN=SITE_ACCESS_PIN;\nconst ADMIN_KEY=\'rac_admin\';\nconst GANTT_LBL=250;\nlet isAdmin=sessionStorage.getItem(ADMIN_KEY)===\'1\';\nlet pending={};\nlet allTasks=[];\n\nfunction toggleAdmin(){isAdmin?exitAdmin():openPin()}\nfunction openPin(){document.getElementById(\'pinModal\').classList.remove(\'hidden\');document.getElementById(\'pd0\').focus()}\nfunction closePin(){document.getElementById(\'pinModal\').classList.add(\'hidden\');[0,1,2,3].forEach(i=>document.getElementById(\'pd\'+i).value=\'\');document.getElementById(\'pinOk\').disabled=true;document.getElementById(\'pinErr\').textContent=\'\'}\nfunction pIn(i){const e=document.getElementById(\'pd\'+i);e.value=e.value.replace(/\\D/g,\'\');if(e.value&&i<3)document.getElementById(\'pd\'+(i+1)).focus();document.getElementById(\'pinOk\').disabled=[0,1,2,3].map(j=>document.getElementById(\'pd\'+j).value).join(\'\').length!==4;document.getElementById(\'pinErr\').textContent=\'\'}\nfunction pKey(e,i){if(e.key===\'Backspace\'&&!document.getElementById(\'pd\'+i).value&&i>0)document.getElementById(\'pd\'+(i-1)).focus();if(e.key===\'Enter\')checkPin()}\nfunction checkPin(){const p=[0,1,2,3].map(i=>document.getElementById(\'pd\'+i).value).join(\'\');if(p===ADMIN_PIN){isAdmin=true;sessionStorage.setItem(ADMIN_KEY,\'1\');closePin();applyAdmin()}else{document.getElementById(\'pinErr\').textContent=\'Incorrect PIN\';[0,1,2,3].forEach(i=>document.getElementById(\'pd\'+i).value=\'\');document.getElementById(\'pd0\').focus();document.getElementById(\'pinOk\').disabled=true}}\nfunction applyAdmin(){document.getElementById(\'adminBtn\').textContent=\'🔓 Admin ON\';document.getElementById(\'adminBtn\').classList.remove(\'unlock\');document.getElementById(\'adminBtn\').classList.add(\'locked\');document.getElementById(\'gb\').classList.add(\'adm\')}\nfunction exitAdmin(){if(Object.keys(pending).length&&!confirm(\'Discard unsaved changes?\'))return;isAdmin=false;pending={};sessionStorage.removeItem(ADMIN_KEY);document.getElementById(\'adminBtn\').textContent=\'🔒 Admin\';document.getElementById(\'adminBtn\').classList.add(\'unlock\');document.getElementById(\'adminBtn\').classList.remove(\'locked\');document.getElementById(\'gb\').classList.remove(\'adm\');document.getElementById(\'saveBar\').classList.remove(\'vis\');renderGanttReadonly(allTasks)}\nfunction cancelEdits(){pending={};document.getElementById(\'saveBar\').classList.remove(\'vis\');renderGanttReadonly(allTasks)}\nfunction saveEdits(){for(const t of allTasks){if(pending[t.nameNorm]!==undefined)t.progress=pending[t.nameNorm]}pending={};document.getElementById(\'saveBar\').classList.remove(\'vis\');renderGanttReadonly(allTasks);alert(\'Saved locally. Update the Google Sheet %Comp column to make it permanent.\')}')

oak_script = oak_script.replace('const h=getPrimarySubcontractorHeroState(tasks,{});','const h=getPrimarySubcontractorHeroState(tasks,pending);')
oak_script = oak_script.replace('const prog=t.progress;','const prog=pending[t.nameNorm]!==undefined?pending[t.nameNorm]:t.progress;')
oak_script = oak_script.replace("      tl.appendChild(inp);\n    }\n\n    row.appendChild(lbl);row.appendChild(tl);", "      tl.appendChild(inp);\n    }\n\n    row.appendChild(lbl);row.appendChild(tl);")
oak_script = oak_script.replace('  gb.onscroll=()=>{mhdr.parentElement.scrollLeft=gb.scrollLeft};\n}','  gb.onscroll=()=>{mhdr.parentElement.scrollLeft=gb.scrollLeft};\n  if(isAdmin)applyAdmin();\n}')
oak_script = oak_script.replace("    const pt=document.getElementById('ganttPhaseTracker');\n    if(pt)pt.innerHTML=renderPhaseTrackerHTML(main);\n", '')

overlay = '''<div class="modal-bg hidden" id="pinModal">\n  <div class="modal">\n    <button class="modal-close" onclick="closePin()">×</button>\n    <h3>Admin Access</h3>\n    <p>Enter PIN to unlock progress editing</p>\n    <div class="pin-row">\n      <input class="pin-d" maxlength="1" inputmode="numeric" id="pd0" oninput="pIn(0)" onkeydown="pKey(event,0)">\n      <input class="pin-d" maxlength="1" inputmode="numeric" id="pd1" oninput="pIn(1)" onkeydown="pKey(event,1)">\n      <input class="pin-d" maxlength="1" inputmode="numeric" id="pd2" oninput="pIn(2)" onkeydown="pKey(event,2)">\n      <input class="pin-d" maxlength="1" inputmode="numeric" id="pd3" oninput="pIn(3)" onkeydown="pKey(event,3)">\n    </div>\n    <button class="pin-submit" id="pinOk" disabled onclick="checkPin()">Unlock</button>\n    <div class="pin-err" id="pinErr"></div>\n  </div>\n</div>\n\n<div class="save-bar" id="saveBar">\n  <span>⚠ Unsaved changes</span>\n  <button class="cbtn" onclick="cancelEdits()">Cancel</button>\n  <button class="sbtn" onclick="saveEdits()">Save</button>\n</div>\n'''

oak_body = overlay + oak_body
new_nav = '''<nav class="topnav"><div class="topnav-inner">\n  <a href="index.html" class="topnav-brand"><span class="dot"></span>OVE subs</a>\n  <div class="topnav-links">\n    <a href="index.html" style="padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700;color:#fff;background:var(--blue);text-decoration:none">Dashboard</a>\n    <a href="https://drive.google.com/drive/u/0/folders/1kS-2awScLDAnGS973xD0D28RxynI49Si" target="_blank" style="padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;color:var(--cyan);text-decoration:none;border:1px solid rgba(6,182,212,.3)">📁 Plans & Permits</a>\n    <a href="selections.html" style="padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;color:var(--purple);text-decoration:none;border:1px solid rgba(139,92,246,.3)">🎨 Selections</a>\n    <a href="electrical.html" style="padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;color:var(--yellow);text-decoration:none;border:1px solid rgba(234,179,8,.3)">⚡ Electrical</a>\n  </div>\n  <div class="topnav-right">\n    <button class="topnav-btn" onclick="doRefresh()">↻ Refresh</button>\n    <button class="topnav-btn unlock" id="adminBtn" onclick="toggleAdmin()">🔒 Admin</button>\n  </div>\n</div></nav>'''

head_start = ove.index('<head>')
body_start = ove.index('<body>')
end_body = oak.index('</body>')
new_doc = oak[:head_start] + '<head>\n' + oak_style + '\n</head>\n<body>\n' + new_nav + '\n\n' + oak_body + '\n' + oak_script + '\n</body>\n</html>\n'
new_doc = new_doc.replace('<title>Rodriguez Residence — Gantt Chart</title>', new_title)
Path(r'C:\Users\racin\Desktop\ovesubs\Deploy\site_ove\index.html').write_text(new_doc, encoding='utf-8')
