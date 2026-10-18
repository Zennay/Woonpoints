'use client';

import { useMemo, useRef, useState } from 'react';

const ROOMS = ['Woonkamer','Keuken','Slaapkamer','Badkamer','Hal',
  'Werkkamer','Berging','Balkon','Overig'] as const;
const STATES = ['Nog inpakken','Ingepakt','Uitgepakt'] as const;
type Room = (typeof ROOMS)[number];
type PackingState = (typeof STATES)[number];
type PackingItem = {
  id:string;label:string;room:Room;quantity:number;box:string;
  priority:boolean;status:PackingState;
};
type PackingArchive = {format:'woonpoints-private-packing-list';version:1;items:PackingItem[]};
type FormState = {label:string;room:Room;quantity:string;box:string;priority:boolean;status:PackingState};
const blank = ():FormState=>({
  label:'',room:'Woonkamer',quantity:'1',box:'',priority:false,status:'Nog inpakken'
});
const CONTROL = /[\u0000-\u001f\u007f]/;
function cleanText(raw:string):string{return raw.trim();}
function validItem(raw:unknown):raw is PackingItem{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const row=raw as Record<string,unknown>;
  if(Object.keys(row).sort().join('|')!=='box|id|label|priority|quantity|room|status')return false;
  return typeof row.id==='string'&&/^item-[0-9]+-[0-9]+$/.test(row.id)&&
    typeof row.label==='string'&&row.label===row.label.trim()&&
    row.label.length>0&&row.label.length<=60&&!CONTROL.test(row.label)&&
    typeof row.box==='string'&&row.box===row.box.trim()&&
    row.box.length<=30&&!CONTROL.test(row.box)&&
    ROOMS.includes(row.room as Room)&&STATES.includes(row.status as PackingState)&&
    typeof row.priority==='boolean'&&typeof row.quantity==='number'&&
    Number.isInteger(row.quantity)&&row.quantity>=1&&row.quantity<=99;
}
function validArchive(raw:unknown):raw is PackingArchive{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const obj=raw as Record<string,unknown>;
  if(Object.keys(obj).sort().join('|')!=='format|items|version'|| 
    obj.format!=='woonpoints-private-packing-list'||obj.version!==1||
    !Array.isArray(obj.items)||obj.items.length>80||
    !obj.items.every(validItem))return false;
  const ids=obj.items.map((item:PackingItem)=>item.id);
  return new Set(ids).size===ids.length;
}
function downloadPrivateFile(name:string,content:string,mime:string){
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const anchor=document.createElement('a');
  anchor.href=url;anchor.download=name;anchor.rel='noopener';
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function packingReport(items:PackingItem[]):string{
  const lines=[
    'WOONPOINTS - PRIVÉ PAKLIJST',
    'Zelf ingevoerde spullen en dozen. Geen garantie op volledigheid of verhuizing.',
    'Totaal '+items.length+' regels; '+items.reduce((n,item)=>n+item.quantity,0)+' stuks.',
    'Eerst nodig: '+items.filter(item=>item.priority&&item.status!=='Uitgepakt').length+
      ' nog niet uitgepakte regels.',''
  ];
  for(const room of ROOMS){
    const matching=items.filter(item=>item.room===room)
      .sort((a,b)=>Number(b.priority)-Number(a.priority)||a.label.localeCompare(b.label,'nl-NL'));
    if(!matching.length)continue;
    lines.push('=== '+room.toUpperCase()+' ===');
    for(const item of matching){
      lines.push('['+item.status+'] '+item.quantity+' × '+item.label+
        (item.box?' - doos: '+item.box:'')+(item.priority?' - DIRECT NODIG':''));
    }
    lines.push('');
  }
  lines.push('Dit is een lokale persoonlijke lijst, geen officiële inventaris of verzekeringsoverzicht.',
    'Bewaar en deel deze gegevens alleen bewust.');
  return lines.join('\n')+'\n';
}

/** Entirely ephemeral room-by-room packing board. No account, worker or API calls. */
export default function PrivateMovingPackingInventory(){
  const [items,setItems]=useState<PackingItem[]>([]);
  const [form,setForm]=useState<FormState>(blank);
  const [editing,setEditing]=useState<string|null>(null);
  const [roomFilter,setRoomFilter]=useState<Room|'Alle kamers'>('Alle kamers');
  const [stateFilter,setStateFilter]=useState<PackingState|'Alle statussen'>('Alle statussen');
  const [pendingDelete,setPendingDelete]=useState<string|null>(null);
  const [confirmClear,setConfirmClear]=useState(false);
  const [pendingExport,setPendingExport]=useState<{kind:'json'|'txt';signature:string}|null>(null);
  const [pendingRestore,setPendingRestore]=useState<PackingArchive|null>(null);
  const [notice,setNotice]=useState('');
  const sequence=useRef(0);
  const signature=JSON.stringify(items);
  const total=items.reduce((sum,item)=>sum+item.quantity,0);
  const packed=items.filter(item=>item.status!=='Nog inpakken').length;
  const unpacked=items.filter(item=>item.status==='Uitgepakt').length;
  const urgent=items.filter(item=>item.priority&&item.status!=='Uitgepakt');
  const visible=useMemo(()=>items.filter(item=>
    (roomFilter==='Alle kamers'||item.room===roomFilter)&&
    (stateFilter==='Alle statussen'||item.status===stateFilter)
  ).sort((a,b)=>Number(b.priority)-Number(a.priority)||
    a.room.localeCompare(b.room,'nl-NL')||a.label.localeCompare(b.label,'nl-NL')),
  [items,roomFilter,stateFilter]);
  const report=packingReport(items);
  const resetPending=()=>{
    setPendingExport(null);setPendingRestore(null);setPendingDelete(null);
    setConfirmClear(false);setNotice('');
  };
  function saveItem(){
    const label=cleanText(form.label),box=cleanText(form.box),quantity=Number(form.quantity);
    if(!label||label.length>60||CONTROL.test(label)||box.length>30||CONTROL.test(box)||
      !/^[1-9][0-9]?$/.test(form.quantity)||!Number.isInteger(quantity)||
      !ROOMS.includes(form.room)||!STATES.includes(form.status)){
      setNotice('Ongeldige invoer: naam 1–60 tekens, dooscode max. 30 en aantal 1–99.');
      return;
    }
    if(!editing&&items.length>=80){setNotice('Maximaal 80 privé-pakregels.');return;}
    const previous=editing?items.find(item=>item.id===editing):null;
    if(editing&&!previous){setEditing(null);setNotice('Deze regel bestaat niet meer.');return;}
    const updated:PackingItem={id:previous?.id||'item-'+Date.now()+'-'+(++sequence.current),
      label,box,quantity,room:form.room,priority:form.priority,status:form.status};
    setItems(old=>editing?old.map(item=>item.id===editing?updated:item):[...old,updated]);
    setEditing(null);setForm(blank());resetPending();
    setNotice(editing?'Pakregel bijgewerkt.':'Pakregel toegevoegd.');
  }
  function startEdit(item:PackingItem){
    setEditing(item.id);setForm({label:item.label,room:item.room,box:item.box,
      quantity:String(item.quantity),priority:item.priority,status:item.status});
    resetPending();
  }
  function changeStatus(id:string,status:PackingState){
    setItems(old=>old.map(item=>item.id===id?{...item,status}:item));
    resetPending();
  }
  function exportNow(kind:'json'|'txt'){
    if(pendingExport?.signature!==signature||pendingExport.kind!==kind){
      setPendingExport(null);setNotice('De paklijst is veranderd. Controleer de nieuwe inhoud eerst.');
      return;
    }
    if(kind==='json'){
      const archive:PackingArchive={format:'woonpoints-private-packing-list',version:1,items};
      downloadPrivateFile('woonpoints-prive-paklijst.json',
        JSON.stringify(archive,null,2)+'\n','application/json;charset=utf-8');
    }else downloadPrivateFile('woonpoints-prive-paklijst.txt',report,'text/plain;charset=utf-8');
    setPendingExport(null);setNotice('Bestand lokaal aangeboden. Je opslaglocatie kan synchroniseren.');
  }
  async function readArchive(file:File|undefined){
    setPendingRestore(null);setPendingExport(null);
    if(!file)return;
    if(file.size<1||file.size>32768){setNotice('Back-up geweigerd: kies een JSON van maximaal 32 KiB.');return;}
    try{
      const raw:unknown=JSON.parse(await file.text());
      if(!validArchive(raw))throw new Error('invalid archive');
      setPendingRestore(raw);
      setNotice('Geldige privé-lijst gelezen; bestaande regels nog niet vervangen.');
    }catch{
      setNotice('Back-up geweigerd: versie, velden, aantallen of inhoud ongeldig. Huidige lijst behouden.');
    }
  }
  return <section className="panel" aria-labelledby="private-packing-heading">
    <p className="eyebrow">VERHUIZEN · EIGEN KAMERS EN DOZEN</p>
    <h2 id="private-packing-heading">Paklijst per kamer</h2>
    <p>Houd zelf bij wat nog in een doos moet, ingepakt is of al is uitgepakt.
      Markeer spullen die je als eerste nodig hebt. Geen automatische registratie,
      opslag, WoningNet-koppeling of externe inventarisgegevens.</p>
    <dl>
      <div><dt>Eigen regels</dt><dd>{items.length} / 80</dd></div>
      <div><dt>Stuks volgens eigen invoer</dt><dd>{total}</dd></div>
      <div><dt>Ingepakt of uitgepakt</dt><dd>{packed} / {items.length} regels</dd></div>
      <div><dt>Al uitgepakt</dt><dd>{unpacked} regels</dd></div>
      <div><dt>Eerst nodig</dt><dd>{urgent.length} open regels</dd></div>
    </dl>
    <h3>{editing?'Bewerk je pakregel':'Voeg een pakregel toe'}</h3>
    <label htmlFor="pack-item">Eigen omschrijving (geen persoonsgegevens)</label>
    <input id="pack-item" maxLength={60} autoComplete="off" value={form.label}
      onChange={event=>setForm(old=>({...old,label:event.target.value}))}
      placeholder="Bijvoorbeeld: borden" />
    <label htmlFor="pack-room">Kamer</label>
    <select id="pack-room" value={form.room}
      onChange={event=>setForm(old=>({...old,room:event.target.value as Room}))}>
      {ROOMS.map(room=><option key={room} value={room}>{room}</option>)}
    </select>
    <label htmlFor="pack-count">Aantal stuks (1–99)</label>
    <input id="pack-count" type="number" min={1} max={99} step={1}
      value={form.quantity} onChange={event=>setForm(old=>({...old,quantity:event.target.value}))}/>
    <label htmlFor="pack-box">Eigen dooslabel (optioneel, maximaal 30 tekens)</label>
    <input id="pack-box" maxLength={30} autoComplete="off" value={form.box}
      onChange={event=>setForm(old=>({...old,box:event.target.value}))}
      placeholder="Bijvoorbeeld: K-03" />
    <label htmlFor="pack-priority">
      <input id="pack-priority" type="checkbox" checked={form.priority}
        onChange={event=>setForm(old=>({...old,priority:event.target.checked}))} />
      Als eerste nodig na verhuizing
    </label>
    <label htmlFor="pack-status">Eigen status</label>
    <select id="pack-status" value={form.status}
      onChange={event=>setForm(old=>({...old,status:event.target.value as PackingState}))}>
      {STATES.map(status=><option key={status} value={status}>{status}</option>)}
    </select>
    <div>
      <button type="button" onClick={saveItem}>{editing?'Bewaar wijzigingen':'Voeg toe'}</button>
      {editing&&<button type="button" onClick={()=>{setEditing(null);setForm(blank());}}>
        Annuleer bewerken</button>}
    </div>
    <h3>Je eigen kamers</h3>
    <ul>{ROOMS.map(room=>{
      const rows=items.filter(item=>item.room===room);
      if(!rows.length)return null;
      const ready=rows.filter(item=>item.status!=='Nog inpakken').length;
      return <li key={room}>{room}: {ready} van {rows.length} regels ingepakt of uitgepakt
        {' · '}{rows.reduce((n,item)=>n+item.quantity,0)} stuks</li>;
    })}</ul>
    {items.length===0&&<p>Nog geen spullen genoteerd.</p>}
    {urgent.length>0&&<div>
      <h3>Eerst nodig na aankomst</h3>
      <ul>{urgent.map(item=><li key={item.id}>
        {item.room}: {item.quantity} × {item.label}
        {item.box?' · doos '+item.box:''} · {item.status}
      </li>)}</ul>
    </div>}
    <h3>Pakregels bekijken</h3>
    <label htmlFor="pack-filter-room">Filter op kamer</label>
    <select id="pack-filter-room" value={roomFilter}
      onChange={event=>setRoomFilter(event.target.value as Room|'Alle kamers')}>
      <option>Alle kamers</option>
      {ROOMS.map(room=><option key={room}>{room}</option>)}
    </select>
    <label htmlFor="pack-filter-state">Filter op status</label>
    <select id="pack-filter-state" value={stateFilter}
      onChange={event=>setStateFilter(event.target.value as PackingState|'Alle statussen')}>
      <option>Alle statussen</option>
      {STATES.map(status=><option key={status}>{status}</option>)}
    </select>
    <p>{visible.length} van {items.length} eigen regels zichtbaar.</p>
    <ol>{visible.map(item=><li key={item.id}>
      <strong>{item.quantity} × {item.label}</strong> · {item.room}
      {item.box?' · doos '+item.box:''}{item.priority?' · eerst nodig':''}
      <label htmlFor={'pack-status-'+item.id}>Status van {item.label}</label>
      <select id={'pack-status-'+item.id} value={item.status}
        onChange={event=>changeStatus(item.id,event.target.value as PackingState)}>
        {STATES.map(status=><option key={status}>{status}</option>)}
      </select>
      <button type="button" onClick={()=>startEdit(item)}>Bewerk</button>
      <button type="button" onClick={()=>{setPendingDelete(item.id);setNotice('');}}>Verwijder…</button>
      {pendingDelete===item.id&&<div role="group" aria-label="Bevestig pakregel verwijderen">
        <p>Verwijder je eigen regel <strong>{item.label}</strong>?</p>
        <button type="button" onClick={()=>{
          setItems(old=>old.filter(x=>x.id!==item.id));
          if(editing===item.id){setEditing(null);setForm(blank());}
          resetPending();setNotice('Pakregel verwijderd.');
        }}>Ja, verwijder deze regel</button>
        <button type="button" onClick={()=>setPendingDelete(null)}>Annuleren</button>
      </div>}
    </li>)}</ol>
    {visible.length===0&&items.length>0&&<p>Geen regels binnen je filters.</p>}
    <h3>Zelf privé bewaren of overdragen</h3>
    <p>Back-up en paklijst bevatten eigen kamerlabels, omschrijvingen en doosnummers.
      Bekijk eerst de exacte gegevens. Niets wordt zonder bevestiging gedownload.</p>
    <button type="button" onClick={()=>{
      setPendingExport({kind:'txt',signature});setNotice('');
    }}>Bekijk leesbare paklijst als TXT…</button>
    <button type="button" onClick={()=>{
      setPendingExport({kind:'json',signature});setNotice('');
    }}>Bekijk complete privé-back-up als JSON…</button>
    {pendingExport&&pendingExport.signature===signature&&
      <div role="group" aria-label="Bevestig paklijst export">
        <p>{pendingExport.kind==='json'?
          'Een privé JSON-back-up waarmee je deze volledige lijst later kunt herstellen.':
          'Een leesbare paklijst met kamer, status, dooslabel en prioriteit.'}
          Controleer de gegevens vóór bewaren of delen.</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',
          maxHeight:'25rem',overflowY:'auto'}}>{pendingExport.kind==='json'?
          JSON.stringify({format:'woonpoints-private-packing-list',version:1,items},null,2):report}</pre>
        <button type="button" onClick={()=>exportNow(pendingExport.kind)}>
          Bevestig privé-{pendingExport.kind==='json'?'JSON':'TXT'}-download</button>
        <button type="button" onClick={()=>setPendingExport(null)}>Annuleren</button>
      </div>}
    <label htmlFor="pack-upload">Herstel eigen paklijst (JSON, maximaal 32 KiB)</label>
    <input id="pack-upload" type="file" accept=".json,application/json"
      onChange={event=>{
        const file=event.currentTarget.files?.[0];
        event.currentTarget.value='';void readArchive(file);
      }}/>
    {pendingRestore&&<div role="group" aria-label="Bevestig huidige paklijst vervangen">
      <p>Back-up bevat {pendingRestore.items.length} eigen regels in
        { ' '+new Set(pendingRestore.items.map(item=>item.room)).size} kamer(s).
        Bevestigen vervangt de huidige {items.length} regels, inclusief onbewaarde wijzigingen.
        Er wordt niets met WoningNet gecontroleerd.</p>
      <button type="button" onClick={()=>{
        setItems(pendingRestore.items);setPendingRestore(null);setPendingExport(null);
        setPendingDelete(null);setEditing(null);setForm(blank());
        setNotice('Privé-paklijst hersteld. Geen externe gegevens gecontroleerd.');
      }}>Ja, vervang volledige paklijst</button>
      <button type="button" onClick={()=>setPendingRestore(null)}>Annuleren</button>
    </div>}
    {!confirmClear?<button type="button" onClick={()=>setConfirmClear(true)}>
      Wis eigen paklijst…</button>:<div role="group" aria-label="Bevestig paklijst wissen">
      <p>Wis alle {items.length} eigen pakregels uit dit tabblad? Externe kopieën blijven bestaan.</p>
      <button type="button" onClick={()=>{
        setItems([]);setEditing(null);setForm(blank());resetPending();setNotice('Paklijst gewist.');
      }}>Ja, wis alle regels</button>
      <button type="button" onClick={()=>setConfirmClear(false)}>Annuleren</button>
    </div>}
    {notice&&<p role="status">{notice}</p>}
    <p>Alle informatie blijft uitsluitend in het geheugen van dit tabblad.
      Sluiten of verversen wist niet-geëxporteerde regels. Dit hulpmiddel bevat
      geen WoningNet-accountgegevens, voorraadgarantie of automatische verzendactie.</p>
  </section>;
}
