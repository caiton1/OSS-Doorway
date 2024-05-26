import fs from 'fs';
const responseFilePath = './src/responses.json';
const configFilePath = "./src/config.json"
const repoName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).repo;
const userName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).user;

//const responses = JSON.parse(fs.readFileSync(responseFilePath, 'utf8'));

//console.log(responses.responses.taskAbandoned);

const repo = 'RESHAPELab/jabref';


