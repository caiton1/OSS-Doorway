import { exec } from 'child_process';

export default class LLM {
  async add() {
    return new Promise((resolve, reject) => {
      exec('python3 ./src/llm.py 5 10', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }

        resolve(`Result: ${stdout.trim()}`);
      });
    });
  }
}

