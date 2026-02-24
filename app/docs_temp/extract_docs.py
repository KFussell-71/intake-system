import sys
import os
from docx import Document

files = [
    'DOR.ES New Beginnnings Outreach Report Intake. blank.docx',
    'DOR.ES New Beginnnings Outreach Report Intake.Kyla Stevenson.docx',
    '30 day Employment ISP.docx'
]

base_dir = '/home/kfussell/Documents/Intake/docs_temp'
output_dir = os.path.join(base_dir, 'extracted')
os.makedirs(output_dir, exist_ok=True)

for f in files:
    path = os.path.join(base_dir, f)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
    doc = Document(path)
    output_path = os.path.join(output_dir, f.replace('.docx', '.txt'))
    with open(output_path, 'w') as out:
        for p in doc.paragraphs:
            out.write(p.text + '\n')
    print(f"Extracted: {f}")
