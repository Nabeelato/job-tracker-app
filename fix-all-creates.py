import re
import sys

files_to_fix = [
    "src/app/api/departments/route.ts",
    "src/app/api/jobs/[id]/assign/route.ts",
    "src/app/api/jobs/[id]/comments/route.ts",
    "src/app/api/jobs/[id]/progress/route.ts",
    "src/app/api/jobs/[id]/request-completion/route.ts",
    "src/app/api/jobs/[id]/route.ts",
    "src/app/api/jobs/route.ts",
    "src/lib/activity.ts",
    "src/lib/notifications.ts"
]

for filepath in files_to_fix:
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        
        # Fix comment creates - look for data: { followed by content/jobId/userId/mentions
        content = re.sub(
            r'(prisma\.comment\.create\([^{]*\{[^{]*data:\s*\{)\s*\n(\s*)(content|jobId|userId|mentions|isEdited)',
            r'\1\n\2id: crypto.randomUUID(),\n\2updatedAt: new Date(),\n\2\3',
            content
        )
        
        # Fix statusUpdate creates
        content = re.sub(
            r'(prisma\.statusUpdate\.create\([^{]*\{[^{]*data:\s*\{)\s*\n(\s*)(jobId|userId|action)',
            r'\1\n\2id: crypto.randomUUID(),\n\2\3',
            content
        )
        
        # Fix notification creates
        content = re.sub(
            r'(prisma\.notification\.create\([^{]*\{[^{]*data:\s*\{)\s*\n(\s*)(userId|type|title)',
            r'\1\n\2id: crypto.randomUUID(),\n\2\3',
            content
        )
        
        # Fix activity creates
        content = re.sub(
            r'(prisma\.activity\.create\([^{]*\{[^{]*data:\s*\{)\s*\n(\s*)(id|jobId|type|userId)',
            r'\1\n\2id: crypto.randomUUID(),\n\2\3',
            content
        )
        
        # Fix department creates
        content = re.sub(
            r'(prisma\.department\.create\([^{]*\{[^{]*data:\s*\{)\s*\n(\s*)(name|managerId)',
            r'\1\n\2id: crypto.randomUUID(),\n\2updatedAt: new Date(),\n\2\3',
            content
        )
        
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
        else:
            print(f"No changes: {filepath}")
            
    except Exception as e:
        print(f"Error fixing {filepath}: {e}", file=sys.stderr)

