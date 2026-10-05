// An HTML overlay cannot appear over an open native dialog. Temporarily leave
// the session dialog, retaining its DOM, scroll and expanded exercise.
export function suspendSessionDetail(doc = document) {
  const dialog=doc.querySelector('#session-detail-dialog');
  if(!dialog?.open) return ()=>{};
  const scroll=dialog.scrollTop;
  const focus=doc.activeElement;
  dialog.close();
  let restored=false;
  return ()=>{
    if(restored||!dialog.isConnected)return;restored=true;
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=scroll;
    if(focus?.isConnected)focus.focus({preventScroll:true});
  };
}
