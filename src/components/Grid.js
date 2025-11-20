
import React, { useRef } from 'react';
import { uuid } from '../utils';

function rectsOverlap(a,b){
  return !(a.x+a.w <= b.x || b.x+b.w <= a.x || a.y+a.h <= b.y || b.y+b.h <= a.y);
}

export default function Grid({width,height,cellSize, buildings, onPlace, selected, onRemove, onMove}) {
  const ref = useRef();

  const handleCellClick = (gx,gy) => {
    if(selected){
      // create instance based on selected
      const inst = {
        ...selected,
        id: uuid(),
        x: gx,
        y: gy
      };
      // overlap prevention: check if area free
      const area = {x:gx,y:gy,w:selected.w,h:selected.h};
      for(const b of buildings){
        if(rectsOverlap(area,b)){
          alert('Overlap detected — cannot place here.');
          return;
        }
      }
      onPlace(inst);
    }
  };

  const gridStyle = { width: width*cellSize + 'px', background:'rgba(255,255,255,0.02)', padding:8, borderRadius:6 };

  return (
    <div className='map' style={{width:'100%'}}>
      <div style={gridStyle}>
        {/* grid cells */}
        <div style={{position:'relative', width: width*cellSize, height: height*cellSize}}>
          {[...Array(height)].map((_,y)=>(
            <div key={y} style={{display:'flex'}}>
              {[...Array(width)].map((_,x)=>(
                <div key={x} className='cell' onClick={()=>handleCellClick(x,y)} />
              ))}
            </div>
          ))}
          {/* buildings */}
          {buildings.map(b=>(
            <div key={b.id} style={{
              position:'absolute',
              left: b.x*cellSize,
              top: b.y*cellSize,
              width: b.w*cellSize,
              height: b.h*cellSize,
              background: 'linear-gradient(180deg,#9ae6b4,#68d391)',
              border:'1px solid rgba(0,0,0,0.4)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              cursor:'pointer'
            }} onClick={()=>onRemove(b.id)}>
              <div style={{textAlign:'center',fontSize:12,color:'#012414'}}>{b.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
