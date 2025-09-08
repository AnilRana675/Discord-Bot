import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands() {
  const commands = new Map();
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    
    // Check for default export first, then named exports
    let commandObject = command.default;
    
    if (!commandObject || !commandObject.data || !commandObject.execute) {
      // Try to find named exports
      commandObject = Object.values(command).find(exp => 
        exp && exp.data && exp.execute
      );
      
      // Try to construct from separate named exports
      if (!commandObject && command.data && command.execute) {
        commandObject = { data: command.data, execute: command.execute };
      }
    }

    if (commandObject && commandObject.data && commandObject.execute) {
      commands.set(commandObject.data.name, commandObject);
      console.log(`✅ Loaded command: ${commandObject.data.name}`);
    } else {
      console.log(`⚠️  Command at ${filePath} is missing required "data" or "execute" property.`);
    }
  }

  return commands;
}

export function splitMessage(text, maxLength = 2000) {
  if (text.length <= maxLength) return [text];
  
  const chunks = [];
  let currentChunk = '';
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If a single line is too long, split it
      if (line.length > maxLength) {
        const words = line.split(' ');
        for (const word of words) {
          if (currentChunk.length + word.length + 1 > maxLength) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
          }
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      } else {
        currentChunk = line;
      }
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
