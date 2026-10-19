'use client';

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './private-offer-desk.module.css';

type OfferStatus = 'nog-bekijken'|'vragen-open'|'zelf-overwegen'|'afgewezen';
type Offer = {
  id:string; label:string; rentCents:number; serviceCents:number;
  utilitiesCents:number; depositCents:number; otherCents:number;
  startDate:string; status:OfferStatus; checked:string[]; questions:string;
};
type Draft = {
  label:string; rent:string; service:string; utilities:string; deposit:string;
  other:string; startDate:string; status:OfferStatus; questions:string;
};
type Backup = {kind:'woonpoints-prive-huurvoorstellen';version:1;offers:Offer[]};

const MAX_OFFERS=5;
const MAX_FILE=16*1024;
const MAX_CENTS=5_000_000;
const KIND='woonpoints-prive-huurvoorstellen';
const checklist=[
  {id:'huurprijs',name:'Huurprijs, kale huur en servicekosten schriftelijk nagekeken'},
  {id:'borg',name:'Borgsom en voorwaarden voor terugbetaling nagevraagd'},
  {id:'energie',name:'Energie-, internet- en overige contractkosten nagevraagd'},
  {id:'looptijd',name:'Looptijd, opzegging en voorwaarden nagelezen'},
  {id:'inspectie',name:'Staat van de woning en oplevering/inspectie besproken'},
  {id:'rechten',name:'Inschrijving, passendheid en eventuele officiële rechten zelf geverifieerd'}
] as const;
const ids=new Set<string>(checklist.map(item=>item.id));
const statuses:Record<OfferStatus,string>={
  'nog-bekijken':'Nog bekijken','vragen-open':'Nog vragen','zelf-overwegen':'Zelf overwegen','afgewezen':'Afgewezen'
};
const newDraft=():Draft=>({
  label:'',rent:'',service:'0',utilities:'0',deposit:'0',other:'0',
  startDate:'',status:'nog-bekijken',questions:''
});
const euro=(cents:number)=>new Intl.NumberFormat('nl-NL',{
  style:'currency',currency:'EUR'
}).format(cents/100);
const integerMoney=(value:string):number|null=>{
  const clean=value.trim();
  if(!/^(?:0|[1-9][0-9]{0,4})(?:[,.][0-9]{1,2})?$/.test(clean))return null;
  const [whole,dec='']=clean.replace(',','.').split('.');
  const cents=Number(whole)*100+Number(dec.padEnd(2,'0'));
  return Number.isSafeInteger(cents)&&cents<=MAX_CENTS?cents:null;
};
const moneyText=(value:number)=>(value/100).toFixed(2).replace('.',',');
const object=(value:unknown):value is Record<string,unknown>=>
  typeof value==='object'&&value!==null&&!Array.isArray(value);
const hasKeys=(value:Record<string,unknown>,expected:readonly string[])=>
  Object.keys(value).length===expected.length&&Object.keys(value).every(k=>expected.includes(k));
const validLabel=(value:unknown,max:number)=>
  typeof value==='string'&&value===value.trim()&&value.length>=1&&value.length<=max&&
  !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
const validQuestions=(value:unknown)=>
  typeof value==='string'&&value.length<=400&&
  !/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
const validDate=(value:unknown)=>
  typeof value==='string'&&(value===''||
  (/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00.000Z'))&&
   new Date(value+'T00:00:00.000Z').toISOString().slice(0,10)===value));
const validMoney=(value:unknown):value is number=>
  typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=MAX_CENTS;
