'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';

/**
 * Private comparison of user-entered rental scenarios. These values are not
 * official quotes, affordability decisions or WoningNet evidence.
 * No backend, storage, network or permission side effect.
 */
type AmountKey = 'rent'|'service'|'utilities'|'commute'|'moving'|'deposit';
type RentalScenario = { id:string; title:string } & Record<AmountKey,string>;
type Result = {
  scenario:RentalScenario; month:number; annualCost:number;
  firstMonthCash:number; firstYearCash:number; reservedDeposit:number;
  monthlyMargin:number;
};
const prices:ReadonlyArray<{key:AmountKey;label:string;hint:string}> = [
  {key:'rent',label:'Kale maandhuur',hint:'Per maand'},
  {key:'service',label:'Servicekosten',hint:'Per maand'},
  {key:'utilities',label:'Energie, water en internet',hint:'Geschat per maand'},
  {key:'commute',label:'Reiskosten',hint:'Geschat per maand'},
  {key:'moving',label:'Eenmalige verhuiskosten',hint:'Geen maandbedrag'},
  {key:'deposit',label:'Te reserveren borg',hint:'Tijdelijk vaststaand geld'}
];
const euro = new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'});
const newScenario=(id:string,title:string):RentalScenario=>({
  id,title,rent:'',service:'0',utilities:'0',commute:'0',moving:'0',deposit:'0'
});
const initial=()=>[newScenario('a','Woning A'),newScenario('b','Woning B')];
type RentalBackup={scenarios:RentalScenario[];budget:string};
const PRIVATE_BACKUP_KIND='woonpoints-rental-scenarios';
const BACKUP_LIMIT=8192;
const exactKeys=(value:Record<string,unknown>,expected:string[])=>
  Object.keys(value).sort().join(',')===expected.slice().sort().join(',');
function decodeRentalBackup(raw:string):RentalBackup|null{
  if(raw.length<16||raw.length>BACKUP_LIMIT)return null;
  try{
    const data:unknown=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    const doc=data as Record<string,unknown>;
    // Accept only the canonical, app-exported JSON encoding. This additionally
    // refuses repeated JSON keys, invisible extra whitespace and alternatives.
    if(JSON.stringify(doc)!==raw||!exactKeys(doc,['kind','version','budget','scenarios'])||
       doc.kind!==PRIVATE_BACKUP_KIND||doc.version!==1||typeof doc.budget!=='string'||
       !Array.isArray(doc.scenarios)||!([2,3].includes(doc.scenarios.length)))return null;
    if(doc.budget!==''&&cents(doc.budget)===null)return null;
    const ids=['a','b','c'];
    const restored:RentalScenario[]=[];
    for(let i=0;i<doc.scenarios.length;i++){
      const row=doc.scenarios[i];
      if(!row||typeof row!=='object'||Array.isArray(row))return null;
      const r=row as Record<string,unknown>;
      if(!exactKeys(r,['id','title','rent','service','utilities','commute','moving','deposit'])||
         r.id!==ids[i]||typeof r.title!=='string'||!r.title.trim()||r.title.length>40||
         /[\u0000-\u001f\u007f]/u.test(r.title))return null;
      if(prices.some(p=>typeof r[p.key]!=='string'||(r[p.key]!==''&&cents(r[p.key] as string)===null)))return null;
      restored.push({...r} as RentalScenario);
    }
    return {scenarios:restored,budget:doc.budget};
  }catch{return null;}
}
function encodeRentalBackup(scenarios:RentalScenario[],budget:string):string{
  return JSON.stringify({kind:PRIVATE_BACKUP_KIND,version:1,budget,scenarios});
}
const valuePattern=/^(?:[0-9]{1,5})(?:[.,][0-9]{0,2})?$/;

