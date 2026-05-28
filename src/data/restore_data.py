import re

with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/data/algorithmsData.js", "r", encoding="utf-8") as f:
    content = f.read()

# restore strings
content = re.sub(r"(id: 'strings',.*?route: )'/trees'", r"\1null", content, flags=re.DOTALL)
content = re.sub(r"(id: 'strings',.*?status: )'active'", r"\1'preview'", content, flags=re.DOTALL)

# restore geometry
content = re.sub(r"(id: 'geometry',.*?route: )'/trees'", r"\1null", content, flags=re.DOTALL)
content = re.sub(r"(id: 'geometry',.*?status: )'active'", r"\1'preview'", content, flags=re.DOTALL)

with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/data/algorithmsData.js", "w", encoding="utf-8") as f:
    f.write(content)
