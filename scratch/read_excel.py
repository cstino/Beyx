import pandas as pd
import json
import os

file_path = '/Users/cristiano/BeyX/risposte_claude/Database Completo Beyblade X - AliExpress Helper V3.xlsx'

try:
    # Read all sheets to see what's inside
    xl = pd.ExcelFile(file_path)
    print(f"Sheets found: {xl.sheet_names}")
    
    data = {}
    for sheet in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet)
        data[sheet] = df.to_dict(orient='records')
        
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error reading Excel: {e}")
