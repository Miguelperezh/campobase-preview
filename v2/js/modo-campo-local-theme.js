(() => {
  'use strict';

  const PRESETS = {
    default:{bg:'#071711',card:'#0e261d',nav:'rgba(10,31,23,.96)',input:'#091c15',text:'#f8fafc',border:'#1b4d3a'},
    dark:{bg:'#040806',card:'#0a140e',nav:'rgba(8,18,13,.96)',input:'#060e0a',text:'#f8fafc',border:'#153023'},
    'pitch-vivid':{bg:'#021e12',card:'#06331f',nav:'rgba(4,38,23,.96)',input:'#032516',text:'#f0fdf4',border:'#125435'},
    navy:{bg:'#061021',card:'#0c1b33',nav:'rgba(10,24,46,.96)',input:'#081427',text:'#f8fafc',border:'#183359'},
    ocean:{bg:'#03141f',card:'#072436',nav:'rgba(5,27,41,.96)',input:'#041c2b',text:'#f0f9ff',border:'#0e4161'},
    charcoal:{bg:'#0f1113',card:'#181b1e',nav:'rgba(19,22,25,.96)',input:'#121417',text:'#f8fafc',border:'#282d33'},
    steel:{bg:'#171d24',card:'#222a34',nav:'rgba(28,36,46,.96)',input:'#1a222a',text:'#f8fafc',border:'#33404f'},
    burgundy:{bg:'#170408',card:'#260810',nav:'rgba(29,6,12,.96)',input:'#1d050a',text:'#fff1f2',border:'#45101d'},
    purple:{bg:'#110722',card:'#1d0e38',nav:'rgba(23,10,44,.96)',input:'#16092b',text:'#faf5ff',border:'#381c6b'},
    light:{bg:'#ffffff',card:'#ffffff',nav:'rgba(255,255,255,.96)',input:'#f8fafc',text:'#0f172a',border:'#e2e8f0'},
    warm:{bg:'#f6f3eb',card:'#ffffff',nav:'rgba(246,243,235,.96)',input:'#fbf9f4',text:'#292524',border:'#e5dfd3'},
    sepia:{bg:'#eee6d8',card:'#faf6ee',nav:'rgba(238,230,216,.96)',input:'#f4ede1',text:'#2d241e',border:'#d7cbb6'},
    'high-vis':{bg:'#000000',card:'#080808',nav:'rgba(0,0,0,.98)',input:'#000000',text:'#ffffff',border:'#facc15'},
  };
  const SCALES={compact:'14.5px',normal:'16px',large:'19.2px',xlarge:'22.4px',huge:'25.6px',enormous:'28.8px',ultra:'32px'};
  const FAMILIES={
    system:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sport:'"Barlow Condensed", "Oswald", "DIN Alternate", "Impact", -apple-system, sans-serif',
    readable:'"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    modern:'"Outfit", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    technical:'"JetBrains Mono", "SF Mono", "Menlo", "Monaco", "Consolas", monospace',
    classic:'"Merriweather", "Charter", "Georgia", "Cambria", "Times New Roman", serif',
  };
  const TEXT={'dark-slate':'#0f172a','pure-black':'#000000','high-contrast':'#000000',navy:'#0a1c36','pure-white':'#ffffff'};
  const WEIGHTS={normal:'400',semibold:'600',bold:'700',extrabold:'800','ultra-bold':'900'};

  function contrast(hex){const c=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(c))return'#fff';const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);return((r*299+g*587+b*114)/1000)>=135?'#0f172a':'#fff'}
  function apply(){
    let theme=null;
    try{theme=JSON.parse(localStorage.getItem('campobase.theme')||'null')}catch{}
    if(!theme||typeof theme!=='object')return;
    const preset=PRESETS[theme.themeBg]||PRESETS.default;
    const accent=theme.accentColor||'#10b981';
    const color=theme.fontColor||TEXT[theme.textColor]||preset.text;
    const root=document.documentElement;
    root.style.setProperty('--field-bg',preset.bg);root.style.setProperty('--field-card',preset.card);root.style.setProperty('--field-nav',preset.nav);root.style.setProperty('--field-input',preset.input);root.style.setProperty('--field-text',color);root.style.setProperty('--field-border',preset.border);root.style.setProperty('--field-accent',accent);root.style.setProperty('--field-accent-text',contrast(accent));root.style.setProperty('--field-font-family',FAMILIES[theme.fontFamily]||FAMILIES.system);root.style.setProperty('--field-font-weight',WEIGHTS[theme.fontWeight]||'700');root.style.fontSize=SCALES[theme.fontScale]||'16px';
    const meta=document.getElementById('campo-theme-color');if(meta)meta.content=accent;
  }
  window.addEventListener('storage',(event)=>{if(event.key==='campobase.theme')apply()});
  window.addEventListener('pageshow',apply);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();