'use client';

import { useMemo, useState } from 'react';

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

export default function PrivateRentalScenarioBudget(){
  const [scenarios,setScenarios]=useState<RentalScenario[]>(initial);
  const [budget,setBudget]=useState('');
  const [preview,setPreview]=useState<{fingerprint:string;text:string}|null>(null);
  const [clearRequested,setClearRequested]=useState(false);
  const [status,setStatus]=useState('');
  const fingerprint=JSON.stringify([scenarios,budget]);
  const results=useMemo(()=>makeResults(scenarios,budget),[scenarios,budget]);
  const monthlyBudget=cents(budget);
  function updateScenario(id:string,field:AmountKey|'title',raw:string){
    if(field==='title'){
      if(raw.length>40||/[\u0000-\u001f\u007f]/u.test(raw))return;
    }else if(raw!==''&&(!valuePattern.test(raw)||raw.length>9))return;
    setScenarios(items=>items.map(row=>row.id===id?{...row,[field]:raw}:row));
    setPreview(null);setClearRequested(false);setStatus('');
  }
  function updateBudget(raw:string){
    if(raw!==''&&(!valuePattern.test(raw)||raw.length>9))return;
    setBudget(raw);setPreview(null);setClearRequested(false);setStatus('');
  }
  function openPreview(){
    if(!results||monthlyBudget===null)return;
    setPreview({fingerprint,text:reportText(results,monthlyBudget)});
    setStatus('Lees de hele tekst en kies pas daarna bewust voor downloaden.');
  }
  function download(){
    if(!preview||preview.fingerprint!==fingerprint)return;
    const url=URL.createObjectURL(new Blob([preview.text],{type:'text/plain;charset=utf-8'}));
    try{
      const link=document.createElement('a');
      link.href=url;link.download='woonpoints-mijn-huurscenarios.txt';
      document.body.appendChild(link);link.click();link.remove();
      setStatus('Privé-TXT aangeboden aan je browser. Geen gegevens verstuurd door Woonpoints.');
    }finally{
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  }
  return <section className="panel private-rental-budget" aria-labelledby="rental-scenarios-heading">
    <div className="private-rental-budget-full">
      <p className="eyebrow">EIGEN KEUZES · ALLEEN DIT TABBLAD</p>
      <h2 id="rental-scenarios-heading">Wat kost verhuizen naar woning A, B of C?</h2>
      <p>Vergelijk je eigen maandlasten, eenmalige verhuiskosten en het geld dat je voor borg moet reserveren. De borg is <strong>geen berekende uitgave</strong>, maar wel geld dat je voorlopig beschikbaar moet hebben. Alle bedragen zijn eigen schattingen, niet gecontroleerde aanbiedingen of een oordeel over betaalbaarheid.</p>
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
            setScenarios(items=>items.filter(s=>s.id!=='c'));setPreview(null);setStatus('');
          }}>Verwijder woning C</button>}
        </fieldset>)}
      </div>
      {scenarios.length<3&&<button type="button" onClick={()=>{
        setScenarios(items=>[...items,newScenario('c','Woning C')]);setPreview(null);setStatus('');
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
        <button type="button" onClick={()=>{setClearRequested(true);setPreview(null);}}>Wis alle eigen scenario's…</button>
      </div>
      {clearRequested&&<div role="group" aria-label="Scenario's wissen">
        <p>Alle ingevulde scenario's en de maandgrens uit dit tabblad wissen?</p>
        <button type="button" onClick={()=>{
          setScenarios(initial());setBudget('');setPreview(null);setClearRequested(false);setStatus('Invoer uit dit tabblad gewist.');
        }}>Ja, wis mijn invoer</button>{' '}
        <button type="button" onClick={()=>setClearRequested(false)}>Behoud mijn invoer</button>
      </div>}
      {preview?.fingerprint===fingerprint&&<div className="private-rental-budget-preview">
        <h3>Controleer de complete tekst</h3>
        <pre>{preview.text}</pre>
        <button type="button" onClick={download}>Download precies deze privé-TXT</button>
      </div>}
      {status&&<p role="status" aria-live="polite">{status}</p>}
      <p><small>Er is geen serveropslag, browseropslag, cookie, upload, API-verzoek of WoningNet-reactie. Sluiten van dit tabblad wist de ingevulde scenario's; zelf gedownloade bestanden blijven onder jouw beheer.</small></p>
    </div>
  </section>;
}
