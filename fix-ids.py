#!/usr/bin/env python3
import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: Fix notification.create
    content = re.sub(
        r'(await prisma\.notification\.create\(\{\s*data: \{)\s*\n(\s*userId:)',
        r'\1\n\2              id: crypto.randomUUID(),\n\2',
        content
    )
    
    # Pattern 2: Fix comment.create
    content = re.sub(
        r'(await prisma\.comment\.create\(\{\s*data: \{)\s*\n(\s*)(content|jobId):',
        r'\1\n\2id: crypto.randomUUID(),\n\2updatedAt: new Date(),\n\2\3:',
        content
    )
    
    # Pattern 3: Fix statusUpdate.create
    content = re.sub(
        r'(await prisma\.statusUpdate\.create\(\{\s*data: \{)\s*\n(\s*)(jobId|userId|action):',
        r'\1\n\2id: crypto.randomUUID(),\n\2\3:',
        content
    )
    
    # Pattern 4: Fix department.create
    content = re.sub(
        r'(await prisma\.department\.create\(\{\s*data: \{)\s*\n(\s*name:)',
        r'\1\n\2        id: crypto.randomUUID(),\n\2        updatedAt: new Date(),\n\2',
        content
    )
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    api_dir = 'src/app/api'
    fixed_count = 0
    
    for root, dirs, files in os.walk(api_dir):
        for file in files:
            if file.endswith('.ts'):
                filepath = os.path.join(root, file)
                if fix_file(filepath):
                    print(f'Fixed: {filepath}')
                    fixed_count += 1
    
    print(f'\nTotal files fixed: {fixed_count}')

if __name__ == '__main__':
    main()
