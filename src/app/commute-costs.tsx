'use client';

import { useState } from 'react';

type TravelMode = 'auto' | 'ov' | 'fiets';
type Scenario = {
  rent: string;
  housingExtras: string;
  weeklyTrips: string;
  workingWeeks: string;
  oneWayMinutes: string;
  mode: TravelMode;
  returnKm: string;
  carEuroKm: string;
  parkingEuro: string;
  ticketEuro: string;
  bikeEuro: string;
  employerEuro: string;
};
type FieldName = Exclude<keyof Scenario, 'mode'>;
const defaults: Record<'A'|'B', Scenario> = {
  A: {rent:'950',housingExtras:'175',weeklyTrips:'3',workingWeeks:'46',
    oneWayMinutes:'50',mode:'auto',returnKm:'80',carEuroKm:'0.30',
    parkingEuro:'0',ticketEuro:'0',bikeEuro:'0',employerEuro:'0'},
  B: {rent:'1100',housingExtras:'175',weeklyTrips:'3',workingWeeks:'46',
    oneWayMinutes:'25',mode:'auto',returnKm:'40',carEuroKm:'0.30',
    parkingEuro:'0',ticketEuro:'0',bikeEuro:'0',employerEuro:'0'}
};
const limits: Record<FieldName, [number,number]> = {
  rent:[0,10000], housingExtras:[0,5000], weeklyTrips:[0,7],
  workingWeeks:[0,53], oneWayMinutes:[0,300], returnKm:[0,1000],
  carEuroKm:[0,5], parkingEuro:[0,150], ticketEuro:[0,200],
  bikeEuro:[0,100], employerEuro:[0,300]
};
const intFields = new Set<FieldName>(['weeklyTrips','workingWeeks','oneWayMinutes']);
type Calculation = {
  days:number; grossPerTrip:number; netPerTrip:number;
  grossTravelYear:number; compensatedYear:number; travelYear:number;
  hoursYear:number; housingYear:number; combinedYear:number; combinedMonth:number;
};
function calculate(s: Scenario): Calculation | null {
  const values = {} as Record<FieldName, number>;
  for(const key of Object.keys(limits) as FieldName[]) {
    const raw = s[key].trim().replace(',', '.');
    if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(raw)) return null;
    const n = Number(raw);
    const [low,high] = limits[key];
    if(!Number.isFinite(n) || n < low || n > high ||
      (intFields.has(key) && !Number.isInteger(n))) return null;
    values[key] = n;
  }
  const days = values.weeklyTrips * values.workingWeeks;
  const gross = s.mode==='auto'
    ? values.returnKm * values.carEuroKm + values.parkingEuro
    : s.mode==='ov' ? values.ticketEuro : values.bikeEuro;
  // Employer help is an unverified personal estimate, not tax or payroll advice.
  const compensated = Math.min(gross,values.employerEuro);
  const net = Math.max(0,gross-compensated);
  const housingYear=(values.rent+values.housingExtras)*12;
  return {
    days, grossPerTrip:gross, netPerTrip:net,
    grossTravelYear:gross*days, compensatedYear:compensated*days,
    travelYear:net*days, hoursYear:days*values.oneWayMinutes*2/60,
    housingYear, combinedYear:housingYear+net*days,
    combinedMonth:(housingYear+net*days)/12
  };
}
const euro=(v:number)=>new Intl.NumberFormat('nl-NL',{
  style:'currency',currency:'EUR',maximumFractionDigits:2
}).format(v);
const number=(v:number)=>new Intl.NumberFormat('nl-NL',{
  maximumFractionDigits:1
}).format(v);

