#!/usr/bin/env python3
import hashlib
import os
import subprocess
from typing import List

def get_repo_root() -> str:
    try:
        cmd = ['git', 'rev-parse', '--show-toplevel']
        return subprocess.check_output(cmd).strip().decode('utf-8')
    except:
        raise Exception('failed to get git repo root')

def get_files(path: str) -> List[str]:
    return [os.path.join(p, f) for (p, dirs, fs) in os.walk(path) for f in fs]

if __name__ == '__main__':
    checksums = dict()
    size = 0
    repo_root = get_repo_root()
    resources_dir = repo_root + '/app/resources'
    original_resources_dir = repo_root + '/app/original_resources'
    for d in [resources_dir, original_resources_dir]:
        for file in get_files(d):
            with open(file, 'rb') as f:
                contents = f.read()
                csum = hashlib.sha256(contents).hexdigest()
            if csum in checksums:
                print(f'file {file} duplicates {checksums[csum]}')
                size += len(contents)
            else:
                checksums[csum] = file
    print(f'total duplicated file size: {size} bytes')
