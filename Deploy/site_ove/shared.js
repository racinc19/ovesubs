// shared.js — Rodriguez Residence Tracker — 100% LIVE from Google Sheet
// NO hardcoded data. Everything pulled from published sheet on every page load.

// Site-wide PIN: schedule Admin (🔒 Admin) + owner approval on Selections. Change only here.
const SITE_ACCESS_PIN='1234';

const BUDGET_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vQew4OQL4AsLo127rU7ZX8KC6Ur4BklOWahgzWE99HsNQzrEq2Re0cqFpDIofBkW39nXzTvx0cX5Los/pub?output=csv';
const SCHEDULE_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vQew4OQL4AsLo127rU7ZX8KC6Ur4BklOWahgzWE99HsNQzrEq2Re0cqFpDIofBkW39nXzTvx0cX5Los/pub?gid=1440569226&single=true&output=csv';
// SUBS tab — publish this tab and replace the gid below
// Columns: A=Vendor(exact match), B=PIN, C=ContractAmt, D=DriveFolderURL
const SUBS_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vQew4OQL4AsLo127rU7ZX8KC6Ur4BklOWahgzWE99HsNQzrEq2Re0cqFpDIofBkW39nXzTvx0cX5Los/pub?gid=2055446940&single=true&output=csv';

const PHASE_NAMES=['deposit','pre construction','site','structural','mechanical rough',
  'exterior sealing','wall/cieling finish','carpentery','equipment/ finishes','landscape',
  'contingency','options'];

// Spelling corrections only — don't rename what's in the sheet
const PHASE_SPELL_FIX={
  'pre construction':'Pre Construction',
  'wall/cieling finish':'Wall/Ceiling Finish',
  'carpentery':'Carpentry',
  'equipment/ finishes':'Equipment/Finishes'
};
// Phase names as they appear in the SCHEDULE tab (different from budget tab)
const SCHEDULE_PHASE_NAMES=['deposit','pre construction','site','structural','mechanical rough',
  'exterior sealing','wall/cieling finish','carpentery','equipment/ finishes','landscape',
  'contingency','options'];
const PHASE_KEYS=PHASE_NAMES.slice();

let P_START=new Date(2026,1,7);
let P_END=new Date(2027,0,14);
let TOTAL_DAYS=Math.round((P_END-P_START)/864e5);

// ═══ CSV PARSING ═══
function parseCSV(text){
  const rows=[];let cur='',inQ=false,row=[];
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(inQ&&text[i+1]==='"'){cur+='"';i++}else inQ=!inQ}
    else if(c===','&&!inQ){row.push(cur);cur=''}
    else if((c==='\n'||c==='\r')&&!inQ){
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(cur);cur='';rows.push(row);row=[]
    }else cur+=c
  }
  if(cur!==''||row.length)row.push(cur);
  if(row.length)rows.push(row);
  return rows
}

