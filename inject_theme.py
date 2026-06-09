import os
import glob
import re

files = glob.glob('src/components/**/*.jsx', recursive=True)
visualizers = [f for f in files if 'Visualizer' in f or 'DPWorkbench' in f]

for f in visualizers:
    if f == 'src/components/SortingVisualizer/SortingVisualizer.jsx' or 'Utils' in f or 'Modal' in f: continue
    
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'ThemeToggle' in content: continue

    # Add import ThemeToggle
    if 'import { useLanguage }' in content:
        content = content.replace("import { useLanguage } from '../../context/LanguageContext';", "import { useLanguage } from '../../context/LanguageContext';\nimport ThemeToggle from '../ThemeToggle/ThemeToggle';")

    # Find language switch block and inject <ThemeToggle />
    pattern = r'(<div className="flex-1 flex justify-end[^"]*">(?:\s*)<div className="flex gap-1 bg-neutral-950/50 p-1 rounded-lg border border-blue-900/30 hidden sm:flex">)'
    replacement = r'<div className="flex-1 flex justify-end items-center gap-3">\n            <ThemeToggle />\n            <div className="flex gap-1 bg-neutral-950/50 p-1 rounded-lg border border-blue-900/30 hidden sm:flex">'
    
    new_content = re.sub(pattern, replacement, content)
    
    if new_content == content:
        pattern2 = r'(<div className="flex-1 flex justify-end">\s*<div className="flex gap-1)'
        replacement2 = r'<div className="flex-1 flex justify-end items-center gap-3">\n            <ThemeToggle />\n            <div className="flex gap-1'
        new_content = re.sub(pattern2, replacement2, content)

    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated {f}')
    else:
        print(f'Failed to match pattern in {f}')