export default function PrivateCommuteComparison() {
  const [scenarios,setScenarios]=useState<Record<'A'|'B',Scenario>>({
    A:{...defaults.A}, B:{...defaults.B}
  });
  const [report,setReport]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  const a=calculate(scenarios.A), b=calculate(scenarios.B);
  const update=(side:'A'|'B', field:keyof Scenario,value:string)=>{
    setScenarios(prev=>({...prev,[side]:{...prev[side],[field]:value}}));
    setReport(null);setMessage('');
  };
  const fields: Array<[FieldName,string,string]> = [
    ['rent','Maandhuur (€)','1000'],
    ['housingExtras','Overige vaste woonkosten per maand (€)','175'],
    ['weeklyTrips','Reisdagen per week','3'],
    ['workingWeeks','Reisweken per jaar (eigen inschatting)','46'],
    ['oneWayMinutes','Enkele reistijd per reisdag (min)','45']
  ];
  function prepareReport(){
    if(!a||!b){setMessage('Corrigeer eerst beide scenario’s.');return;}
    const lines=[
      'WOONPOINTS · EIGEN WOON-WERKVERGELIJKING',
      'Alle bedragen en reistijden zijn zelf ingevulde aannames, geen extern gecontroleerde prijzen.',
      'Geen officiële WoningNet-reactie, belasting-, hypotheek-, salaris- of woonadvies.',
      '',
    ];
    for(const side of ['A','B'] as const){
      const s=scenarios[side], c=side==='A'?a:b;
      lines.push('WONING '+side,
        'Maandhuur: '+euro(Number(s.rent.replace(',','.'))),
        'Overige maandelijkse woonkosten: '+euro(Number(s.housingExtras.replace(',','.'))),
        'Vervoer: '+({auto:'Auto',ov:'Openbaar vervoer',fiets:'Fiets/lopen'} as const)[s.mode],
        'Werkelijk gekozen reisdagen x weken: '+s.weeklyTrips+' x '+s.workingWeeks+' = '+c.days,
        'Enkele reistijd: '+s.oneWayMinutes+' min',
        'Brutoreiskosten per reisdag: '+euro(c.grossPerTrip),
        'Zelf geraamde vergoeding, maximaal geraamde ritkosten: '+euro(c.compensatedYear/c.days || 0),
        'Netto eigen reiskosten per jaar: '+euro(c.travelYear),
        'Reistijd per jaar: '+number(c.hoursYear)+' uur',
        'Woonkosten per jaar: '+euro(c.housingYear),
        'Woonkosten plus eigen reizen per jaar: '+euro(c.combinedYear),
        '');
    }
    lines.push('JAARVERSCHIL (WONING B MIN A)',
      'Totale jaarlijkse eigen kosten: '+euro(b.combinedYear-a.combinedYear),
      'Reisuren per jaar: '+number(b.hoursYear-a.hoursYear),
      'Dit model rekent geen loonwaarde van tijd, subsidies of fiscale voordelen mee.',
      'Gebruikte werkdagen zijn handmatig gekozen en missen ziekte/feestdagen en variabele ritten.');
    setReport(lines.join('\n')+'\n');
    setMessage('Controleer de concepttekst. Pas na een tweede klik wordt een bestand aangeboden.');
  }
  function saveReport(){
    if(!report || !a || !b)return;
    const url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;
    link.download='woonpoints-eigen-woonwerkvergelijking.txt';link.rel='noopener';
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setReport(null);setMessage('Privé-TXT aangeboden. Je gekozen opslaglocatie kan synchroniseren.');
  }
  return <section className="panel" aria-labelledby="private-commute-heading">
    <div>
      <p className="eyebrow">EIGEN WOON-WERKAFWEGING · OFFLINE</p>
      <h2 id="private-commute-heading">Hoeveel kost reizen vanaf twee woningen?</h2>
      <p>Vergelijk woonkosten, zelf geschatte reiskosten en reisuren voor twee
        opties. Kies per woning auto, OV of fiets/lopen; geef jouw werkweken
        en reisdagen op. Dit is geen routeplanner: Woonpoints haalt geen
        tarieven, reistijden, adressen of werkgevergegevens op.</p>
      <p><strong>Let op:</strong> alle bedragen, reiskostenvergoedingen en
        dagen komen van jou. Dit model is geen belasting- of mobiliteitsadvies,
        bevat geen tijdwaardering en verandert geen bestaande woningselectie.</p>
    </div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
      {(['A','B'] as const).map(side=>{
        const s=scenarios[side],c=side==='A'?a:b;
        return <div key={side} style={{flex:'1 1 280px',minWidth:0}}>
          <h3>Woning {side}</h3>
          {fields.map(([key,label,hint])=><div key={key}>
            <label htmlFor={'commute-'+side+'-'+key}>{label}</label>
            <input id={'commute-'+side+'-'+key} type="text" inputMode="decimal"
              maxLength={10} placeholder={hint} value={s[key]}
              onChange={e=>update(side,key,e.target.value)} />
          </div>)}
          <label htmlFor={'commute-'+side+'-mode'}>Vervoer naar werk</label>
          <select id={'commute-'+side+'-mode'} value={s.mode}
            onChange={e=>update(side,'mode',e.target.value)}>
            <option value="auto">Auto</option>
            <option value="ov">Openbaar vervoer</option>
            <option value="fiets">Fiets of lopen</option>
          </select>
          {s.mode==='auto'&&<>
            <label htmlFor={'commute-'+side+'-returnKm'}>Kilometers heen + terug per dag</label>
            <input id={'commute-'+side+'-returnKm'} type="text" inputMode="decimal" maxLength={10}
              value={s.returnKm} onChange={e=>update(side,'returnKm',e.target.value)} />
            <label htmlFor={'commute-'+side+'-carEuroKm'}>Zelf geraamde totale autokosten per km (€)</label>
            <input id={'commute-'+side+'-carEuroKm'} type="text" inputMode="decimal" maxLength={10}
              value={s.carEuroKm} onChange={e=>update(side,'carEuroKm',e.target.value)} />
            <label htmlFor={'commute-'+side+'-parkingEuro'}>Parkeren/tol per reisdag (€)</label>
            <input id={'commute-'+side+'-parkingEuro'} type="text" inputMode="decimal" maxLength={10}
              value={s.parkingEuro} onChange={e=>update(side,'parkingEuro',e.target.value)} />
          </>}
          {s.mode==='ov'&&<>
            <label htmlFor={'commute-'+side+'-ticketEuro'}>Retour OV per reisdag (€)</label>
            <input id={'commute-'+side+'-ticketEuro'} type="text" inputMode="decimal" maxLength={10}
              value={s.ticketEuro} onChange={e=>update(side,'ticketEuro',e.target.value)} />
          </>}
          {s.mode==='fiets'&&<>
            <label htmlFor={'commute-'+side+'-bikeEuro'}>Eigen fiets-/loopkosten per reisdag (€)</label>
            <input id={'commute-'+side+'-bikeEuro'} type="text" inputMode="decimal" maxLength={10}
              value={s.bikeEuro} onChange={e=>update(side,'bikeEuro',e.target.value)} />
          </>}
          <label htmlFor={'commute-'+side+'-employerEuro'}>Zelf geraamde werkgeversvergoeding per reisdag (€)</label>
          <input id={'commute-'+side+'-employerEuro'} type="text" inputMode="decimal"
            maxLength={10} value={s.employerEuro}
            onChange={e=>update(side,'employerEuro',e.target.value)} />
          {!c?<p role="alert">Controleer de getallen: geen negatieve waarden,
            maximaal 7 reisdagen, 53 weken, 300 minuten en 10.000 euro huur.
            Geldbedragen mogen maximaal twee decimalen hebben.</p>:
            <dl>
              <div><dt>Eigen reisdagen per jaar</dt><dd>{c.days}</dd></div>
              <div><dt>Brutoreiskosten per jaar</dt><dd>{euro(c.grossTravelYear)}</dd></div>
              <div><dt>Vergoeding voor zover reiskosten gedekt</dt><dd>{euro(c.compensatedYear)}</dd></div>
              <div><dt>Eigen netto reiskosten per jaar</dt><dd>{euro(c.travelYear)}</dd></div>
              <div><dt>Reisuren per jaar</dt><dd>{number(c.hoursYear)}</dd></div>
              <div><dt>Woonkosten + reizen per maand (jaargemiddelde)</dt><dd>{euro(c.combinedMonth)}</dd></div>
            </dl>}
        </div>;
      })}
    </div>
    {a&&b&&<div aria-live="polite">
      <h3>Verschil: B ten opzichte van A</h3>
      <p><strong>{euro(b.combinedYear-a.combinedYear)}</strong> per jaar aan woonkosten
        plus eigen woon-werkverkeer. {number(b.hoursYear-a.hoursYear)} reisuren per jaar verschil.</p>
      <p>Een negatief kostenverschil betekent dat B in deze aannames goedkoper is;
        een negatief urenverschil betekent minder geschatte reistijd. De
        werkgeversvergoeding wordt nooit hoger afgetrokken dan de
        geraamde reiskosten per dag. Er is geen belastingberekening.</p>
    </div>}
    <div className="month-csv-confirm">
      <h3>Bewaar een eigen berekening</h3>
      <p>Maak optioneel een leesbaar TXT-concept van je eigen aannames en
        uitkomsten. Controleer dat eerst; downloaden vraagt een tweede klik.
        Er worden geen namen, adressen of accounts verwerkt.</p>
      <button type="button" onClick={prepareReport} disabled={!a||!b}>
        Toon privésamenvatting als concept…
      </button>
      {report!==null&&<div role="group" aria-label="Bevestig lokale reiskostenexport">
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{report}</pre>
        <button type="button" onClick={saveReport}>Ja, bewaar uitsluitend deze TXT…</button>
        <button type="button" className="secondary" onClick={()=>{
          setReport(null);setMessage('Export geannuleerd. Geen bestand gemaakt.');
        }}>Nee, behoud alleen schermgegevens</button>
      </div>}
    </div>
    <button type="button" className="secondary" onClick={()=>{
      setScenarios({A:{...defaults.A},B:{...defaults.B}});
      setReport(null);setMessage('Voorbeelden hersteld. Eventuele eigen invoer op dit scherm gewist.');
    }}>Wis eigen invoer en herstel voorbeelden</button>
    <p role="status">{message}</p>
    <p>Alles blijft tijdelijk in dit browsertabblad. Verversen of sluiten wist
      de invoer. Er is geen opslag, automatische notificatie, externe data of
      WoningNet-koppeling.</p>
  </section>;
}
