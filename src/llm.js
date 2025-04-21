import { exec } from 'child_process';

export default class LLM {
  async validateAnswer(answer,real_answer,quest,task) {
    return new Promise((resolve, reject) => {
      var command = `python3 ./src/checkAnswer.py "${answer}" "${real_answer}" "${quest}" "${task}" `;
      console.log(`${command}`);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        console.log(`${stdout.trim().toLowerCase()}`);
        resolve(`${stdout.trim().toLowerCase()}`);
      });
    });
  }
  async quizAnswer(answer,format) {
    return new Promise((resolve, reject) => {
      console.log(answer);
      var command = `python3 ./src/quizAnswer.py "${answer}" "${format}"`;
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

  async createNewHint(quest,task) {
    return new Promise((resolve, reject) => {
      var command = `python3 ./src/newHint.py "${quest}" "${task}"`;
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

