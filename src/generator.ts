import { OpenAPI3 } from 'openapi-types'
import { camelCase, pascalCase } from 'change-case'

interface SchemaContext {
  schemas: Map<string, string>
  imports: Set<string>
}

export function generateZodSchemas(spec: OpenAPI3.Document): string {
  const context: SchemaContext = {
    schemas: new Map(),
    imports: new Set(['z'])
  }

  // Process all schemas
  if (spec.components?.schemas) {
    for (const [name, schema] of Object.entries(spec.components.schemas)) {
      const zodSchema = generateZodSchema(schema as OpenAPI3.SchemaObject, context)
      context.schemas.set(name, zodSchema)
    }
  }

  // Generate the output code
  const imports = generateImports(context.imports)
  const schemas = generateSchemaExports(context.schemas)

  return [imports, schemas].join('\n\n')
}

function generateZodSchema(schema: OpenAPI3.SchemaObject, context: SchemaContext): string {
  if (schema.type === 'object') {
    return generateObjectSchema(schema, context)
  } else if (schema.type === 'array') {
    return generateArraySchema(schema, context)
  } else if (schema.type === 'string' && schema.enum) {
    return generateEnumSchema(schema)
  } else if (schema.oneOf || schema.anyOf) {
    return generateUnionSchema(schema, context)
  } else {
    return generatePrimitiveSchema(schema)
  }
}

function generateObjectSchema(schema: OpenAPI3.SchemaObject, context: SchemaContext): string {
  const properties = schema.properties || {}
  const required = schema.required || []

  const propertySchemas = Object.entries(properties).map(([name, prop]) => {
    const zodSchema = generateZodSchema(prop as OpenAPI3.SchemaObject, context)
    const isRequired = required.includes(name)
    const description = prop.description ? `.describe('${prop.description}')` : ''

    return `${name}: ${zodSchema}${isRequired ? '' : '.optional()'}${description}`
  })

  return `z.object({
    ${propertySchemas.join(',\n    ')}
  })${schema.additionalProperties ? '.passthrough()' : ''}`
}

function generateArraySchema(schema: OpenAPI3.SchemaObject, context: SchemaContext): string {
  const itemSchema = generateZodSchema(schema.items as OpenAPI3.SchemaObject, context)
  return `z.array(${itemSchema})`
}

function generateEnumSchema(schema: OpenAPI3.SchemaObject): string {
  const values = (schema.enum as string[]).map(v => `'${v}'`)
  return `z.enum([${values.join(', ')}])`
}

function generateUnionSchema(schema: OpenAPI3.SchemaObject, context: SchemaContext): string {
  const types = (schema.oneOf || schema.anyOf || []).map(s =>
    generateZodSchema(s as OpenAPI3.SchemaObject, context)
  )
  return types.join(' | ')
}

function generatePrimitiveSchema(schema: OpenAPI3.SchemaObject): string {
  const type = schema.type as string
  let zodSchema = 'z.'

  switch (type) {
    case 'string':
      zodSchema += 'string()'
      if (schema.format === 'date-time') {
        zodSchema += '.datetime({ offset: true })'
      } else if (schema.format === 'email') {
        zodSchema += '.email()'
      } else if (schema.format === 'uuid') {
        zodSchema += '.uuid()'
      }
      break
    case 'number':
      zodSchema += 'number()'
      if (schema.minimum !== undefined) {
        zodSchema += `.gte(${schema.minimum})`
      }
      if (schema.maximum !== undefined) {
        zodSchema += `.lte(${schema.maximum})`
      }
      break
    case 'integer':
      zodSchema += 'number().int()'
      break
    case 'boolean':
      zodSchema += 'boolean()'
      break
    default:
      zodSchema += 'any()'
  }

  return zodSchema
}

function generateImports(imports: Set<string>): string {
  return `import { ${Array.from(imports).join(', ')} } from 'zod'`
}

function generateSchemaExports(schemas: Map<string, string>): string {
  const exports: string[] = []

  for (const [name, schema] of schemas) {
    exports.push(`export const ${pascalCase(name)} = ${schema}`)
  }

  // Export all schemas
  const exportNames = Array.from(schemas.keys()).map(name => {
    const pascalName = pascalCase(name)
    return `${pascalName} as ${pascalName}Schema`
  })

  exports.push(`\nexport {\n  ${exportNames.join(',\n  ')}\n}`)

  return exports.join('\n\n')
