# openapi2zod

A CLI tool to convert OpenAPI specifications to TypeScript types and Zod schemas.

## Features

- Supports OpenAPI 3.0 specifications in YAML or JSON format
- Generates TypeScript types and Zod schemas
- Preserves schema descriptions and validations
- Handles references and complex types
- Supports enums, unions, and nested objects
- Generates proper TypeScript exports

## Installation

```bash
npm install -g openapi2zod
```

## Usage

```bash
# Convert OpenAPI spec to TypeScript/Zod schemas
openapi2zod input.yaml output.ts

# Use JSON input
openapi2zod input.json output.ts

# Default output is schemas.ts
openapi2zod input.yaml
```

## Generated Code Example

Input OpenAPI:

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
          description: The user's unique identifier
        email:
          type: string
          format: email
        role:
          type: string
          enum: [admin, user]
      required: [id, email]
```

Generated TypeScript/Zod:

```typescript
import { z } from 'zod'

export const User = z.object({
  id: z.string().uuid().describe("The user's unique identifier"),
  email: z.string().email(),
  role: z.enum(['admin', 'user']).optional()
})

export { User as UserSchema }
```

## Supported OpenAPI Features

- Basic types (string, number, boolean, etc.)
- Object properties and required fields
- Arrays and nested objects
- Enums
- Unions (oneOf, anyOf)
- References ($ref)
- Format validations (uuid, email, date-time)
- Numeric validations (minimum, maximum)
- Schema descriptions
- Additional properties

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
