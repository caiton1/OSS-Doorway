const { exec } = require('child_process');

exec('python llm.py 5 10', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Result: ${stdout}`);
});