const validOffer=(value:unknown):value is Offer=>{
  if(!object(value)||!hasKeys(value,[
    'id','label','rentCents','serviceCents','utilitiesCents','depositCents',
    'otherCents','startDate','status','checked','questions']))return false;
  return typeof value.id==='string'&&/^[a-z0-9-]{5,80}$/.test(value.id)&&
    validLabel(value.label,60)&&validMoney(value.rentCents)&&value.rentCents>0&&
    validMoney(value.serviceCents)&&validMoney(value.utilitiesCents)&&
    validMoney(value.depositCents)&&validMoney(value.otherCents)&&
    validDate(value.startDate)&&typeof value.status==='string'&&
    Object.hasOwn(statuses,value.status)&&
    validQuestions(value.questions)&&
    Array.isArray(value.checked)&&value.checked.length<=checklist.length&&
    value.checked.every((id:unknown)=>typeof id==='string'&&ids.has(id))&&
    new Set(value.checked).size===value.checked.length;
};
const decodeBackup=(raw:string):Offer[]=>{
  if(raw.length>MAX_FILE)throw Error('size');
  const data:unknown=JSON.parse(raw);
  if(!object(data)||!hasKeys(data,['kind','version','offers'])||
    data.kind!==KIND||data.version!==1||!Array.isArray(data.offers)||
    data.offers.length>MAX_OFFERS||!data.offers.every(validOffer))throw Error('format');
  const rows=data.offers as Offer[];
  if(new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('duplicates');
  return rows.map(row=>({...row,checked:[...row.checked]}));
};
const totals=(row:Offer)=>{
  const monthly=row.rentCents+row.serviceCents+row.utilitiesCents;
  return {
    monthly,
    initial:monthly+row.depositCents+row.otherCents,
    // Deposit is refundable in principle; separate upfront cash from 12-month spending.
    firstYear:monthly*12+row.otherCents
  };
};
let nextLocalId=0;
function generateId(){
  nextLocalId++;
  return 'offer-'+Date.now().toString(36)+'-'+nextLocalId.toString(36);
}
function saveDownload(filename:string,content:string){
  const url=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));
  try{
    const link=document.createElement('a');
    link.href=url;link.download=filename;
    document.body.appendChild(link);link.click();link.remove();
  }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
}

