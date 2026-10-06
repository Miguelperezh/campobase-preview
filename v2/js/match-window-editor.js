import {plannedMinutes,describeMoment} from './match-moments.js';
import {validateWindowPlan,insertWindowBoundary,changeWindowPlayer,configurePlayerIntervals,playerIntervals,recommendedPlayerIntervals} from './match-window-plan.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const minutes=value=>Number(Number(value).toFixed(3)).toLocaleString('es-ES');
export function openMatchWindowEditor({moments,players,availableIds,keeperIds,duration,targets=[],opponent='',recommend,onApply,selectedPlayerId=''}) {
  document.getElementById('cbx-window-dialog')?.close();
  let draft=structuredClone(moments),mode='player',selectedMinute=0,error='',history=[];
  validateWindowPlan(draft,availableIds,duration);
  const roster=availableIds.map(id=>players.find(p=>p.id===id)).filter(Boolean);
  const playerName=id=>{const player=roster.find(p=>p.id===id);return player?`${player.number||'—'} · ${player.name}`:'Jugador';};
  let playerId=(availableIds.includes(selectedPlayerId)?selectedPlayerId:'') || draft[0].team.find(s=>s.pos!=='Portero')?.playerId || availableIds[0];
  let reliefId='',intervals=[],pairSource,target=0,block=5;
  const dialog=document.createElement('dialog');dialog.id='cbx-window-dialog';dialog.className='cbx-window-dialog';dialog.dataset.themeView='preparacion';
  dialog.innerHTML=`<header class="dialog-head"><div><h2>Ventanas de cambios</h2><p>${esc(opponent)} · ${duration} minutos</p></div><button type="button" data-window-close aria-label="Cerrar sin aplicar">✕</button></header><div class="cbx-window-body"></div><footer class="cbx-window-actions"><p>Es un borrador. Después de aplicarlo, guarda la preparación.</p><div><button type="button" class="secondary" data-window-close>Cancelar</button><button type="button" class="primary" id="window-apply">Aplicar al borrador de Preparación</button></div></footer>`;
  document.body.append(dialog);
  const body=dialog.querySelector('.cbx-window-body');
  const options=(ids,value)=>ids.map(id=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(playerName(id))}</option>`).join('');
  function candidates() {
    const isKeeper=draft.some(m=>m.team.some(slot=>slot.playerId===playerId&&slot.pos==='Portero'));
    return availableIds.filter(id=>id!==playerId && (isKeeper?keeperIds.includes(id):!keeperIds.includes(id)) && draft.every(m=>!m.team.some(slot=>slot.playerId===playerId)||!m.team.some(slot=>slot.playerId===id)));
  }
  function choosePlayer(id) {
    playerId=id;pairSource=structuredClone(draft);intervals=playerIntervals(draft,playerId,duration);
    reliefId=candidates()[0]||'';target=targets.find(t=>t.playerId===playerId)?.minutes ?? (plannedMinutes(draft,duration)[playerId]||0);error='';
  }
  function setDraft(next) { validateWindowPlan(next,availableIds,duration);history.push(structuredClone(draft));draft=next;error=''; }
  function previewPair() {
    try {setDraft(configurePlayerIntervals({moments:pairSource,playerId,reliefId,intervals,availableIds,duration}));}
    catch(e){error=e.message;}
  }
  function totalsHtml() {
    const totals=plannedMinutes(draft,duration);
    return `<aside class="cbx-window-totals"><h3>Minutos que suma cada uno</h3><p>Se cuentan todas las entradas, sin duplicar intervalos.</p>${roster.map(p=>`<div class="cbx-window-total ${p.id===playerId?'is-selected':''}" data-window-total="${esc(p.id)}"><span>${esc(playerName(p.id))}</span><strong>${minutes(totals[p.id]||0)} min</strong></div>`).join('')}</aside>`;
  }
  function pairHtml() {
    const total=intervals.reduce((sum,s)=>sum+Math.max(0,Number(s.to)-Number(s.from)),0);
    return `<section><h3>¿Cuándo juega este jugador?</h3><p>Indica solo sus tramos de juego. Fuera de ellos entra su relevo. Puede salir y volver a entrar cuantas veces quieras.</p><div class="cbx-window-fields"><label>Jugador<select id="window-player">${options(availableIds,playerId)}</select></label><label>Cuando descanse, le sustituye<select id="window-relief"><option value="">Elige un relevo</option>${options(candidates(),reliefId)}</select></label></div>${!reliefId?'<p class="meta">Si todos coinciden con él en campo, usa «Ventanas completas» para recolocarlos antes.</p>':''}<div class="cbx-player-intervals">${intervals.map((s,i)=>`<div class="cbx-player-interval" data-interval-index="${i}"><b>${i+1}.ª entrada</b><label>Entra en el minuto<input type="number" min="0" max="${duration}" step="0.001" data-interval-from="${i}" value="${s.from}"></label><label>Sale en el minuto<input type="number" min="0" max="${duration}" step="0.001" data-interval-to="${i}" value="${s.to}"></label><strong>${minutes(Math.max(0,s.to-s.from))} min</strong><button type="button" class="secondary" data-interval-remove="${i}" aria-label="Eliminar entrada ${i+1}">✕</button></div>`).join('')||'<p>No tiene tramos: descansa todo el partido.</p>'}</div><div class="button-row"><button type="button" class="primary" id="window-add-interval">+ Otra entrada</button><button type="button" class="secondary" id="window-clear-intervals">Vaciar tramos de este jugador</button></div><p class="cbx-window-player-sum">Sus entradas suman <strong>${minutes(total)} minutos</strong></p><fieldset class="cbx-window-recommend"><legend>Recomendar tramos para este jugador</legend><div class="cbx-window-fields"><label>Minutos objetivo<input id="window-target" type="number" min="0" max="${duration}" step="0.001" value="${target}"></label><label>Minutos por entrada<input id="window-block" type="number" min="1" max="${duration}" step="1" value="${block}"></label></div><button type="button" class="secondary" id="window-recommend-player">Recomendar sus entradas y descansos</button></fieldset></section>`;
  }
  function allHtml() {
    return `<section><h3>Configurar ventanas completas</h3><p>Crea los cortes que necesites. En cada ventana eliges todos los jugadores y sus puestos. Al elegir uno ya alineado, se intercambia de puesto.</p><div class="cbx-window-fields"><label>Desde el minuto<input id="window-from" type="number" min="0" max="${duration}" step="0.001" value="${selectedMinute}"></label><label>Hasta el minuto<input id="window-to" type="number" min="0" max="${duration}" step="0.001" value="${Math.min(duration,selectedMinute+5)}"></label></div><button type="button" class="primary" id="window-create">+ Crear esta ventana</button><div class="cbx-complete-windows">${draft.map((moment,index)=>{
      const end=draft[index+1]?.minute??duration;const changes=index?describeMoment(draft[index-1],moment):null;
      const lines=changes?[...changes.pairs.map(pair=>`Entra ${playerName(pair.inId)} por ${playerName(pair.outId)}`),...changes.moved.map(move=>`${playerName(move.playerId)} pasa a ${move.position}`)]:[];
      return `<details name="complete-windows" class="cbx-complete-window" data-window-minute="${moment.minute}" ${moment.minute===selectedMinute?'open':''}><summary><strong>${minutes(moment.minute)}′–${minutes(end)}′</strong><span>${minutes(end-moment.minute)} min · ${moment.formation}</span></summary><div class="cbx-window-lineup">${moment.team.map((slot,slotIndex)=>`<label>${esc(slot.pos)}<select data-window-index="${index}" data-window-slot="${slotIndex}">${options(availableIds,slot.playerId)}</select></label>`).join('')}</div>${lines.length?`<ul>${lines.map(line=>`<li>${esc(line)}</li>`).join('')}</ul>`:'<p>Sin relevos respecto a la ventana anterior.</p>'}${index?`<button type="button" class="secondary" data-window-remove="${index}">Unir con la ventana anterior</button>`:''}</details>`;
    }).join('')}</div></section>`;
  }
  function render() {
    body.innerHTML=`<div class="cbx-window-tabs" role="group" aria-label="Editar el plan"><button type="button" class="secondary" data-window-tab="player" aria-pressed="${mode==='player'}">Entradas de un jugador</button><button type="button" class="secondary" data-window-tab="all" aria-pressed="${mode==='all'}">Ventanas completas</button></div><div class="button-row"><button type="button" class="secondary" id="window-recommend-all">✨ Recomendar todo el partido</button><button type="button" class="secondary" id="window-undo" ${history.length?'':'disabled'}>↶ Deshacer último ajuste</button></div><p class="cbx-window-error" role="alert" ${error?'':'hidden'}>${esc(error)}</p><div class="cbx-window-layout">${mode==='player'?pairHtml():allHtml()}${totalsHtml()}</div>`;
    dialog.querySelector('#window-apply').disabled=!!error;
  }
  body.addEventListener('change',event=>{
    const el=event.target;
    if(el.id==='window-player'){choosePlayer(el.value);render();return;}
    if(el.id==='window-relief'){reliefId=el.value;previewPair();render();return;}
    if(el.id==='window-target'){target=Number(el.value);return;}
    if(el.id==='window-block'){block=Number(el.value);return;}
    if(el.dataset.intervalFrom!==undefined || el.dataset.intervalTo!==undefined){const index=Number(el.dataset.intervalFrom??el.dataset.intervalTo);intervals[index][el.dataset.intervalFrom!==undefined?'from':'to']=Number(el.value);previewPair();render();return;}
    if(el.dataset.windowSlot!==undefined){selectedMinute=draft[Number(el.dataset.windowIndex)].minute;try{setDraft(changeWindowPlayer(draft,Number(el.dataset.windowIndex),Number(el.dataset.windowSlot),el.value));}catch(e){error=e.message;}render();}
  });
  body.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    try {
      if(button.dataset.windowTab){mode=button.dataset.windowTab;error='';if(mode==='player')choosePlayer(playerId);render();return;}
      if(button.id==='window-add-interval'){const from=intervals.length?Math.max(...intervals.map(s=>Number(s.to)))+5:0;if(from>=duration)throw new Error('Acorta o modifica el último tramo antes de añadir otra entrada.');intervals.push({from,to:Math.min(duration,from+5)});previewPair();}
      if(button.id==='window-clear-intervals'){intervals=[];previewPair();}
      if(button.dataset.intervalRemove!==undefined){intervals.splice(Number(button.dataset.intervalRemove),1);previewPair();}
      if(button.id==='window-recommend-player'){target=Number(body.querySelector('#window-target').value);block=Number(body.querySelector('#window-block').value);intervals=recommendedPlayerIntervals(duration,target,block);previewPair();}
      if(button.id==='window-recommend-all'){setDraft(recommend(draft[0]));mode='all';selectedMinute=0;choosePlayer(playerId);}
      if(button.id==='window-undo' && history.length){draft=history.pop();choosePlayer(playerId);}
      if(button.id==='window-create'){
        const from=Number(body.querySelector('#window-from').value),to=Number(body.querySelector('#window-to').value);
        if(!Number.isFinite(from)||!Number.isFinite(to)||from<0||from>=to||to>duration)throw new Error(`Elige un inicio menor que el final, entre 0 y ${duration}.`);
        let next=structuredClone(draft);if(from>0)next=insertWindowBoundary(next,from,duration);if(to<duration)next=insertWindowBoundary(next,to,duration);setDraft(next);selectedMinute=from;
      }
      if(button.dataset.windowRemove!==undefined){const next=structuredClone(draft);next.splice(Number(button.dataset.windowRemove),1);setDraft(next);selectedMinute=next[Math.max(0,Number(button.dataset.windowRemove)-1)].minute;}
    }catch(e){error=e.message;}
    render();
  });
  dialog.addEventListener('click',event=>{if(event.target.closest('[data-window-close]'))dialog.close();});
  dialog.querySelector('#window-apply').onclick=()=>{try{validateWindowPlan(draft,availableIds,duration);onApply(structuredClone(draft));dialog.close();}catch(e){error=e.message;render();}};
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  choosePlayer(playerId);render();dialog.showModal();
}
