import fs from 'fs';

const responseFilePath = './src/responses.json';
const configFilePath = "./src/config.json"
const repoName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).repo;
const userName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).user;

//const responses = JSON.parse(fs.readFileSync(responseFilePath, 'utf8'));

//console.log(responses.responses.taskAbandoned);

const repo = 'RESHAPELab/jabref';

const response = await fetch("https://api.github.com/repos/caiton1/CS386-Meal-Creation-App-WIP-/issues");
//const commits = await response.json();
//const userCommited = commits.find(commit => commit.author && commit.author.login === 'UnlimitedDrip');

const issues = await response.json();

const selectedIssue = issues.find(issue => issue.number == 84)
const assignees = selectedIssue.assignees;
const userFound = assignees.find(user => user.login == "caiton1");

console.log("Found user?: ");
console.log(userFound);

console.log("Assignees:");
console.log(assignees);

if(assignees.length == 1 && userFound){
    console.log("user found or too many people");
} else{
    console.log("user not found");
}


