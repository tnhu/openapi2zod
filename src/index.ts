#!/usr/bin/env node

import SwaggerParser from '@apidevtools/swagger-parser'
import { Command } from 'commander'
import { readFileSync, writeFileSync } from 'fs'
import { load } from 'js-yaml'
import { generateZodSchemas } from './generator'

const program = new Command()

program
  .name('openapi2zod')
  .description('Convert OpenAPI specs to TypeScript types and Zod schemas')
  .version('1.0.0')
  .argument('<input>', 'Input OpenAPI spec file (yaml or json)')
  .argument('[output]', 'Output TypeScript file', 'schemas.ts')
  .action(async (input: string, output: string) => {
    try {
      // Read and parse input file
      const content = readFileSync(input, 'utf8')
      const spec = input.endsWith('.yaml') || input.endsWith('.yml') ? load(content) : JSON.parse(content)

      // Validate and dereference OpenAPI spec
      const api = await SwaggerParser.validate(spec)
      const dereferenced = await SwaggerParser.dereference(api)

      // Generate TypeScript code with Zod schemas
      const code = generateZodSchemas(dereferenced)

      // Write output file
      writeFileSync(output, code)
      console.log(`Successfully generated Zod schemas in ${output}`)
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

program.parse()
