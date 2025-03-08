require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('AI Matching Setup Script');
console.log('------------------------');
console.log('This script will help you set up AI matching for your document scanner.');
console.log('');

const envPath = path.join(__dirname, '../.env');
let envContent = '';

try {
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
} catch (error) {
  console.error('Error reading .env file:', error.message);
}

const promptHuggingFace = () => {
  rl.question('Enter your Hugging Face API token (or press Enter to skip): ', (token) => {
    if (token) {
      // Update or add the token to the .env file
      if (envContent.includes('HUGGINGFACE_API_TOKEN=')) {
        envContent = envContent.replace(/HUGGINGFACE_API_TOKEN=.*(\r?\n|$)/g, `HUGGINGFACE_API_TOKEN=${token}$1`);
      } else {
        envContent += `\nHUGGINGFACE_API_TOKEN=${token}\n`;
      }
      
      console.log('Hugging Face API token set successfully.');
    } else {
      console.log('Skipping Hugging Face API token setup.');
    }
    
    promptOpenAI();
  });
};

const promptOpenAI = () => {
  rl.question('Enter your OpenAI API key (or press Enter to skip): ', (key) => {
    if (key) {
      // Update or add the key to the .env file
      if (envContent.includes('OPENAI_API_KEY=')) {
        envContent = envContent.replace(/OPENAI_API_KEY=.*(\r?\n|$)/g, `OPENAI_API_KEY=${key}$1`);
      } else {
        envContent += `\nOPENAI_API_KEY=${key}\n`;
      }
      
      console.log('OpenAI API key set successfully.');
    } else {
      console.log('Skipping OpenAI API key setup.');
    }
    
    promptAIEnabled();
  });
};

const promptAIEnabled = () => {
  rl.question('Enable AI matching by default? (y/n): ', (answer) => {
    const enabled = answer.toLowerCase() === 'y';
    
    // Update or add the setting to the .env file
    if (envContent.includes('AI_MATCHING_ENABLED=')) {
      envContent = envContent.replace(/AI_MATCHING_ENABLED=.*(\r?\n|$)/g, `AI_MATCHING_ENABLED=${enabled}$1`);
    } else {
      envContent += `\nAI_MATCHING_ENABLED=${enabled}\n`;
    }
    
    console.log(`AI matching ${enabled ? 'enabled' : 'disabled'} by default.`);
    
    // Save the updated .env file
    try {
      fs.writeFileSync(envPath, envContent);
      console.log('.env file updated successfully.');
    } catch (error) {
      console.error('Error writing .env file:', error.message);
    }
    
    rl.close();
  });
};

// Start the prompts
promptHuggingFace(); 