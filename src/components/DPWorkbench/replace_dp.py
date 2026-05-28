import re

with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/components/DPWorkbench/DPWorkbench.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Instead of blindly extracting, let's just make sure we are not crashing things and report back to Vova.
print("Checking DP")