export default function PrivateOfferDesk(){
  const [offers,setOffers]=useState<Offer[]>([]);
  const [draft,setDraft]=useState<Draft>(newDraft);
  const [editing,setEditing]=useState<string|null>(null);
  const [selected,setSelected]=useState<string|null>(null);
  const [budget,setBudget]=useState('');
  const [notice,setNotice]=useState('');
  const [exportPreview,setExportPreview]=useState<string|null>(null);
  const [pendingImport,setPendingImport]=useState<Offer[]|null>(null);
  const [undoImport,setUndoImport]=useState<Offer[]|null>(null);
  const [pendingDelete,setPendingDelete]=useState<string|null>(null);
  const [confirmClear,setConfirmClear]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const ranked=useMemo(()=>[...offers].sort((a,b)=>
    totals(a).monthly-totals(b).monthly||a.label.localeCompare(b.label,'nl')), [offers]);
  const chosen=offers.find(o=>o.id===selected)??null;
  const budgetCents=budget?integerMoney(budget):null;
  const edit=(key:keyof Draft,value:string)=>{
    setDraft(prev=>({...prev,[key]:value}));
    setExportPreview(null);
    setNotice('');
  };
  const resetDraft=()=>{setDraft(newDraft());setEditing(null);};
  const resetTransient=()=>{
    setPendingImport(null);setUndoImport(null);setExportPreview(null);
    setPendingDelete(null);setConfirmClear(false);
  };
  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const rent=integerMoney(draft.rent);
    const service=integerMoney(draft.service);
    const utilities=integerMoney(draft.utilities);
    const deposit=integerMoney(draft.deposit);
    const other=integerMoney(draft.other);
    if(!validLabel(draft.label.trim(),60)||rent===null||rent<=0||
      [service,utilities,deposit,other].some(v=>v===null)||
      !validDate(draft.startDate)||!validQuestions(draft.questions)){
      setNotice('Controleer het label, echte datum en bedragen (0 tot € 50.000, maximaal 2 decimalen). Kale huur moet hoger dan nul zijn.');
      return;
    }
    if(!editing&&offers.length>=MAX_OFFERS){
      setNotice('Er passen maximaal vijf eigen voorstellen in dit overzicht.');return;
    }
    const current=offers.find(o=>o.id===editing);
    const item:Offer={
      id:current?.id??generateId(),label:draft.label.trim(),rentCents:rent,
      serviceCents:service!,utilitiesCents:utilities!,depositCents:deposit!,
      otherCents:other!,startDate:draft.startDate,status:draft.status,
      checked:current?.checked??[],questions:draft.questions
    };
    const updated=editing?offers.map(o=>o.id===editing?item:o):[...offers,item];
    setOffers(updated);
    if(!selected||editing===selected)setSelected(item.id);
    resetDraft();resetTransient();
    setNotice(editing?'Eigen voorstel aangepast.':'Eigen voorstel toegevoegd; niets is verstuurd.');
  }
  function startEdit(row:Offer){
    setDraft({
      label:row.label,rent:moneyText(row.rentCents),service:moneyText(row.serviceCents),
      utilities:moneyText(row.utilitiesCents),deposit:moneyText(row.depositCents),
      other:moneyText(row.otherCents),startDate:row.startDate,
      status:row.status,questions:row.questions
    });
    setEditing(row.id);resetTransient();setNotice('Je bewerkt de ingevoerde bedragen; nog niets aangepast.');
  }
  function changeRow(id:string,patch:Partial<Offer>){
    setOffers(items=>items.map(row=>row.id===id?{...row,...patch}:row));
    resetTransient();
    setNotice('Persoonlijke notitie bijgewerkt, zonder externe actie.');
  }
  function remove(id:string){
    setOffers(rows=>rows.filter(row=>row.id!==id));
    if(selected===id)setSelected(null);
    if(editing===id)resetDraft();
    resetTransient();setNotice('Alleen dit eigen voorstel uit het tabblad verwijderd.');
  }
  const data:Backup={kind:KIND,version:1,offers};
  const serialized=JSON.stringify(data,null,2);
  async function readFile(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    event.target.value='';
    setPendingImport(null);setExportPreview(null);setNotice('');
    if(!file)return;
    try{
      if(!file.size||file.size>MAX_FILE)throw Error('size');
      const rows=decodeBackup(await file.text());
      setPendingImport(rows);
      setNotice('Bestand gecontroleerd. Je huidige voorstellen zijn nog niet gewijzigd.');
    }catch{
      setNotice('Import geweigerd: ongeldig of te groot privé-bestand. Huidige voorstellen behouden.');
    }
  }
  function restore(rows:Offer[],withUndo:boolean){
    if(withUndo)setUndoImport(offers.map(row=>({...row,checked:[...row.checked]})));
    else setUndoImport(null);
    setOffers(rows.map(row=>({...row,checked:[...row.checked]})));
    setPendingImport(null);setExportPreview(null);setPendingDelete(null);
    setConfirmClear(false);setSelected(null);resetDraft();
    setNotice('Privévoorstellen vervangen. Er is niets extern verstuurd.');
  }
  return <section id="private-offer-desk-heading" className={'panel '+styles.desk}
    aria-labelledby="offer-desk-heading">
    <header className={styles.header}>
      <p className="eyebrow">HUURVOORSTELLEN · EIGEN VERGELIJKING</p>
      <h2 id="offer-desk-heading">Welk huurvoorstel kan ik dragen?</h2>
      <p>Leg maximaal vijf <strong>zelf overgetypte, niet-geverifieerde</strong> voorstellen naast elkaar.
        Vergelijk totale maandlasten, benodigd startgeld en vragen vóór een eigen besluit.
        Een aanbieding opschrijven accepteert geen woning en verstuurt geen reactie.</p>
      <div className={styles.links}>
        <a href="#housing-shortlist-heading">Woningen vergelijken</a>
        <a href="#private-budget-title">Woonbudget</a>
        <a href="#private-document-readiness-heading">Documenten</a>
      </div>
    </header>

    <div className={styles.sections}>
      <div className={styles.column}>
        <h3>{editing?'Eigen voorstel bewerken':'Eigen voorstel toevoegen'} <small>({offers.length}/{MAX_OFFERS})</small></h3>
        <form onSubmit={submit} className={styles.form}>
          <label>Neutraal eigen label <span>(geen adres nodig)</span>
            <input value={draft.label} maxLength={60} placeholder="Bijv. woning A"
              onChange={e=>edit('label',e.target.value)} required/></label>
          <div className={styles.two}>
            <label>Kale huur per maand (€)
              <input inputMode="decimal" value={draft.rent} onChange={e=>edit('rent',e.target.value)}
                placeholder="900,00" required/></label>
            <label>Servicekosten (€)
              <input inputMode="decimal" value={draft.service} onChange={e=>edit('service',e.target.value)}/></label>
            <label>Eigen schatting energie/internet (€)
              <input inputMode="decimal" value={draft.utilities} onChange={e=>edit('utilities',e.target.value)}/></label>
            <label>Borgsom (€)
              <input inputMode="decimal" value={draft.deposit} onChange={e=>edit('deposit',e.target.value)}/></label>
            <label>Overige eenmalige kosten (€)
              <input inputMode="decimal" value={draft.other} onChange={e=>edit('other',e.target.value)}/></label>
            <label>Zelf verwachte startdatum
              <input type="date" value={draft.startDate} onChange={e=>edit('startDate',e.target.value)}/></label>
          </div>
          <label>Eigen status
            <select value={draft.status} onChange={e=>edit('status',e.target.value)}>
              {Object.entries(statuses).map(([value,label])=>
                <option key={value} value={value}>{label}</option>)}
            </select></label>
          <label>Open vragen voor verhuurder of corporatie <span>(max. 400 tekens)</span>
            <textarea value={draft.questions} maxLength={400} rows={3}
              placeholder="Bijv. wat valt precies onder de servicekosten?"
              onChange={e=>edit('questions',e.target.value)}/></label>
          <div className={styles.buttons}>
            <button type="submit">{editing?'Bewaar wijzigingen':'Voeg eigen voorstel toe'}</button>
            {editing&&<button type="button" onClick={()=>{resetDraft();setNotice('Wijziging geannuleerd.');}}>Annuleren</button>}
          </div>
        </form>
      </div>

      <div className={styles.column}>
        <h3>Vergelijking <small>alleen mijn eigen invoer</small></h3>
        <label className={styles.budget}>Mijn eigen maandgrens (€)
          <input inputMode="decimal" value={budget} placeholder="Bijv. 1300,00"
            onChange={e=>setBudget(e.target.value)} />
        </label>
        {budget!==''&&budgetCents===null&&<p role="status">Voer een bedrag in van € 0 tot € 50.000.</p>}
        {!ranked.length?<p>Voeg links je eerste voorstel toe om de maandlasten te vergelijken.</p>:
        <ol className={styles.ranking}>{ranked.map(row=>{
          const result=totals(row);
          const checked=row.checked.length;
          const below=budgetCents===null?null:result.monthly<=budgetCents;
          return <li key={row.id}>
            <div className={styles.rowhead}><strong>{row.label}</strong><b>{euro(result.monthly)}/mnd</b></div>
            <p>{statuses[row.status]} · {checked}/{checklist.length} zelf nagekeken</p>
            <p>Startgeld inclusief borg: <strong>{euro(result.initial)}</strong></p>
            {below!==null&&<p className={below?styles.ok:styles.warn}>
              {below?'Binnen eigen maandgrens':'Boven eigen maandgrens'}
              {' · '}{euro(Math.abs(budgetCents!-result.monthly))} verschil
            </p>}
            <button type="button" onClick={()=>setSelected(row.id)}
              aria-pressed={chosen?.id===row.id}>Bekijk voorstel en checklist</button>
          </li>;
        })}</ol>}
      </div>
    </div>

    {chosen&&<section className={styles.details} aria-label={'Eigen voorstel '+chosen.label}>
      <div className={styles.rowhead}>
        <h3>Mijn vragen en aandachtspunten · {chosen.label}</h3>
        <button type="button" onClick={()=>startEdit(chosen)}>Bewerk voorstel</button>
      </div>
      <dl className={styles.summary}>
        <div><dt>Maandlasten incl. geschatte energie</dt><dd>{euro(totals(chosen).monthly)}</dd></div>
        <div><dt>Benodigd startgeld incl. eerste maand en borg</dt><dd>{euro(totals(chosen).initial)}</dd></div>
        <div><dt>Eerste 12 maanden, exclusief terugbetaalbare borg</dt><dd>{euro(totals(chosen).firstYear)}</dd></div>
        <div><dt>Eigen verwachte startdatum</dt><dd>{chosen.startDate||'Onbekend'}</dd></div>
      </dl>
      <p><strong>Zelf afgevinkt:</strong> {chosen.checked.length}/{checklist.length}.
        Dit is geen juridische toets, betaalbaarheidsverklaring of officiële toelating.</p>
      <ul className={styles.checks}>{checklist.map(item=><li key={item.id}>
        <label><input type="checkbox" checked={chosen.checked.includes(item.id)}
          onChange={e=>changeRow(chosen.id,{checked:e.target.checked?
            [...chosen.checked,item.id]:chosen.checked.filter(id=>id!==item.id)})}/>
          {item.name}</label>
      </li>)}</ul>
      <p><strong>Eigen open vragen:</strong> {chosen.questions||'Nog niet ingevuld.'}</p>
      {pendingDelete===chosen.id?<div className={styles.warnbox}>
        <p>Dit verwijdert uitsluitend deze eigen notitie uit dit tabblad.</p>
        <button type="button" onClick={()=>remove(chosen.id)}>Ja, verwijder dit voorstel</button>
        <button type="button" onClick={()=>setPendingDelete(null)}>Annuleer</button>
      </div>:<button type="button" onClick={()=>setPendingDelete(chosen.id)}>Verwijder eigen voorstel…</button>}
    </section>}

    <details className={styles.portable}>
      <summary>Mijn privévoorstellen zelf bewaren, terugzetten of wissen</summary>
      <p>Geen account-, WoningNet-, cookie-, API- of browseropslag. Alles blijft standaard uitsluitend
        in dit tabblad. Alleen na je eigen bevestiging wordt een JSON-bestand gedownload. Een gekozen
        bestandsprovider kan het buiten deze app synchroniseren.</p>
      <div className={styles.buttons}>
        <button type="button" onClick={()=>{setExportPreview(serialized);setPendingImport(null);}}>
          Bekijk exacte JSON-back-up</button>
        <button type="button" onClick={()=>{setConfirmClear(true);setPendingImport(null);}}>
          Wis alle eigen voorstellen…</button>
      </div>
      {exportPreview!==null&&<div>
        <p>Controleer alle velden voor je het bestand opslaat; labels en vragen zijn persoonlijk.</p>
        <pre className={styles.preview}>{exportPreview}</pre>
        <button type="button" disabled={serialized!==exportPreview}
          onClick={()=>{saveDownload('woonpoints-huurvoorstellen.json',exportPreview);setExportPreview(null);
            setNotice('Privébestand aan jouw browser aangeboden.');}}>Download deze gecontroleerde JSON</button>
        <button type="button" onClick={()=>setExportPreview(null)}>Annuleer export</button>
      </div>}
      <label htmlFor="woonpoints-offer-import" className={styles.importLabel}>
        Kies eigen huurvoorstellenbestand (max. 16 KiB)
      </label>
      <input id="woonpoints-offer-import" ref={fileRef} type="file" accept=".json,application/json"
        onChange={readFile} />
      {pendingImport&&<div className={styles.warnbox}>
        <p>Bestand bevat <strong>{pendingImport.length} eigen voorstellen</strong>.
          Na jouw bevestiging vervangt dit alle {offers.length} huidige voorstellen
          en hun vinkjes/vragen. Het bestand wordt nergens heen verstuurd.</p>
        <ul>{pendingImport.map(row=><li key={row.id}>
          {row.label}: {euro(totals(row).monthly)}/mnd
        </li>)}</ul>
        <button type="button" onClick={()=>restore(pendingImport,true)}>Ja, vervang alle voorstellen</button>
        <button type="button" onClick={()=>setPendingImport(null)}>Behoud mijn huidige gegevens</button>
      </div>}
      {undoImport&&<button type="button" onClick={()=>restore(undoImport,false)}>
        Draai deze import éénmaal terug</button>}
      {confirmClear&&<div className={styles.warnbox}>
        <p>Weet je zeker dat je alle {offers.length} eigen voorstellen wilt wissen?
          Bewaarde bestanden worden hiermee niet verwijderd.</p>
        <button type="button" onClick={()=>{setOffers([]);setSelected(null);resetDraft();resetTransient();
          setNotice('Alle eigen voorstellen uit dit tabblad gewist.');}}>Ja, wis alles</button>
        <button type="button" onClick={()=>setConfirmClear(false)}>Annuleren</button>
      </div>}
    </details>
    <p className={styles.footnote}>Schattingsmodel: maandlasten = kale huur + servicekosten + eigen energie/internet.
      Startgeld = eerste maand + borg + eenmalige kosten. Eerste 12 maanden = 12 × maandlasten +
      overige eenmalige kosten; borg is hier apart gehouden omdat terugbetaling mogelijk is.
      Dubbele huur, indexatie, gemeentelijke lasten, verzekeringen, verhuizing en fiscale regels
      zijn niet meegerekend. Raadpleeg de oorspronkelijke aanbieder voordat je besluit.</p>
    {notice&&<p role="status" aria-live="polite" className={styles.notice}>{notice}</p>}
  </section>;
}
