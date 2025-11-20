
import React from 'react';

export default function Palette({ palette, onSelect, onCreate }) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <strong>Building Palette</strong>
        <button className='button small' onClick={onCreate}>New</button>
      </div>
      {palette.map((p)=>(
        <div key={p.id} className='palette-item' onClick={()=>onSelect(p)}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <div>{p.name}</div>
            <div style={{opacity:0.8,fontSize:12}}>{p.w}x{p.h}</div>
          </div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>
            {p.POPULATION?`POP:${p.POPULATION} `:''}
            {p.DEMAND?`DEM:${p.DEMAND} `:''}
            {p.EUPHORIA?`EUP:${p.EUPHORIA} `:''}
            {p.CHRONO_ALLOY?`ALY:${p.CHRONO_ALLOY} `:''}
            {p.GOODS_X?`GDS:${p.GOODS_X}`:''}
          </div>
        </div>
      ))}
    </div>
  );
}
