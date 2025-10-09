#!/bin/bash

# Add crypto import if not exists
if ! grep -q "import { randomUUID }" prisma/seed.ts; then
  sed -i '1i import { randomUUID } from "crypto"' prisma/seed.ts
fi

# Fix department creates (add id and updatedAt)
sed -i 's/\(data: {\s*\)\(name:\)/\1id: randomUUID(),\n      updatedAt: new Date(),\n      \2/g' prisma/seed.ts

# Fix user creates (add id and updatedAt)  
sed -i '/data: {$/,/},$/{ 
  /name:.*,$/i\      id: randomUUID(),\n      updatedAt: new Date(),
}' prisma/seed.ts

echo "Seed file fixed!"
