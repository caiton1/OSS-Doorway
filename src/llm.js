import { exec } from 'child_process';

export default class LLM {
  async validateAnswer(question,answer,real_answer) {
    return new Promise((resolve, reject) => {
      var command = `python3 ./src/openAnswer.py "${question}" "${answer}" "${real_answer}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        resolve(`${stdout.trim()}`);
      });
    });
  }
  async createNewHint(task) {
    return new Promise((resolve, reject) => {
      var command = `python3 ./src/newHint.py "${task}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        resolve(`${stdout.trim()}`);
      });
    });
  }

  async rewordHint(hint) {
    return new Promise((resolve, reject) => {
      var command = `python3 ./src/rewordHint.py "${hint}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        resolve(`${stdout.trim()}`);
      });
    });
  }

}

