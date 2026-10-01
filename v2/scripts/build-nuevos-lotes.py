import json, os, glob, unicodedata, re

def norm(s):
    return unicodedata.normalize('NFD', str(s)).encode('ascii', 'ignore').decode('utf-8').lower()

MATERIAL_ICONS = {
    'balón': '⚽', 'balon': '⚽', 'pelota': '⚽', 'pelota de tenis': '🎾',
    'cono': '🔺', 'conos': '🔺', 'semiesfera': '🟡', 'pivote': '🔺', 'seta': '🟡',
    'portería': '🥅', 'porteria': '🥅', 'miniportería': '🥅', 'miniporteria': '🥅',
    'valla': '🚧', 'pica': '📍', 'picas': '📍', 'peto': '🎽', 'petos': '🎽',
    'escalera': '🪜', 'aro': '⭕', 'cronómetro': '⏱️', 'cronometro': '⏱️',
    'pared': '🧱', 'marca': '▫️'
}

def get_icon(name):
    low = name.lower()
    for k, v in MATERIAL_ICONS.items():
        if k in low: return v
    return '📦'

ROLE_COLORS = {
    'A': '#2563EB', # Atacante: Azul
    'D': '#DC2626', # Defensa: Rojo
    'N': '#FACC15', # Neutro/Apoyo: Amarillo
    'P': '#111827', # Portero: Negro
    'E': '#CBD5E1', # Entrenador: Gris claro
}

def get_role_color(code, rol=''):
    c = code[0].upper() if code else 'A'
    if c in ROLE_COLORS:
        return ROLE_COLORS[c]
    r_norm = norm(rol)
    if 'porter' in r_norm or 'arquero' in r_norm: return ROLE_COLORS['P']
    if 'defens' in r_norm or 'oposic' in r_norm: return ROLE_COLORS['D']
    if 'comodin' in r_norm or 'apoyo' in r_norm or 'neutr' in r_norm: return ROLE_COLORS['N']
    if 'entren' in r_norm: return ROLE_COLORS['E']
    return ROLE_COLORS['A']

base_dir = '/Users/miguelperez/Documents/Codex/2026-09-09/files-mentioned-by-the-user-figuras/outputs/CampoBase_Documentos'
dirs_051 = sorted([d for d in glob.glob(os.path.join(base_dir, '051-100', '*')) if os.path.isdir(d)])
dirs_101 = sorted([d for d in glob.glob(os.path.join(base_dir, '101-150', '*')) if os.path.isdir(d)])

dirs_new_25 = [d for d in dirs_101 if int(os.path.basename(d)[:3]) >= 126]
dirs_prev_75 = dirs_051 + [d for d in dirs_101 if int(os.path.basename(d)[:3]) < 126]

# Los últimos 25 (126-150) van en la punta de arriba absoluta, seguidos de 051-125
all_dirs = dirs_new_25 + dirs_prev_75
assert len(all_dirs) == 100, f"Expected 100 folders, found {len(all_dirs)}"

exercises = []

