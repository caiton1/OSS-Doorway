import { exec } from 'child_process';

export default class LLM {
  async add() {
    return new Promise((resolve, reject) => {
      exec('python3 ./src/llm.py "which fruit has trees ?" "apples" "apples" ', (error, stdout, stderr) => {
        if (error) {
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

