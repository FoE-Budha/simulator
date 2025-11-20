
import React from 'react';

export default function Inspector({totals, selected, onSnapshot, snapshots, onCompare}) {
  return (
    <div>
      <div style={{marginBottom:8}}><strong>Totals</strong></div>
      <div style={{fontSize:13,marginBottom:8}}>
        <div>POPULATION: {totals.POPULATION}</div>
        <div>DEMAND: {totals.DEMAND}</div>
        <div>EUPHORIA: {totals.EUPHORIA}</div>
        <div>Ratio: {totals.ratio}%</div>
        <div>Multiplier: {totals.multiplier}×</div>
        <div>Chrono Alloy (10h): {totals.CHRONO_ALLOY}</div>
        <div>Goods (10h): {totals.GOODS_X}</div>
      </div>

      <div style={{marginTop:8}}>
        <button className='button small' onClick={onSnapshot}>Capture Snapshot</button>
      </div>

      <div style={{marginTop:10}}>
        <strong>Snapshots</strong>
        {snapshots.length===0 && <div style={{color:'var(--muted)',fontSize:13}}>No snapshots</div>}
        {snapshots.map((s,idx)=>(
          <div key={s.id} style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}>
            <div style={{flex:1,fontSize:13}}>Snap {idx+1} — {s.name}</div>
            <button className='button small' onClick={()=>onCompare(s)}>Compare</button>
          </div>
        ))}
      </div>
    </div>
  );
}
