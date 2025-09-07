/**
 * FlatBuffers Generator for Advanced Users
 * 
 * This module provides the ability to generate custom FlatBuffers schemas
 * for users who need bespoke configurations beyond the default schema.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

export interface FlatBuffersConfig {
  /** Custom schema content (optional) */
  schema?: string;
  /** Path to custom schema file (optional) */
  schemaPath?: string;
  /** Output directory for generated files */
  outputDir: string;
  /** Whether to include TypeScript fixes */
  fixTypeScript?: boolean;
  /** Custom message types to include */
  messageTypes?: string[];
  /** Custom data message fields */
  dataMessageFields?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'bytes';
    required?: boolean;
  }>;
}

export interface FlatBuffersResult {
  success: boolean;
  outputDir: string;
  generatedFiles: string[];
  error?: string;
}

/**
 * Generate custom FlatBuffers TypeScript files
 * 
 * @param config Configuration for FlatBuffers generation
 * @returns Result of the generation process
 */
export function generateFlatBuffers(config: FlatBuffersConfig): FlatBuffersResult {
  try {
    console.log('🔄 Generating custom FlatBuffers TypeScript files...');
    
    // Ensure output directory exists
    if (!existsSync(config.outputDir)) {
      mkdirSync(config.outputDir, { recursive: true });
    }
    
    let schemaContent: string;
    
    // Use custom schema or default schema
    if (config.schema) {
      schemaContent = config.schema;
    } else if (config.schemaPath && existsSync(config.schemaPath)) {
      schemaContent = readFileSync(config.schemaPath, 'utf8');
    } else {
      // Generate default schema with customizations
      schemaContent = generateDefaultSchema(config);
    }
    
    // Write schema to temporary file
    const tempSchemaPath = join(config.outputDir, 'temp-schema.fbs');
    writeFileSync(tempSchemaPath, schemaContent);
    
    // Generate TypeScript files
    console.log('📝 Running flatc compiler...');
    execSync(`flatc --ts "${tempSchemaPath}"`, { 
      stdio: 'inherit',
      cwd: config.outputDir
    });
    
    // Check if sigma-sockets directory was created
    const generatedDir = join(config.outputDir, 'sigma-sockets');
    if (!existsSync(generatedDir)) {
      throw new Error('FlatBuffers generation failed - sigma-sockets directory not found');
    }
    
    // Move files to output directory
    const files = ['message.ts', 'message-type.ts', 'message-data.ts', 'data-message.ts'];
    const generatedFiles: string[] = [];
    
    files.forEach(file => {
      const sourcePath = join(generatedDir, file);
      const targetPath = join(config.outputDir, file);
      if (existsSync(sourcePath)) {
        execSync(`mv "${sourcePath}" "${targetPath}"`, { stdio: 'ignore' });
        generatedFiles.push(targetPath);
      }
    });
    
    // Clean up
    execSync(`rm -rf "${generatedDir}"`, { stdio: 'ignore' });
    execSync(`rm -f "${tempSchemaPath}"`, { stdio: 'ignore' });
    
    // Apply TypeScript fixes if requested
    if (config.fixTypeScript !== false) {
      applyTypeScriptFixes(generatedFiles);
    }
    
    console.log('✅ Custom FlatBuffers generation completed successfully!');
    
    return {
      success: true,
      outputDir: config.outputDir,
      generatedFiles
    };
    
  } catch (error) {
    console.error('❌ Custom FlatBuffers generation failed:', error);
    return {
      success: false,
      outputDir: config.outputDir,
      generatedFiles: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Generate a default schema with customizations
 */
function generateDefaultSchema(config: FlatBuffersConfig): string {
  const messageTypes = config.messageTypes || ['Connect', 'Disconnect', 'Data', 'Heartbeat', 'Reconnect', 'Error'];
  const dataFields = config.dataMessageFields || [
    { name: 'payload', type: 'bytes', required: true },
    { name: 'messageId', type: 'number', required: false },
    { name: 'timestamp', type: 'number', required: false }
  ];
  
  let schema = `// Custom FlatBuffers Schema for SigmaSockets
namespace sigma_sockets;

// Message types enum
enum MessageType : byte {
${messageTypes.map((type, index) => `  ${type} = ${index};`).join('\n')}
}

// Message data union
union MessageData {
${messageTypes.map(type => `  ${type}Message,`).join('\n')}
}

// Data message with custom fields
table DataMessage {
${dataFields.map(field => {
  const required = field.required ? '' : ' (required)';
  switch (field.type) {
    case 'string': return `  ${field.name}: string${required};`;
    case 'number': return `  ${field.name}: uint64${required};`;
    case 'boolean': return `  ${field.name}: bool${required};`;
    case 'bytes': return `  ${field.name}: [byte]${required};`;
    default: return `  ${field.name}: uint64${required};`;
  }
}).join('\n')}
}

// Main message table
table Message {
  type: MessageType;
  data_type: MessageData;
  data: MessageData;
}

root_type Message;
`;

  return schema;
}

/**
 * Apply TypeScript fixes to generated files
 */
function applyTypeScriptFixes(files: string[]): void {
  files.forEach(file => {
    if (file.endsWith('message.ts')) {
      let content = readFileSync(file, 'utf8');
      // Remove unused imports
      content = content.replace(/unionToMessageData, unionListToMessageData, /g, '');
      // Fix generic type parameter
      content = content.replace(/data<T extends flatbuffers.Table>/g, 'data');
      writeFileSync(file, content);
    }
    
    if (file.endsWith('message-data.ts')) {
      let content = readFileSync(file, 'utf8');
      // Remove unused imports
      content = content.replace(/import { [^}]+ } from '\.\/[^']+';/g, '');
      // Remove unused union functions
      content = content.replace(/export function unionToMessageData\([\s\S]*?\n}/gm, '');
      content = content.replace(/export function unionListToMessageData\([\s\S]*?\n}/gm, '');
      // Clean up extra blank lines
      content = content.replace(/\n\n\n+/g, '\n\n');
      writeFileSync(file, content);
    }
  });
}

/**
 * Get the default FlatBuffers schema
 */
export function getDefaultSchema(): string {
  return `// Default FlatBuffers Schema for SigmaSockets
namespace sigma_sockets;

enum MessageType : byte {
  Connect = 0;
  Disconnect = 1;
  Data = 2;
  Heartbeat = 3;
  Reconnect = 4;
  Error = 5;
}

union MessageData {
  ConnectMessage,
  DisconnectMessage,
  DataMessage,
  HeartbeatMessage,
  ReconnectMessage,
  ErrorMessage
}

table DataMessage {
  payload: [byte];
  messageId: uint64;
  timestamp: uint64;
}

table Message {
  type: MessageType;
  data_type: MessageData;
  data: MessageData;
}

root_type Message;
`;
}
