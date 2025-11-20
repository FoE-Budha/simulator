
import React, { useState, useEffect } from 'react';
import Palette from './components/Palette';
import Grid from './components/Grid';
import Inspector from './components/Inspector';
import { uuid } from './utils';

const DEFAULT_PALETTE = [
  { id: 't1_house', name:'T1 House', w:1, h:1, POPULATION:10, DEMAND:10, PROD_10H:0 },
  { id: 't1_culture', name:'T1 Church', w:1, h:1, EUPHORIA:20 },
  { id: 'town_hall', name:'Town Hall', w:3, h:2, PROD_10H:5000, CHRONO_ALLOY:50 },
  { id: 'chrono_gen', name:'Chrono Producer', w:2, h:2, CHRONO_ALLOY:120, PROD_10H:120 },
  { id: 'goods', name:'Goods Building', w:2, h:2, GOODS_X:100 }
];

function computeTotals(buildings){
  let POPULATION=0, DEMAND=0, EUPHORIA=0, CHRONO_ALLOY=0, GOODS_X=0;
  buildings.forEach(b=>{
    POPULATION += b.POPULATION||0;
    DEMAND += b.DEMAND||0;
    EUPHORIA += b.EUPHORIA||0;
    CHRONO_ALLOY += b.CHRONO_ALLOY||0;
    GOODS_X += b.GOODS_X||0;
  });
  const ratio = DEMAND>0 ? Math.round((EUPHORIA/DEMAND)*100) : 100;
  let multiplier=1;
  if(ratio<=20) multiplier=0.2;
  else if(ratio<=60) multiplier=0.6;
  else if(ratio<=80) multiplier=0.8;
  else if(ratio<=120) multiplier=1;
  else if(ratio<=140) multiplier=1.1;
  else if(ratio<=199) multiplier=1.2;
  else multiplier=1.5;
  return {
    POPULATION, DEMAND, EUPHORIA, ratio, multiplier,
    CHRONO_ALLOY: Math.round(CHRONO_ALLOY*multiplier),
    GOODS_X: Math.round(GOODS_X*multiplier)
  };
}

