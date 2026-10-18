'use client';

import { useCallback, useState, type ReactNode } from 'react';
import ManualMonthProgress from './manual-month-progress';
import { ManualPositionsWorkspace, type PrivateJournalCountOffer } from './position-stats';

/**
 * No global event, cross-tab persistence or account bridge.
 * The only shared context is an explicitly proposed private aggregate.
 */
export default function PrivateReactionWorkflow({children}:{children:ReactNode}) {
  const [offer,setOffer]=useState<PrivateJournalCountOffer|null>(null);
  const propose=useCallback((value:PrivateJournalCountOffer|null)=>setOffer(value),[]);
  const decide=useCallback(()=>setOffer(null),[]);
  return <>
    <ManualMonthProgress journalOffer={offer} onJournalDecision={decide} />
    {children}
    <ManualPositionsWorkspace onMonthCountOffer={propose}/>
  </>;
}
