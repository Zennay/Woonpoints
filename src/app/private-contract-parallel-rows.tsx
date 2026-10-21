'use client';

/**
 * Side-by-side source view for ONE exact line-diff group.
 * No inferred alignment or paragraph pairing: deletions and additions each
 * preserve their own native source order and line numbers.
 *
 * This component has no persistence, clipboard, fetch, export or approval path.
 */
type ChangeRow = {
  kind: 'same' | 'removed' | 'added';
  text: string;
  oldLine: number | null;
  newLine: number | null;
};

function SourceColumn({
  title, rows, side,
}: {
  title: string;
  rows: ChangeRow[];
  side: 'old' | 'new';
}) {
  return <section aria-label={title} style={{
    minWidth:0, background:side==='old' ? '#fff7f5' : '#f4fbf4',
    border:'1px solid #ccd6d0',borderRadius:8,padding:10,
  }}>
    <h5 style={{fontSize:15,margin:'0 0 10px'}}>{title} · {rows.length} regel(s)</h5>
    {rows.length===0 && <p style={{margin:0,fontSize:13}}>
      Geen {side==='old'?'verwijderde':'toegevoegde'} tekstregels in deze groep.
    </p>}
    <ol style={{listStyle:'none',margin:0,padding:0,display:'grid',gap:8}}>
      {rows.map((row,index)=><li key={index} style={{
        background:'#fff',border:'1px solid #dce4df',padding:'7px 9px',
        minWidth:0,overflowWrap:'anywhere'
      }}>
        <small style={{fontWeight:600}}>
          {side==='old'?'− Oud':'＋ Nieuw'} · bronregel {side==='old'?row.oldLine:row.newLine}
        </small>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',margin:'5px 0 0'}}>
          {row.text || '(lege regel)'}
        </pre>
      </li>)}
    </ol>
  </section>;
}

export function PrivateContractParallelRows({
  group, rows,
}: {
  group: number;
  rows: ChangeRow[];
}) {
  const removed=rows.filter(row=>row.kind==='removed');
  const added=rows.filter(row=>row.kind==='added');
  return <details style={{
    margin:'10px 0',padding:'10px 12px',
    border:'1px solid #b8cdbd',borderRadius:8,
  }}>
    <summary style={{cursor:'pointer',fontWeight:600}}>
      Vergelijk groep {group} in twee bronkolommen
    </summary>
    <p style={{fontSize:13,margin:'10px 0'}}>
      Links staan alle verwijderde regels in hun oorspronkelijke volgorde.
      Rechts staan alle toegevoegde regels in hun oorspronkelijke volgorde.
      Regels naast elkaar vormen <strong>geen</strong> automatische één-op-één-koppeling.
      Ontbrekende tekst blijft expliciet leeg; geen afspraken zijn geïnterpreteerd.
    </p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,250px),1fr))',gap:12}}>
      <SourceColumn title="Oudere contractversie" rows={removed} side="old"/>
      <SourceColumn title="Nieuwere contractversie" rows={added} side="new"/>
    </div>
    <p style={{margin:'10px 0 0',fontSize:12}}>
      Alleen lokale weergave. Er wordt niets gekopieerd, geëxporteerd of goedgekeurd.
      Controleer ook de volledige originele contracten en aangrenzende ongewijzigde regels.
    </p>
  </details>;
}