export default function App(){
  const [width,setWidth] = useState(12);
  const [height,setHeight] = useState(20);
  const [palette,setPalette] = useState(DEFAULT_PALETTE);
  const [selected,setSelected] = useState(null);
  const [buildings,setBuildings] = useState([]);
  const [snapshots,setSnapshots] = useState([]);
  const [lastSnapshotCompare,setLastSnapshotCompare] = useState(null);

  useEffect(()=>{
    // preload example: town hall center
    if(buildings.length===0){
      const th = {...palette.find(p=>p.id==='town_hall'), id:uuid(), x:4, y:1};
      setBuildings([th]);
    }
  },[]);

  const handleSelect = (p)=> setSelected(p);
  const handlePlace = (inst) => {
    setBuildings(prev=>[...prev, inst]);
  };
  const handleRemove = (id) => {
    setBuildings(prev=>prev.filter(b=>b.id!==id));
  };

  const totals = computeTotals(buildings);

  const handleCreate = ()=>{
    const name = prompt('New building name (short):');
    if(!name) return;
    const w = parseInt(prompt('Width (cells):','1')||'1',10);
    const h = parseInt(prompt('Height (cells):','1')||'1',10);
    const POPULATION = parseInt(prompt('POPULATION (0 if none):','0')||'0',10);
    const DEMAND = parseInt(prompt('DEMAND (0 if none):','0')||'0',10);
    const EUPHORIA = parseInt(prompt('EUPHORIA (0 if none):','0')||'0',10);
    const CHRONO_ALLOY = parseInt(prompt('CHRONO_ALLOY (0 if none):','0')||'0',10);
    const GOODS_X = parseInt(prompt('GOODS_X (0 if none):','0')||'0',10);
    const id = name.replace(/\s+/g,'_').toLowerCase() + '_' + Date.now();
    const p = { id, name, w, h, POPULATION, DEMAND, EUPHORIA, CHRONO_ALLOY, GOODS_X };
    setPalette(prev=>[...prev, p]);
    setSelected(p);
  };

  const handleSnapshot = ()=>{
    const name = prompt('Snapshot name:','snap_'+(snapshots.length+1));
    const s = { id:uuid(), name, buildings: JSON.parse(JSON.stringify(buildings)), totals: computeTotals(buildings) };
    setSnapshots(prev=>[...prev, s]);
    alert('Snapshot captured');
  };

  const handleCompare = (s)=>{
    // compare current totals to snapshot totals
    const cur = computeTotals(buildings);
    setLastSnapshotCompare({current:cur, snap:s.totals, name:s.name});
    alert('Compared snapshot: ' + s.name);
  };

  const handleExport = ()=>{
    const data = { width,height,buildings,palette };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'foe_layout.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e)=>{
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=> {
      try{
        const data = JSON.parse(reader.result);
        setWidth(data.width||12);
        setHeight(data.height||20);
        setBuildings(data.buildings||[]);
        setPalette(data.palette||DEFAULT_PALETTE);
        alert('Imported layout');
      }catch(err){
        alert('Invalid file');
      }
    };
    reader.readAsText(f);
  };

  const handleUndo = ()=>{
    // simplistic undo: restore last snapshot if exists
    if(snapshots.length===0){ alert('No snapshots to undo to'); return; }
    const last = snapshots[snapshots.length-1];
    setBuildings(last.buildings);
    setSnapshots(prev=>prev.slice(0,prev.length-1));
    alert('Reverted to snapshot: ' + last.name);
  };

  return (
    <div className='app'>
      <div className='sidebar'>
        <div className='header'>FOE Settlement Simulator</div>
        <Palette palette={palette} onSelect={handleSelect} onCreate={handleCreate} />
        <div style={{marginTop:12}}>
          <strong>Selected:</strong>
          <div style={{marginTop:6}}>{selected?selected.name:'(none)'}</div>
        </div>

        <div style={{marginTop:12}}>
          <strong>Grid</strong>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            <input className='input' value={width} onChange={e=>setWidth(Math.max(4,parseInt(e.target.value||'12')))} />
            <input className='input' value={height} onChange={e=>setHeight(Math.max(4,parseInt(e.target.value||'20')))} />
          </div>
        </div>

        <div style={{marginTop:12}}>
          <Inspector totals={totals} selected={selected} onSnapshot={handleSnapshot} snapshots={snapshots} onCompare={handleCompare} />
        </div>

        <div style={{marginTop:12}}>
          <div style={{display:'flex',gap:8}}>
            <button className='button' onClick={handleExport}>Export JSON</button>
            <label className='button small' style={{cursor:'pointer',padding:'8px'}}>
              Import
              <input type='file' accept='application/json' style={{display:'none'}} onChange={handleImport} />
            </label>
          </div>
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button className='button small' onClick={handleUndo}>Undo (last snapshot)</button>
          </div>
        </div>

        <div className='footer'>
          Built for personal use. Place buildings by selecting a palette item then clicking a cell. Click a building to remove it.
        </div>
      </div>

      <div style={{flex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div><strong>Map</strong></div>
          <div style={{display:'flex',gap:8}}>
            <button className='button small' onClick={()=>{
              // quick-fill with houses
              if(!confirm('Fill map with T1 houses?')) return;
              const list = [];
              for(let y=0;y<height;y++){
                for(let x=0;x<width;x++){
                  // avoid overlap by one-cell houses
                  list.push({...palette.find(p=>p.id==='t1_house'), id:uuid(), x, y});
                }
              }
              setBuildings(list);
            }}>Fill with Houses</button>
            <button className='button small' onClick={()=>{
              if(!confirm('Clear all buildings?')) return;
              setBuildings([]);
            }}>Clear</button>
          </div>
        </div>

        <Grid width={width} height={height} cellSize={32} buildings={buildings} onPlace={handlePlace} selected={selected} onRemove={handleRemove} />
        {lastSnapshotCompare && (
          <div style={{marginTop:12,background:'rgba(255,255,255,0.02)',padding:8,borderRadius:6}}>
            <strong>Last Comparison — {lastSnapshotCompare.name}</strong>
            <div style={{display:'flex',gap:12,marginTop:8}}>
              <div>
                <div><strong>Current</strong></div>
                <div>Alloy: {lastSnapshotCompare.current.CHRONO_ALLOY}</div>
                <div>Goods: {lastSnapshotCompare.current.GOODS_X}</div>
              </div>
              <div>
                <div><strong>Snapshot</strong></div>
                <div>Alloy: {lastSnapshotCompare.snap.CHRONO_ALLOY}</div>
                <div>Goods: {lastSnapshotCompare.snap.GOODS_X}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
