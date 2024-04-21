import fs from 'fs';
const responseFilePath = './src/responses.json';

const responses = JSON.parse(fs.readFileSync(responseFilePath, 'utf8'));

console.log(responses.responses.taskAbandoned);