/** Parse only short decimal euro inputs; compute exclusively with integer cents. */
function cents(value:string):number|null{
  if(!valuePattern.test(value)||/[.,]$/.test(value))return null;
  const [euros,part='']=value.replace(',','.').split('.');
  const amount=Number(euros)*100+Number(part.padEnd(2,'0'));
  return Number.isSafeInteger(amount)&&amount<=5_000_000?amount:null;
}
function makeResults(scenarios:RentalScenario[],budget:string):Result[]|null{
  const limit=cents(budget);
  if(limit===null||scenarios.some(s=>!s.title.trim()||s.title.length>40))return null;
  const results:Result[]=[];
  for(const scenario of scenarios){
    const values=prices.map(p=>cents(scenario[p.key]));
    if(values.some(v=>v===null))return null;
    const [rent,service,utilities,commute,moving,deposit]=values as number[];
    const month=rent+service+utilities+commute;
    results.push({
      scenario,month,annualCost:12*month+moving,
      firstMonthCash:month+moving+deposit,
      firstYearCash:12*month+moving+deposit,
      reservedDeposit:deposit,monthlyMargin:limit-month
    });
  }
  return results;
}
function reportText(results:Result[],monthlyBudget:number):string{
  const lines=[
    'WOONPOINTS · MIJN PRIVE HUURSCENARIOS',
    'Alle bedragen zelf ingevuld en niet onafhankelijk geverifieerd.',
    'Geen huuradvies, wettelijke betaalbaarheidscheck of officieel woningaanbod.',
    'Maandbudget: '+euro.format(monthlyBudget/100),'',
  ];
  for(const {scenario,month,annualCost,firstMonthCash,firstYearCash,reservedDeposit,monthlyMargin} of results){
    lines.push(scenario.title.trim(),
      'Maandlasten (incl. eigen schattingen): '+euro.format(month/100),
      'Maandbudgetruimte (+) / overschrijding (-): '+euro.format(monthlyMargin/100),
      'Eerste maand inclusief eigen verhuiskosten en borg: '+euro.format(firstMonthCash/100),
      'Twaalf maanden + verhuiskosten, exclusief terug te vragen borg: '+euro.format(annualCost/100),
      'Geld apart gehouden voor borg: '+euro.format(reservedDeposit/100),
      'Eerstejaars kasbehoefte inclusief gereserveerde borg: '+euro.format(firstYearCash/100),'');
  }
  lines.push('Let op: geen inflatie, belastingen, toeslagen, borgteruggave, inkomenseisen of',
    'variabele energieprijzen berekend. Werkelijke lasten kunnen afwijken.',
    'Door jou bewust gedownload; lokale/cloudgesynchroniseerde bestandslocaties',
    'vallen buiten Woonpoints. Browserinvoer wordt niet door de app opgeslagen.');
  return lines.join('\n')+'\n';
}