function parseAmt(s){
  if(!s)return 0;s=String(s).trim();
  const neg=s.includes('(')||s.startsWith('-');
  const v=parseFloat(s.replace(/[$\s,()%`-]/g,''));
  return isNaN(v)?0:(neg?-Math.abs(v):v)
}
function parsePct(s){
  if(!s)return 0;s=String(s).trim();
  const v=parseFloat(s.replace(/[%\s]/g,''));
  return isNaN(v)?0:v
}
function norm(s){return(s||'').toLowerCase().replace(/\s+/g,' ').trim()}
function daysBetween(a,b){return Math.round((b-a)/864e5)}
function parseDate(s){
  if(!s)return null;s=String(s).trim();
  if(s==='#REF!'||!s)return null;
  const d=new Date(s);
  return isNaN(d.getTime())?null:d
}

// ═══ PARSE BUDGET TAB ═══
function parseBudgetTab(rows){
  let sqft=0,totalBudget=0,totalProfit=0;
  if(rows[2])sqft=parseAmt(rows[2][0])||6993;
  if(rows[3]){
    totalBudget=parseAmt(rows[3][6])||parseAmt(rows[3][2])||parseAmt(rows[3][1])||0;
    totalProfit=parseAmt(rows[3][13])||0
  }

  // Parse Change Orders from rows 5-8 (before phase data)
  const changeOrdersFromSheet=[];
  for(let i=4;i<10;i++){
    const r=rows[i];if(!r||!r[0])continue;
    const n=(r[0]||'').trim();
    if(!n.match(/^Change\s+\d+/i))continue;
    changeOrdersFromSheet.push({
      num:n,
      desc:(r[1]||'').trim(),
      amount:parseAmt(r[2]),
      pct:parsePct(r[3]),
      invoiced:parseAmt(r[4]),
      paid:parseAmt(r[5]),
      outstanding:parseAmt(r[6]),
      status:'approved'
    });
  }

  const phases=[];
  let curPhase=null;
  const seenBudgetPhases={};

  for(let i=4;i<rows.length;i++){
    const r=rows[i];if(!r||!r[0])continue;
    const name=r[0].trim();if(!name)continue;
    const nameL=norm(name);

    // Phase header: name in phase list, subtotal in col B, NOT already seen, no itemized amount in col C
    const hasSubtotal=parseAmt(r[1])>0;
    const hasItemized=parseAmt(r[2])>0;
    if(PHASE_NAMES.includes(nameL)&&!seenBudgetPhases[nameL]&&(hasSubtotal||!hasItemized)){
      seenBudgetPhases[nameL]=true;
      curPhase={
        name:nameL,
        display:PHASE_SPELL_FIX[nameL]||name,
        subtotal:parseAmt(r[1]),
        items:[],
        markupTotal:0,
        paidTotal:0,
        progress:0,
        startDate:null,
        endDate:null
      };
      phases.push(curPhase);
      continue
    }

    if(!curPhase)continue;
    const vendor=(r[1]||'').trim();
    const itemized=parseAmt(r[2]);     // Contract (col C)
    const pct=parsePct(r[3]);          // %Comp (col D)
    const invoiced=parseAmt(r[4]);     // Invoiced (col E)
    const paid=parseAmt(r[5]);         // Paid (col F)
    const outstanding=parseAmt(r[6]);  // Outstanding (col G)
    const markup=itemized;

    curPhase.items.push({
      name:name,
      nameNorm:nameL,
      vendor:vendor,
      base:itemized,
      markup:itemized,
      duration:0,
      startDate:null,
      endDate:null,
      progress:pct,
      paid:paid,
      invoiced:invoiced,
      outstanding:outstanding,
      profit:0,
      drawAmounts:[],
      totalDrawnBase:0
    })
  }

  for(const p of phases){
    p.markupTotal=p.items.reduce((s,i)=>s+i.markup,0);
    p.paidTotal=p.items.reduce((s,i)=>s+i.paid,0);
    p.progress=0; // Will be set from schedule
  }

  const headerInfo={sqft,budget:totalBudget,duration:0,completion:''};
  return{phases,headerInfo,changeOrders:changeOrdersFromSheet}
}

// ═══ PARSE SCHEDULE TAB ═══
function parseScheduleTab(rows){
  // Row 6 (index 6): headers — Trade, [B], Progress, [D], Start, Days, Finish, Delay
  // Row 7+: ALL rows are data — phase names included as rows with their own dates
  // No section headers to skip — every row with a date is a task

  const tasks=[];
  let earliest=null,latest=null;
  let currentPhase='';
  const seenPhases={};

  for(let i=7;i<rows.length;i++){
    const r=rows[i];if(!r)continue;
    const trade=(r[0]||'').trim();
    const progressStr=(r[2]||'').trim();
    const startStr=(r[4]||'').trim();
    const daysStr=(r[5]||'').trim();
    const finishStr=(r[6]||'').trim();
    const delayStr=(r[7]||'').trim();

    if(!trade&&!startStr)continue;
    if(trade==='-Duration')continue; // skip summary row

    const vendor=(r[1]||'').trim();
    const progress=parsePct(progressStr);
    const start=parseDate(startStr);
    const days=parseInt(daysStr)||0;
    const finish=parseDate(finishStr);
    const delay=parseInt(delayStr)||0;

    // Track if this is a phase-level row (first occurrence only)
    const nameL=norm(trade);
    let isPhase=false;
    if(SCHEDULE_PHASE_NAMES.includes(nameL)&&!seenPhases[nameL]){
      isPhase=true;
      seenPhases[nameL]=true;
      currentPhase=nameL;
    }

    if(start&&(!earliest||start<earliest))earliest=start;
    if(finish&&(!latest||finish>latest))latest=finish;
    if(start&&!finish&&(!latest||start>latest))latest=start;

    // Compute duration: use Days column if >0, otherwise calc from start/finish
    let dur=days;
    if(!dur&&start&&finish){dur=Math.max(0,Math.round((finish-start)/864e5))}

    tasks.push({
      name:trade||'',
      nameNorm:nameL,
      vendor:vendor,
      section:currentPhase,
      isPhase:isPhase,
      progress,
      startDate:start,
      duration:dur,
      endDate:finish,
      delay
    })
  }

  // ── Recompute phase dates/duration from actual children ──
  for(let p=0;p<tasks.length;p++){
    if(!tasks[p].isPhase)continue;
    const phaseName=tasks[p].nameNorm;
    let minS=null,maxE=null;
    for(let c=p+1;c<tasks.length;c++){
      if(tasks[c].isPhase)break; // next phase
      const s=tasks[c].startDate,e=tasks[c].endDate;
      if(s&&(!minS||s<minS))minS=s;
      if(e&&(!maxE||e>maxE))maxE=e;
      if(s&&!e&&(!maxE||s>maxE))maxE=s;
    }
    if(minS)tasks[p].startDate=minS;
    if(maxE)tasks[p].endDate=maxE;
    if(minS&&maxE)tasks[p].duration=Math.max(1,Math.round((maxE-minS)/864e5));
  }

  if(earliest){P_START=earliest}
  if(latest){P_END=latest}
  TOTAL_DAYS=Math.max(1,Math.round((P_END-P_START)/864e5));

  return{tasks,earliest,latest}
}

// ═══ CROSS-REFERENCE BUDGET + SCHEDULE ═══
// Aliases: budget name → schedule name for items that don't match exactly
const NAME_ALIASES={
  'permits':'permit',
  'door':'finish carpentry',
  'base&case':'finish carpentry',
  'door & bath hardware':'finish carpentry',
  'entry stair':'stair',
  'wood stair':'stair',
  'stair labor':'stair'
};

function crossRefBudgetSchedule(budgetPhases,scheduleTasks){
  // Build lookup from schedule
  const taskByPhase={};  // "phaseName|itemName" -> task
  const taskByName={};   // "itemName" -> task (fallback)
  let currentPhase='';

  for(const t of scheduleTasks){
    if(t.isPhase){currentPhase=t.nameNorm}
    if(t.nameNorm){
      taskByName[t.nameNorm]=t;
      if(currentPhase)taskByPhase[currentPhase+'|'+t.nameNorm]=t;
    }
  }

  // Track which schedule tasks got matched
  const matchedTasks=new Set();

  for(const phase of budgetPhases){
    let pStart=null,pEnd=null;

    // Phase-level progress from schedule — this is the source of truth
    const phaseTask=taskByName[phase.name];
    if(phaseTask){
      if(phaseTask.startDate)phase.startDate=phaseTask.startDate;
      if(phaseTask.endDate)phase.endDate=phaseTask.endDate;
      phase.progress=phaseTask.progress;  // Always use schedule progress
      matchedTasks.add(phaseTask)
    }

    // Match budget items to schedule tasks
    const budgetItemNames=new Set();
    for(const item of phase.items){
      budgetItemNames.add(item.nameNorm);
      const alias=NAME_ALIASES[item.nameNorm];
      const t=taskByPhase[phase.name+'|'+item.nameNorm]
        ||(alias?taskByPhase[phase.name+'|'+alias]:null)
        ||taskByName[item.nameNorm]
        ||(alias?taskByName[alias]:null);
      if(t){
        if(t.startDate)item.startDate=t.startDate;
        if(t.endDate)item.endDate=t.endDate;
        if(t.duration)item.duration=t.duration;
        if(t.vendor&&!item.vendor)item.vendor=t.vendor;
        // Budget %comp (col D) is always truth — push it back to the schedule task
        t.progress=item.progress;
        matchedTasks.add(t)
      }
      if(item.startDate&&(!pStart||item.startDate<pStart))pStart=item.startDate;
      if(item.endDate&&(!pEnd||item.endDate>pEnd))pEnd=item.endDate;
    }

    if(!phase.startDate)phase.startDate=pStart;
    if(!phase.endDate)phase.endDate=pEnd;

    // Recalc markup total after adding schedule-only items
    phase.markupTotal=phase.items.reduce((s,i)=>s+i.markup,0);
  }
}

// ═══ BUILD DRAW SCHEDULE FROM BUDGET ═══
function buildDrawSchedule(phases){
  const monthMap={};
  for(const p of phases){
    if(p.name==='options'||p.name==='contingency')continue;
    for(const item of p.items){
      const d=item.endDate||item.startDate;
      if(!d)continue;
      const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      if(!monthMap[key])monthMap[key]={month:new Date(d.getFullYear(),d.getMonth(),1),items:[],total:0,paid:0};
      monthMap[key].items.push({name:item.name,vendor:item.vendor,markup:item.markup,paid:item.paid,phase:p.display});
      monthMap[key].total+=item.markup;
      monthMap[key].paid+=item.paid;
    }
  }
  return Object.keys(monthMap).sort().map(k=>monthMap[k])
}

// ═══ FORMAT HELPERS ═══
function fmt(n){return'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function fmtK(n){return n>=1e6?'$'+(n/1e6).toFixed(2)+'M':n>=1e3?'$'+(n/1e3).toFixed(0)+'K':fmt(n)}
function fmtDate(d){if(!d)return'—';return(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear()}
function fmtMo(d){return['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+d.getFullYear()}
function fmtMoShort(d){return['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+" '"+String(d.getFullYear()).slice(2)}

// ═══ LOAD ALL DATA LIVE ═══
async function loadProjectData(){
  const ts=Date.now();

  const[budgetCSV,scheduleCSV]=await Promise.all([
    fetch(BUDGET_URL+'&_='+ts).then(r=>{if(!r.ok)throw new Error('Budget tab HTTP '+r.status);return r.text()}),
    fetch(SCHEDULE_URL+'&_='+ts).then(r=>{
      if(!r.ok){console.warn('Schedule tab HTTP '+r.status);return ''}
      return r.text()
    }).catch(e=>{console.warn('Schedule fetch failed:',e.message);return ''})
  ]);

  const budgetRows=parseCSV(budgetCSV);
  const{phases,headerInfo,changeOrders:sheetCOs}=parseBudgetTab(budgetRows);

  let scheduleTasks=[];
  if(scheduleCSV){
    const scheduleRows=parseCSV(scheduleCSV);
    const sched=parseScheduleTab(scheduleRows);
    scheduleTasks=sched.tasks;
  }

  crossRefBudgetSchedule(phases,scheduleTasks);

  let totalBudget=0,totalPaid=0;
  for(const p of phases){
    if(p.name==='options'||p.name==='contingency')continue;
    totalBudget+=p.markupTotal;
    totalPaid+=p.paidTotal;
  }
  const totals={totalBudget,totalPaid,progress:totalBudget>0?(totalPaid/totalBudget*100):0};

  const main={phases,headerInfo,totals,scheduleTasks,sheetCOs};
  const draws=buildDrawSchedule(phases);

  return{main,draws,totals}
}

function getBudgetData(){
  return{phases:[],headerInfo:{sqft:6993,budget:0,duration:0,completion:''}}
}

// ═══ IndexedDB Photo Store ═══
const PHOTO_DB='rodriguez_photos';
const PHOTO_STORE='photos';
let _photoDB=null;

function openPhotoDB(){
  if(_photoDB)return Promise.resolve(_photoDB);
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(PHOTO_DB,1);
    req.onupgradeneeded=e=>{e.target.result.createObjectStore(PHOTO_STORE)};
    req.onsuccess=e=>{_photoDB=e.target.result;resolve(_photoDB)};
    req.onerror=e=>reject(e.target.error)
  })
}

function savePhoto(key,dataUrl){
  return openPhotoDB().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(PHOTO_STORE,'readwrite');
    tx.objectStore(PHOTO_STORE).put(dataUrl,key);
    tx.oncomplete=()=>resolve(key);
    tx.onerror=e=>reject(e.target.error)
  }))
}

function getPhoto(key){
  return openPhotoDB().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(PHOTO_STORE,'readonly');
    const req=tx.objectStore(PHOTO_STORE).get(key);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=e=>reject(e.target.error)
  }))
}

function getPhotos(keys){
  if(!keys||!keys.length)return Promise.resolve([]);
  return openPhotoDB().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(PHOTO_STORE,'readonly');
    const store=tx.objectStore(PHOTO_STORE);
    const results=[];
    let done=0;
    keys.forEach((key,i)=>{
      const req=store.get(key);
      req.onsuccess=()=>{results[i]=req.result||null;if(++done===keys.length)resolve(results)};
      req.onerror=()=>{results[i]=null;if(++done===keys.length)resolve(results)}
    })
  }))
}

function deletePhotos(keys){
  if(!keys||!keys.length)return Promise.resolve();
  return openPhotoDB().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(PHOTO_STORE,'readwrite');
    const store=tx.objectStore(PHOTO_STORE);
    keys.forEach(k=>store.delete(k));
    tx.oncomplete=()=>resolve();
    tx.onerror=e=>reject(e.target.error)
  }))
}

function compressImage(dataUrl,maxW,quality){
  maxW=maxW||1200;quality=quality||0.7;
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      let w=img.width,h=img.height;
      if(w>maxW){h=Math.round(h*maxW/w);w=maxW}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      resolve(c.toDataURL('image/jpeg',quality))
    };
    img.src=dataUrl
  })
}

function genPhotoKey(){return 'p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
