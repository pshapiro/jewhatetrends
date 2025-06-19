#!/usr/bin/env python3
"""Generate state-level incident totals from the unified dataset."""
import csv
import json
from collections import defaultdict
from pathlib import Path

# Paths
input_csv = Path('website-source/public/data/unified_hate_crimes_corrected.csv')
output_json = Path('website-source/public/data/state_analysis.json')

state_totals = defaultdict(float)
state_names = {}

with input_csv.open(newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        state = row.get('state', '').strip()
        if not state:
            continue
        try:
            count = float(row.get('incidents_corrected') or 0)
        except ValueError:
            count = 0
        state_totals[state] += count
        name = row.get('state_name', '').strip()
        if name:
            state_names[state] = name

state_data = [
    {
        'state': s,
        'incident_count': int(round(state_totals[s])),
        'state_name': state_names.get(s, s)
    }
    for s in sorted(state_totals, key=state_totals.get, reverse=True)
]

summary = {
    'state_data': state_data,
    'summary': {
        'total_states': len(state_totals),
        'total_incidents': int(round(sum(state_totals.values())))
    }
}

with output_json.open('w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2)

print(f"Saved state summary to {output_json}")

