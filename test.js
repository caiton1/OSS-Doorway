import fs from 'fs';

const responseFilePath = './src/responses.json';
const configFilePath = "./src/config.json"
const repoName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).repo;
const userName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).user;

//const responses = JSON.parse(fs.readFileSync(responseFilePath, 'utf8'));

//console.log(responses.responses.taskAbandoned);

const repo = 'RESHAPELab/jabref';

const response = await fetch("https://api.github.com/repos/RESHAPELab/jabref/commits");
const commits = await response.json();
const userCommited = commits.find(commit => commit.author && commit.author.login === 'UnlimitedDrip');
if(userCommited){
    console.log('user has commited');
} else{
    console.log('user has not commited');
}
