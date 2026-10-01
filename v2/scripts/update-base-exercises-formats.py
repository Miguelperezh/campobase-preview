import json

ALEVIN_F7_IDS = {'f7-001', 'f7-004', 'f7-005', 'f7-006', 'f7-015', 'f7-016', 'f7-017', 'f7-018', 'f7-019', 'f7-020', 'f7-021', 'f7-022'}

# 1. Update library-v2/data/catalog.json
cat_path = 'library-v2/data/catalog.json'
cat = json.load(open(cat_path, 'r', encoding='utf-8'))

updated_38 = 0
kept_12 = 0

for item in cat:
    if item['id'].startswith('f7-'):
        if item['id'] in ALEVIN_F7_IDS:
            item['formato_juego'] = 'futbol_7'
            item['formatos_juego'] = ['futbol_7']
            kept_12 += 1
        else:
            item['formato_juego'] = 'todos'
            item['formatos_juego'] = ['futbol_7', 'futbol_11']
            updated_38 += 1

print(f"Catalog.json: updated {updated_38} general exercises to 'todos' [f7, f11], kept {kept_12} as 'futbol_7'")

with open(cat_path, 'w', encoding='utf-8') as f:
    json.dump(cat, f, indent=2, ensure_ascii=False)

# 2. Update library-v2/data/catalog-data.js
cat_js_path = 'library-v2/data/catalog-data.js'
with open(cat_js_path, 'w', encoding='utf-8') as f:
    f.write('window.__CAMPOBASE_CATALOG__ = ')
    json.dump(cat, f, indent=2, ensure_ascii=False)
    f.write(';\n')
print(f"Updated {cat_js_path}")

# 3. Update js/ejercicios-validados-base.js
base_js_path = 'js/ejercicios-validados-base.js'
content = open(base_js_path, 'r', encoding='utf-8').read()

start_idx = content.find('[\n  {\n    "id": "pdf150-022"')
end_marker = '\n]\n);'
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    raise ValueError("Could not locate JSON array in ejercicios-validados-base.js")

prefix = content[:start_idx]
suffix = content[end_idx + len(end_marker):]

arr = json.loads(content[start_idx:end_idx + 2])
for item in arr:
    if item['id'].startswith('f7-'):
        if item['id'] in ALEVIN_F7_IDS:
            item['formato_juego'] = 'futbol_7'
            item['formatos_juego'] = ['futbol_7']
        else:
            item['formato_juego'] = 'todos'
            item['formatos_juego'] = ['futbol_7', 'futbol_11']

# Also add formatos_juego to toCampoBaseExercise in suffix if not there
if 'formatos_juego,' not in suffix:
    suffix = suffix.replace(
        'formato_juego,\n    format: formato_juego === \'futbol_7\' ? \'F7\' : \'F11\',',
        'formato_juego,\n    formatos_juego: Array.isArray(item.formatos_juego) && item.formatos_juego.length ? item.formatos_juego : (formato_juego === \'futbol_7\' ? [\'futbol_7\'] : (formato_juego === \'futbol_11\' ? [\'futbol_11\'] : [\'futbol_7\', \'futbol_11\'])),\n    format: formato_juego === \'futbol_7\' ? \'F7\' : \'F11\','
    )

new_content = prefix + json.dumps(arr, indent=2, ensure_ascii=False) + '\n);\n' + suffix
with open(base_js_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print(f"Updated {base_js_path}")
