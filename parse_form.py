import re
import json

raw_path = r"C:\Users\Anshu Aman\.gemini\antigravity-ide\brain\3891086e-9647-4b9b-a0b0-a51761737506\.system_generated\steps\187\content.md"

with open(raw_path, "r", encoding="utf-8") as f:
    text = f.read()

match = re.search(r"FB_PUBLIC_LOAD_DATA_\s*=\s*(.*?);\s*</script>", text, re.DOTALL)
if not match:
    print("Not found")
    exit(1)

data = json.loads(match.group(1).strip())
form_meta = {
    "title": data[1][8] if len(data[1]) > 8 else "PhD Survey",
    "description": data[1][0] if len(data[1]) > 0 else "",
    "form_id": "1FAIpQLSeGwlc4mfUdprKYeytCRcFksRob7KdkX3UEdkm6J5ChW_NtwA",
    "submit_url": "https://docs.google.com/forms/d/e/1FAIpQLSeGwlc4mfUdprKYeytCRcFksRob7KdkX3UEdkm6J5ChW_NtwA/formResponse"
}

items = data[1][1]
questions = []

for idx, it in enumerate(items):
    title = it[1]
    desc = it[2] if len(it) > 2 else ""
    type_code = it[3]
    field_data = it[4] if len(it) > 4 else None
    
    info = {
        "index": idx,
        "title": title,
        "description": desc,
        "type": type_code,
    }
    
    # 7 is Likert Scale Matrix (Grid)
    if type_code == 7 and field_data:
        sub_items = []
        for sub in field_data:
            entry_id = sub[0]
            row_label = sub[3][0] if len(sub) > 3 and sub[3] else ""
            sub_items.append({"entry_id": f"entry.{entry_id}", "label": row_label})
        cols = []
        if len(field_data[0]) > 1 and field_data[0][1]:
            cols = [c[0] for c in field_data[0][1]]
        info["type_name"] = "likert_matrix"
        info["grid_rows"] = sub_items
        info["grid_cols"] = cols
    elif type_code in [2, 3, 4] and field_data:
        entry_id = field_data[0][0]
        options = [opt[0] for opt in field_data[0][1]] if len(field_data[0]) > 1 and field_data[0][1] else []
        info["type_name"] = "choice"
        info["entry_id"] = f"entry.{entry_id}"
        info["options"] = options
    elif type_code == 0 and field_data:
        entry_id = field_data[0][0]
        info["type_name"] = "text"
        info["entry_id"] = f"entry.{entry_id}"
    elif type_code == 8:
        info["type_name"] = "section_header"
    else:
        info["type_name"] = f"unknown_{type_code}"
        
    questions.append(info)

output = {
    "meta": form_meta,
    "questions": questions
}

with open("D:/formcrafts/form_schema.json", "w", encoding="utf-8") as out_f:
    json.dump(output, out_f, indent=2, ensure_ascii=False)

print("Parsed successfully!")
print(f"Total elements: {len(questions)}")
for q in questions:
    if q.get("type_name") == "likert_matrix":
        print(f"Matrix: {q['title'][:35]} -> {len(q['grid_rows'])} sub-statements")
        for r in q["grid_rows"]:
            print(f"  - [{r['entry_id']}] {r['label'][:60]}")
