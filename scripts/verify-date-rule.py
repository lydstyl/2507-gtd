#!/usr/bin/env python3
"""Vérification end-to-end de la règle : date limite >= date prévue (API GTD réelle)."""
import json
import subprocess
import sys

TOKEN = open('/home/lydstyl/.hermes/secrets/gtd-api-token').read().strip()
BASE = 'http://localhost:3001/api'


def call(method, path, payload=None):
    cmd = ['curl', '-s', '-X', method, f'{BASE}{path}',
           '-H', f'Authorization: Bearer {TOKEN}',
           '-H', 'Content-Type: application/json']
    if payload is not None:
        cmd += ['-d', json.dumps(payload)]
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    try:
        return json.loads(out)
    except Exception:
        return {'_raw': out}


def main():
    created = call('POST', '/tasks', {
        'name': 'ZZ test règle dates (auto — suppression)',
        'importance': 100,
        'complexity': 1,
        'plannedDate': '2026-11-20',
        'dueDate': '2026-11-10',
    })
    tid = created.get('id')
    if not tid:
        print('ECHEC création:', created)
        return 1
    print(f'créé {tid} · prévue={created.get("plannedDate")} · limite={created.get("dueDate")}')

    checks = []

    r = call('PUT', f'/tasks/{tid}', {'plannedDate': '2026-12-05'})
    checks.append(('planifiée poussée -> limite suit', r.get('dueDate'), '2026-12-05'))

    r = call('PUT', f'/tasks/{tid}', {'plannedDate': '2026-12-06', 'dueDate': '2026-12-01'})
    checks.append(('limite fournie antérieure -> réalignée', r.get('dueDate'), '2026-12-06'))

    r = call('PUT', f'/tasks/{tid}', {'plannedDate': '2026-11-01'})
    checks.append(('prévue reculée -> limite conservée', r.get('dueDate'), '2026-12-06'))

    r = call('PUT', f'/tasks/{tid}', {'plannedDate': None})
    checks.append(('prévue vidée -> limite conservée', r.get('dueDate'), '2026-12-06'))

    r = call('PUT', f'/tasks/{tid}', {'plannedDate': '2026-12-10', 'dueDate': None})
    checks.append(('limite vidée -> reste vide', r.get('dueDate'), None))

    reread = call('GET', f'/tasks/{tid}')
    checks.append(('relecture = état persisté', reread.get('dueDate'), None))

    call('DELETE', f'/tasks/{tid}')
    gone = call('GET', f'/tasks/{tid}')
    deleted = gone.get('id') is None

    ok = True
    for label, got, expected in checks:
        norm = (got or '')[:10] if isinstance(got, str) else got
        exp = (expected or '')[:10] if isinstance(expected, str) else expected
        status = 'OK ' if norm == exp else 'KO '
        ok = ok and norm == exp
        print(f'{status} {label}: obtenu={norm!r} attendu={exp!r}')
    print(('OK ' if deleted else 'KO ') + f'nettoyage (tâche supprimée={deleted})')
    return 0 if (ok and deleted) else 1


if __name__ == '__main__':
    sys.exit(main())