for d in all_dirs:
    num_str = os.path.basename(d)[:3]
    f7_id = f'f7-{num_str}'
    data = json.load(open(os.path.join(d, 'data.json')))
    
    nombre = data.get('nombre', '').strip()
    tit_fuente = data.get('titulo_explicito_en_fuente') or 'EJERCICIO'
    cat_princ = (data.get('clasificacion') or {}).get('categoria_principal') or 'Técnico-táctico'
    subcat = (data.get('clasificacion') or {}).get('subcategoria')
    
    cat_edad = norm(data.get('categoria_edad_fuente') or '')
    formato_app = norm((data.get('clasificacion') or {}).get('formato_aplicacion') or '')
    tags = list((data.get('clasificacion') or {}).get('etiquetas') or [])
    tags_norm = [norm(t) for t in tags]
    
    # Format classification rule
    is_alevin = 'alevin' in cat_edad or any('alevin' in t for t in tags_norm)
    is_f8 = 'futbol 8' in formato_app or any('futbol 8' in t for t in tags_norm)
    is_f7_spec = ('futbol 7' in formato_app and 'general' not in formato_app) or 'futbol 7' in norm(nombre)
    is_benjamin = 'benjamin' in cat_edad or any('benjamin' in t for t in tags_norm)
    is_f11_spec = ('futbol 11' in formato_app and 'general' not in formato_app) or '8x8' in norm(nombre)
    
    if is_f11_spec:
        formato_juego = 'futbol_11'
        formatos_juego = ['futbol_11']
        format_val = 'F11'
    elif is_f7_spec or is_alevin or is_f8 or is_benjamin:
        formato_juego = 'futbol_7'
        formatos_juego = ['futbol_7']
        format_val = 'F7'
    else:
        formato_juego = 'todos'
        formatos_juego = ['futbol_7', 'futbol_11']
        format_val = 'F7'
    
    que_se_trabaja = list((data.get('clasificacion') or {}).get('contenidos_trabajados') or data.get('que_se_trabaja') or [])
    
    obj_gen = (data.get('objetivos') or {}).get('general')
    if isinstance(obj_gen, list) and obj_gen:
        obj_principal = obj_gen[0]
    elif isinstance(obj_gen, str) and obj_gen.strip():
        obj_principal = obj_gen.strip()
    else:
        obj_busca = data.get('que_se_busca') or []
        obj_principal = obj_busca[0] if obj_busca else nombre
        
    obj_secundarios = list((data.get('objetivos') or {}).get('tecnicos') or []) + list((data.get('objetivos') or {}).get('tacticos') or [])
    
    # Organization and roles
    org = data.get('organizacion') or {}
    num_jugadores = org.get('numero_jugadores') or org.get('jugadores_activos') or 12
    
    raw_roles = data.get('roles') or []
    mapped_roles = []
    porteros = 0
    entrenadores = 0
    for r in raw_roles:
        r_id = r.get('id', 'A1')
        r_rol = r.get('rol', 'atacante')
        r_col = get_role_color(r_id, r_rol)
        r_func = r.get('funcion') or r_rol
        r_grp = r.get('grupo') or r_rol
        mapped_roles.append({
            "id": r_id,
            "rol": r_rol,
            "color": r_col,
            "funcion": r_func,
            "posicion": r.get('posicion'),
            "grupo": r_grp
        })
        if r_id.upper().startswith('P') or 'porter' in norm(r_rol):
            porteros += 1
        if r_id.upper().startswith('E') or 'entren' in norm(r_rol):
            entrenadores += 1
            
    oposicion = org.get('oposicion')
    if not oposicion:
        has_def = any('defens' in norm(r.get('rol', '')) or r.get('id', '').upper().startswith('D') for r in raw_roles)
        oposicion = 'Con oposición' if has_def else 'Sin oposición'
        
    # Materials
    raw_materials = data.get('materiales') or []
    mapped_materials = []
    material_names = []
    for m in raw_materials:
        m_name = (m.get('elemento') or m.get('nombre') or 'Material').strip()
        m_qty = m.get('cantidad')
        m_func = m.get('funcion') or 'Material de la tarea'
        m_icon = get_icon(m_name)
        mapped_materials.append({
            "nombre": m_name,
            "cantidad": m_qty,
            "funcion": m_func,
            "icono": m_icon
        })
        material_names.append(f"{m_qty} {m_name}" if m_qty else m_name)
        
    material_summary = ', '.join(material_names) if material_names else 'Balón'
    
    # Space / Dimensions
    espacio_data = data.get('espacio') or {}
    dims = espacio_data.get('dimensiones_fuente') or {}
    if isinstance(dims, dict) and 'largo_m' in dims and 'ancho_m' in dims:
        espacio_str = f"{dims['largo_m']} × {dims['ancho_m']} m"
    elif isinstance(dims, dict) and 'distancia_entre_jugadores_m' in dims:
        espacio_str = '5-10 m'
    else:
        espacio_str = espacio_data.get('zona_utilizada') or 'Zona de campo'
        
    # Montaje
    montaje_raw = data.get('montaje') or []
    if isinstance(montaje_raw, list):
        montaje_exp = '\n'.join(montaje_raw)
    elif isinstance(montaje_raw, dict):
        montaje_exp = montaje_raw.get('descripcion') or ''
    else:
        montaje_exp = str(montaje_raw or '')
    if not montaje_exp:
        montaje_exp = org.get('distribucion') or f"Preparar la zona de trabajo de {espacio_str}."
        
    # Phases and como_se_hace
    fases_raw = data.get('fases') or []
    como_se_hace = []
    mapped_fases = []
    for idx, f in enumerate(fases_raw):
        step_desc = (f.get('accion') or f.get('descripcion') or '').strip()
        if step_desc:
            como_se_hace.append(step_desc)
            next_desc = fases_raw[idx + 1].get('accion') or fases_raw[idx + 1].get('descripcion') if idx + 1 < len(fases_raw) else "Reinicio del ejercicio según consigna."
            mapped_fases.append({
                "orden": f.get('orden', idx + 1),
                "titulo": f"Paso {f.get('orden', idx + 1)}",
                "descripcion": step_desc,
                "poseedor_balon": f.get('poseedor_balon'),
                "que_ocurre_despues": next_desc,
                "condicion_final": f.get('condicion_final')
            })
            
    if not como_se_hace:
        explicacion_raw = data.get('explicacion', '')
        if explicacion_raw:
            como_se_hace = [s.strip() for s in explicacion_raw.split('\n') if s.strip()]
        else:
            como_se_hace = [obj_principal]
            
    # Duration and Carga
    tiempos = data.get('tiempos_fuente') or {}
    dur_str = "15 min"
    if tiempos.get('duracion'):
        dur_str = f"{tiempos['duracion']} min"
    elif tiempos.get('duracion_accion_segundos'):
        dur_str = "12-15 min"
        
    carga_obj = {
        "duracion": dur_str,
        "series": "",
        "repeticiones": "",
        "descanso": None,
        "ciclo_repeticion": f"Duración de la acción: {tiempos.get('duracion_accion_segundos', [4, 6])} s. Recuperación: {tiempos.get('recuperacion_segundos', 30)} s." if tiempos.get('duracion_accion_segundos') else "Mantener continuidad de la tarea."
    }
    
    # Rotacion
    rot_raw = data.get('rotaciones') or []
    has_rot = len(rot_raw) > 0 and not any('sin rotacion' in norm(r) for r in rot_raw)
    rot_exp = rot_raw[0] if rot_raw else "Sin rotación documentada."
    rot_obj = {
        "hay_rotacion": has_rot,
        "explicacion": rot_exp,
        "detalles": rot_raw
    }
    
    que_obs = list(data.get('que_debemos_observar') or [])
    consignas = list(data.get('reglas') or [])
    variantes = list(data.get('variantes_fuente') or [])
    
    err_corr = []
    for c in (data.get('correcciones_fuente') or []):
        err_corr.append({"error": c, "correccion": ""})
    for c in (data.get('correcciones_editoriales') or []):
        err_corr.append({"error": c, "correccion": ""})
        
    # Leyenda visual
    leyenda_raw = data.get('leyenda') or {}
    leyenda_roles_raw = leyenda_raw.get('roles') or {}
    leyenda_jugadores = []
    if isinstance(leyenda_roles_raw, dict):
        for k_id, v_rol in leyenda_roles_raw.items():
            col = get_role_color(k_id, v_rol)
            letra = k_id[0].upper() if k_id else 'A'
            leyenda_jugadores.append({
                "rol": v_rol,
                "color": col,
                "letra": letra,
                "funcion": v_rol
            })
    if not leyenda_jugadores:
        for r in mapped_roles:
            letra = r['id'][0].upper() if r['id'] else 'A'
            leyenda_jugadores.append({
                "rol": r['rol'],
                "color": r['color'],
                "letra": letra,
                "funcion": r['funcion']
            })
            
    leyenda_acciones = []
    leyenda_acc_raw = leyenda_raw.get('acciones') or {}
    if isinstance(leyenda_acc_raw, dict):
        for k_tipo, v_nom in leyenda_acc_raw.items():
            estilo = 'discontinua' if 'discontinua' in k_tipo else 'continua'
            trazo = '- - - - ▶' if estilo == 'discontinua' else '──────▶'
            color = '#FFFFFF' if 'blanca' in k_tipo else ('#E95852' if 'roja' in k_tipo else '#429FE2')
            leyenda_acciones.append({
                "tipo": k_tipo,
                "nombre": v_nom,
                "estilo": estilo,
                "trazo": trazo,
                "color": color,
                "significado": v_nom
            })
    if not leyenda_acciones:
        leyenda_acciones = [
            {
                "tipo": "linea_blanca",
                "nombre": "Pase temporal",
                "estilo": "continua",
                "trazo": "──────▶",
                "color": "#FFFFFF",
                "significado": "Pase temporal"
            }
        ]
        
    leyenda_visual = {
        "jugadores": leyenda_jugadores,
        "materiales": [
            {
                "nombre": m["nombre"],
                "icono": m["icono"],
                "cantidad": m["cantidad"],
                "funcion": m["funcion"]
            } for m in mapped_materials
        ],
        "acciones": leyenda_acciones,
        "zonas": None
    }
    
    # Vista rápida (short version) vs Vista completa (full version)
    vista_rapida = {
        "explicacion_breve": obj_principal,
        "que_se_trabaja": que_se_trabaja,
        "material": material_summary,
        "jugadores": f"{num_jugadores} jugadores",
        "tiempo": dur_str
    }
    
    # Media: GitHub releases / Supabase url format
    media = {
        "preview": f"library-v2/assets/previews/{f7_id}.png",
        "video": f"https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/library-v2-preview/{f7_id}/ejercicio.mp4"
    }
    
    _qa = {
        "source_folder": os.path.basename(d),
        "collection": f"Fútbol 7 ({'051-100' if int(num_str) <= 100 else '101-150'})",
        "lote": '051-100' if int(num_str) <= 100 else '101-150'
    }
    
    exercise_obj = {
        "id": f7_id,
        "nombre": nombre,
        "titulo_original_fuente": tit_fuente,
        "categoria": cat_princ,
        "subcategoria": subcat,
        "formato_juego": formato_juego,
        "formatos_juego": formatos_juego,
        "format": format_val,
        "etiquetas": tags,
        "que_se_trabaja": que_se_trabaja,
        "objetivo_principal": obj_principal,
        "objetivos_secundarios": obj_secundarios,
        "datos_rapidos": {
            "jugadores": f"{num_jugadores} jugadores",
            "duracion": dur_str,
            "espacio": espacio_str,
            "material": material_summary
        },
        "organizacion": {
            "resumen_jugadores": f"{num_jugadores} jugadores",
            "participantes_totales": num_jugadores,
            "porteros": porteros,
            "entrenadores": entrenadores,
            "roles": mapped_roles,
            "grupos": org.get('grupos', []),
            "equipos": org.get('equipos'),
            "oposicion": oposicion
        },
        "montaje": {
            "explicacion": montaje_exp,
            "dimensiones": espacio_str,
            "espacio_tipo": espacio_data.get('zona_utilizada') or 'Zona de campo'
        },
        "materiales": mapped_materials,
        "como_se_hace": como_se_hace,
        "fases": mapped_fases,
        "carga": carga_obj,
        "rotacion": rot_obj,
        "que_observar": que_obs,
        "consignas": consignas,
        "errores_correcciones": err_corr,
        "variantes": variantes,
        "vista_rapida": vista_rapida,
        "leyenda_visual": leyenda_visual,
        "media": media,
        "_qa": _qa
    }
    
    exercises.append(exercise_obj)

print(f"Generated {len(exercises)} exercises!")
print(f"First exercise ID: {exercises[0]['id']} ({exercises[0]['nombre']})")
print(f"Last exercise ID: {exercises[-1]['id']} ({exercises[-1]['nombre']})")

# Write to js/ejercicios-nuevos-lotes.js
out_js = '/Users/miguelperez/.gemini/antigravity/scratch/campobase/js/ejercicios-nuevos-lotes.js'
with open(out_js, 'w', encoding='utf-8') as f:
    f.write("// Lotes 051-100 y 101-150 (100 nuevos ejercicios certificados CampoBase V2)\n")
    f.write("// Clasificación canónica, F7/F11 según reglas oficiales y orden superior.\n\n")
    f.write("export const NUEVOS_LOTES_IDS = Object.freeze([\n")
    for ex in exercises:
        f.write(f"  '{ex['id']}',\n")
    f.write("]);\n\n")
    f.write("export const EJERCICIOS_NUEVOS_LOTES = Object.freeze(\n")
    json.dump(exercises, f, indent=2, ensure_ascii=False)
    f.write("\n);\n")

print(f"Wrote to {out_js} ({os.path.getsize(out_js)} bytes)")
