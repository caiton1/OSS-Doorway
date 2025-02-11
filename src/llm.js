import { exec } from 'child_process';

export default class LLM {
  async validateAnswer(question,answer,real_answer) {
    return new Promise((resolve, reject) => {
      var command = 'python3 ./src/openAnswer.py' +question+' '+answer+' '+real_answer;
      exec(command, (error, stdout, stderr) => {
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

  async rewordhint(hint) {
    return new Promise((resolve, reject) => {
      var command = 'python3 ./src/rewordHint.py'+hint;
      exec(command, (error, stdout, stderr) => {
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