type RentalSourceProposal={
  label:string;rentCents:number;serviceCents:number;
  utilitiesCents:number;depositCents:number
};
export default function PrivateRentalScenarioBudget({
  proposal,onProposalHandled
}:{
  proposal?:RentalSourceProposal|null;onProposalHandled?:()=>void
}={}){
  const [scenarios,setScenarios]=useState<RentalScenario[]>(initial);
  const [budget,setBudget]=useState('');
  const [preview,setPreview]=useState<{fingerprint:string;text:string}|null>(null);
  const [backupPreview,setBackupPreview]=useState<{fingerprint:string;text:string}|null>(null);
  const [incoming,setIncoming]=useState<{data:RentalBackup;raw:string}|null>(null);
  const [undo,setUndo]=useState<RentalBackup|null>(null);
  const fileGeneration=useRef(0);
  const [clearRequested,setClearRequested]=useState(false);
  const [status,setStatus]=useState('');
  const fingerprint=JSON.stringify([scenarios,budget]);
  const results=useMemo(()=>makeResults(scenarios,budget),[scenarios,budget]);
  const monthlyBudget=cents(budget);
  function invalidateEdits(){
    fileGeneration.current++;
    setPreview(null);setBackupPreview(null);setIncoming(null);setUndo(null);
    setClearRequested(false);setStatus('');
  }
  function updateScenario(id:string,field:AmountKey|'title',raw:string){
    if(field==='title'){
      if(raw.length>40||/[\u0000-\u001f\u007f]/u.test(raw))return;
    }else if(raw!==''&&(!valuePattern.test(raw)||raw.length>9))return;
    setScenarios(items=>items.map(row=>row.id===id?{...row,[field]:raw}:row));
    invalidateEdits();
  }
  function updateBudget(raw:string){
    if(raw!==''&&(!valuePattern.test(raw)||raw.length>9))return;
    setBudget(raw);invalidateEdits();
  }
  function applyOfferProposal(){
    if(!proposal)return;
    const money=[proposal.rentCents,proposal.serviceCents,proposal.utilitiesCents,proposal.depositCents];
    if(money.some(value=>!Number.isSafeInteger(value)||value<0||value>5_000_000)||
      typeof proposal.label!=='string'||!proposal.label.trim())return;
    const format=(value:number)=>(value/100).toFixed(2);
    setScenarios(items=>items.map(row=>row.id==='a'?{
      ...newScenario('a',proposal.label.trim().slice(0,40)),
      rent:format(proposal.rentCents),
      service:format(proposal.serviceCents),
      utilities:format(proposal.utilitiesCents),
      deposit:format(proposal.depositCents)
    }:row));
    invalidateEdits();setStatus('Eigen huurvoorstel na jouw bevestiging overgenomen in woning A; reis- en verhuiskosten blijven op 0 om zelf in te vullen.');
    onProposalHandled?.();
  }
  function openPreview(){
    if(!results||monthlyBudget===null)return;
    setPreview({fingerprint,text:reportText(results,monthlyBudget)});
    setStatus('Lees de hele tekst en kies pas daarna bewust voor downloaden.');
  }
  async function loadBackup(event:ChangeEvent<HTMLInputElement>){
    const file=event.currentTarget.files?.[0];
    if(!file)return;
    const ticket=++fileGeneration.current;
    setIncoming(null);setUndo(null);setBackupPreview(null);setPreview(null);
    try{
      if(file.size<16||file.size>BACKUP_LIMIT)throw Error('too large');
      const raw=await file.text();
      if(ticket!==fileGeneration.current)return;
      const data=decodeRentalBackup(raw);
      if(!data)throw Error('format');
      setIncoming({data,raw});
      setStatus('Controleer de volledige eigen JSON hieronder. Niets is vervangen.');
    }catch{
      if(ticket===fileGeneration.current)setStatus('Privé-herstel geweigerd: bestand te groot of geen exacte Woonpoints-versie 1 back-up.');
    }finally{event.currentTarget.value='';}
  }
  function applyImport(){
    if(!incoming)return;
    fileGeneration.current++;
    setUndo({scenarios:scenarios.map(x=>({...x})),budget});
    setScenarios(incoming.data.scenarios.map(x=>({...x})));
    setBudget(incoming.data.budget);
    setIncoming(null);setPreview(null);setBackupPreview(null);
    setStatus('Eigen back-up in dit tabblad hersteld. Je kunt dit eenmaal ongedaan maken.');
  }
  function restorePrevious(){
    if(!undo)return;
    fileGeneration.current++;
    setScenarios(undo.scenarios.map(x=>({...x})));setBudget(undo.budget);
    setUndo(null);setPreview(null);setBackupPreview(null);
    setStatus('Je vorige tabbladinvoer is hersteld.');
  }
  function previewBackup(){
    const text=encodeRentalBackup(scenarios,budget);
    if(text.length>BACKUP_LIMIT||!decodeRentalBackup(text)){
      setBackupPreview(null);
      setStatus('Back-up niet gereed: maak bedragen en woonlabels compleet, zonder halve decimalen.');
      return;
    }
    setBackupPreview({fingerprint,text});
    setPreview(null);setStatus('Bekijk de volledige privé-JSON en kies daarna zelf voor downloaden.');
  }
  function downloadFile(filename:string,text:string,type:string){
    const url=URL.createObjectURL(new Blob([text],{type}));
    try{
      const link=document.createElement('a');
      link.href=url;link.download=filename;
      document.body.appendChild(link);link.click();link.remove();
      setStatus('Privébestand aangeboden aan de browser; Woonpoints heeft niets verzonden.');
    }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }
  function download(){
    if(!preview||preview.fingerprint!==fingerprint)return;
    downloadFile('woonpoints-mijn-huurscenarios.txt',preview.text,'text/plain;charset=utf-8');
  }
  return <section className="panel private-rental-budget" aria-labelledby="rental-scenarios-heading">
    <div className="private-rental-budget-full">
      <p className="eyebrow">EIGEN KEUZES · ALLEEN DIT TABBLAD</p>
      <h2 id="rental-scenarios-heading">Wat kost verhuizen naar woning A, B of C?</h2>
      <p>Vergelijk je eigen maandlasten, eenmalige verhuiskosten en het geld dat je voor borg moet reserveren. De borg is <strong>geen berekende uitgave</strong>, maar wel geld dat je voorlopig beschikbaar moet hebben. Alle bedragen zijn eigen schattingen, niet gecontroleerde aanbiedingen of een oordeel over betaalbaarheid.</p>
      {proposal&&<div className="private-rental-budget-preview">
        <h3>Eigen huurvoorstel overnemen? Eerst controleren</h3>
        <p>Dit voorstel komt uit je lokale tabblad **Huurvoorstellen**, niet van WoningNet.
          Bij bevestiging wordt alleen woning A vervangen; jouw woning B/C en maandgrens blijven staan.
          Zelf ingevoerde reis- en verhuiskosten voor A worden op 0 gezet.</p>
        <dl>
          <dt>Eigen label</dt><dd>{proposal.label.slice(0,40)}</dd>
          <dt>Kale huur</dt><dd>{euro.format(proposal.rentCents/100)}</dd>
          <dt>Servicekosten</dt><dd>{euro.format(proposal.serviceCents/100)}</dd>
          <dt>Energie en overige lasten</dt><dd>{euro.format(proposal.utilitiesCents/100)}</dd>
          <dt>Borg (gereserveerd, geen jaaruitgave)</dt><dd>{euro.format(proposal.depositCents/100)}</dd>
        </dl>
        <button type="button" onClick={applyOfferProposal}>Ja, vervang woning A met dit eigen voorstel</button>
        <button type="button" onClick={onProposalHandled}>Nee, behoud mijn scenario's</button>
      </div>}
      <label className="private-rental-budget-label" htmlFor="rental-monthly-budget">
        Mijn eigen maandgrens in euro
        <input id="rental-monthly-budget" value={budget} onChange={e=>updateBudget(e.target.value)}
          placeholder="Bijvoorbeeld 1250" inputMode="decimal" autoComplete="off" maxLength={9}/>
      </label>
      <div className="private-rental-budget-grid">
        {scenarios.map(row=><fieldset key={row.id} className="private-rental-budget-card">
          <legend>{row.id==='a'?'Woning A':row.id==='b'?'Woning B':'Woning C'}</legend>
          <label className="private-rental-budget-label">Mijn korte label
            <input value={row.title} maxLength={40} onChange={e=>updateScenario(row.id,'title',e.target.value)}
              autoComplete="off" aria-label={'Zelfgekozen label '+row.id}/>
          </label>
          {prices.map(p=><label className="private-rental-budget-label" key={p.key}>
            {p.label}<small>{p.hint}</small>
            <input inputMode="decimal" autoComplete="off" maxLength={9}
              placeholder="EUR" value={row[p.key]} onChange={e=>updateScenario(row.id,p.key,e.target.value)}
              aria-label={p.label+' van '+row.title}/>
          </label>)}
          {row.id==='c'&&<button type="button" onClick={()=>{
            setScenarios(items=>items.filter(s=>s.id!=='c'));invalidateEdits();
          }}>Verwijder woning C</button>}
        </fieldset>)}
      </div>
      {scenarios.length<3&&<button type="button" onClick={()=>{
        setScenarios(items=>[...items,newScenario('c','Woning C')]);invalidateEdits();
      }}>+ Vergelijk ook woning C</button>}
      <h3>Jouw rekenoverzicht</h3>
      {!results?<p role="status">Vul een maandgrens en voor elke woning een geldige kale huur in. Je kunt andere kosten bewust op 0 laten staan. Maximaal € 50.000 per invoerveld.</p>:
        <div className="private-rental-budget-scroll">
          <table>
            <caption>Handmatige scenariovergelijking; geen automatische broncontrole</caption>
            <thead><tr><th scope="col">Eigen woning</th><th scope="col">Per maand</th>
              <th scope="col">Ruimte t.o.v. maandgrens</th><th scope="col">Eerste maand incl. borg</th>
              <th scope="col">12 maanden + verhuizing</th><th scope="col">Borg apart</th>
              <th scope="col">Eerstejaars kasbehoefte incl. borg</th></tr></thead>
            <tbody>{results.map(r=><tr key={r.scenario.id}>
              <th scope="row">{r.scenario.title}</th>
              <td>{euro.format(r.month/100)}</td>
              <td>{euro.format(r.monthlyMargin/100)} {r.monthlyMargin<0?'(boven eigen grens)':''}</td>
              <td>{euro.format(r.firstMonthCash/100)}</td>
              <td>{euro.format(r.annualCost/100)}</td>
              <td>{euro.format(r.reservedDeposit/100)}</td>
              <td>{euro.format(r.firstYearCash/100)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      <p>De berekening neemt iedere maand dezelfde bedragen aan. Geen huurtoeslag, inflatie, borgteruggave, jaarlijkse wijzigingen, regelgeving of toekomstige energieprijzen meegerekend.</p>
      <div className="private-rental-budget-actions">
        <button type="button" disabled={!results} onClick={openPreview}>Bekijk mijn privé-TXT vóór downloaden</button>
        <button type="button" onClick={()=>{setClearRequested(true);setPreview(null);setBackupPreview(null);}}>Wis alle eigen scenario's…</button>
      </div>
      {clearRequested&&<div role="group" aria-label="Scenario's wissen">
        <p>Alle ingevulde scenario's en de maandgrens uit dit tabblad wissen?</p>
        <button type="button" onClick={()=>{
          fileGeneration.current++;setScenarios(initial());setBudget('');
          setPreview(null);setBackupPreview(null);setIncoming(null);setUndo(null);
          setClearRequested(false);setStatus('Invoer uit dit tabblad gewist.');
        }}>Ja, wis mijn invoer</button>{' '}
        <button type="button" onClick={()=>setClearRequested(false)}>Behoud mijn invoer</button>
      </div>}
      {preview?.fingerprint===fingerprint&&<div className="private-rental-budget-preview">
        <h3>Controleer de complete tekst</h3>
        <pre>{preview.text}</pre>
        <button type="button" onClick={download}>Download precies deze privé-TXT</button>
      </div>}
      <div className="private-rental-budget-transfer">
        <h3>Mijn eigen invoer tijdelijk meenemen</h3>
        <p>Bewaar desgewenst je huidige 2–3 scenario's en budget als privé-JSON.
          Een geïmporteerd bestand wordt pas overgenomen na een aparte, zichtbare bevestiging.
          Zonder eigen download blijft alles in dit tabblad.</p>
        <button type="button" onClick={previewBackup}>Bekijk mijn JSON vóór bewaren</button>
        {backupPreview?.fingerprint===fingerprint&&<div className="private-rental-budget-preview">
          <p>Deze JSON bevat alle zelfgekozen labels en geldbedragen. Controleer het bestand vóór download.</p>
          <pre>{backupPreview.text}</pre>
          <button type="button" onClick={()=>downloadFile('woonpoints-prive-huurscenarios.json',backupPreview.text,'application/json;charset=utf-8')}>
            Download precies deze privé-JSON</button>
        </div>}
        <label className="private-rental-budget-label">Open een eerdere eigen Woonpoints-JSON (maximaal 8 KiB)
          <input type="file" accept=".json,application/json" onChange={loadBackup} />
        </label>
        {incoming&&<div className="private-rental-budget-preview">
          <p>Vervangen is nog niet uitgevoerd. Je huidige scenario's blijven intact tot je bevestigt.
            Nieuw budget: {incoming.data.budget||'niet ingevuld'}; woningen:
            {' '}{incoming.data.scenarios.map(x=>x.title).join(' · ')}.</p>
          <pre>{incoming.raw}</pre>
          <button type="button" onClick={applyImport}>Ja, vervang mijn scenario's door deze back-up</button>
          <button type="button" onClick={()=>{setIncoming(null);setStatus('Import geannuleerd; eigen invoer behouden.');}}>
            Behoud mijn huidige invoer</button>
        </div>}
        {undo&&<button type="button" onClick={restorePrevious}>Herstel mijn vorige tabbladinvoer</button>}
      </div>
      {status&&<p role="status" aria-live="polite">{status}</p>}
      <p><small>Er is geen serveropslag, browseropslag, cookie, upload, API-verzoek of WoningNet-reactie. Sluiten van dit tabblad wist de ingevulde scenario's; zelf gedownloade bestanden blijven onder jouw beheer.</small></p>
    </div>
  </section>;
}
