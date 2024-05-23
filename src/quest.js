import fs from "fs";
const questFilePath = "./src/available-quests.json";
const responseFilePath = "./src/response.json";
const configFilePath = "./src/config.json"
const questResponse = JSON.parse(fs.readFileSync(responseFilePath, "utf-8"));
const repoName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).repo;
const userName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).user;

async function acceptQuest(context, db, user, quest) {
  const {owner, repo} = context.repo();
  try {
    // Read in available qeusts and validate requested quest
    const quests = JSON.parse(fs.readFileSync(questFilePath, "utf8"));
    if (quest in quests) {
      const user_data = await db.downloadUserData(user);
      if (!user_data.user_data.accepted) {
        user_data.user_data.accepted = {};
      }
      // if user has accepted quest
      if (!Object.keys(user_data.user_data.accepted).length) {
        user_data.user_data.accepted[quest] = {};
        // add list of tasks to user in database
        for (const task in quests[quest]) {
          if (task !== "metadata") {
            user_data.user_data.accepted[quest][task] = { completed: false };
          }
          // track current progress
          user_data.user_data.current = {
            quest: quest,
            task: "T1", // depending on how indexing works in validate task, may need to change to 0
          };
          user_data.user_data.completion = 0;
        }
        await db.updateData(user_data);
        
        await createQuestEnvironment(quest, "T1", context);
        // update character stats
        await updateReadme(user, owner, repo, context, db);
        return true;
      } else {
        // TODO: may later need to implement reason for false, like already accepted, or user doesnt exist
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error accepting quest!: " + error);
    return false;
  }
}

// TODO: remove point exploit (user can complete task, earn points, but then drop quest and restart, not loosing earned points)
async function removeQuest(db, user) {
  try {
    const user_data = await db.downloadUserData(user);
    if (user_data.user_data.accepted) {
      delete user_data.user_data.accepted;
      delete user_data.user_data.current;
      await db.updateData(user_data);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error removing quest:", error);
    return false;
  }
}


async function completeQuest(db, user, quest, context) {
  try {
    const user_data = await db.downloadUserData(user);

    // user has the requested quest accepted 
    if (user_data.user_data.accepted && user_data.user_data.accepted[quest]) {
      const tasks_completed = Object.values(
        user_data.user_data.accepted[quest]
      ).every((task) => task.completed);  // all tasks completed

      // clear quest and task
      if (tasks_completed) {
        delete user_data.user_data.accepted[quest];
        if (!user_data.user_data.completed) {
          user_data.user_data.completed = [];
        }
        // add quest to users completed list
        user_data.user_data.completed.push(quest);

        // update user data in DB
        await db.updateData(user_data);
        return true; // Quest successfully completed
      }
    }
  } catch (error) {
    console.error("Error completing quest:", error);
  }

  return false; // Quest not completed
}

async function completeTask(db, user, quest, task, context) {
  const { owner, repo } = context.repo();
  try {
    const quests = JSON.parse(fs.readFileSync(questFilePath, "utf8"));
    const user_data = await db.downloadUserData(user);

    const points = quests[quest][task].points;
    const xp = quests[quest][task].xp;

    if (user_data.user_data.accepted && user_data.user_data.accepted[quest] && user_data.user_data.accepted[quest][task]) {
      user_data.user_data.accepted[quest][task].completed = true;
      user_data.user_data.points += points; 
      user_data.user_data.xp += xp;

      const tasks = Object.keys(quests[quest]).filter((t) => t !== "metadata");
      const taskIndex = tasks.indexOf(task);

      user_data.user_data.completion = (taskIndex + 1) / tasks.length;
      user_data.user_data.completion = Math.round(user_data.user_data.completion * 100) / 100; // two decimal places

      if (taskIndex !== -1 && taskIndex < tasks.length - 1) {
        const nextTask = tasks[taskIndex + 1];
        user_data.user_data.current.task = nextTask;
      } else {
        user_data.user_data.current.task = null;
        await completeQuest(db, user, quest, context);
      }

      await db.updateData(user_data);

      await context.octokit.issues.update({
        owner: owner,
        repo: repo,
        issue_number: context.issue().issue_number,
        state: 'closed'
      });

      if (user_data.user_data.current) {
        await createQuestEnvironment(quest, user_data.user_data.current.task, context);
      }

      await updateReadme(user, owner, repo, context, db);
      return true; 
    }
    return false; 
  } catch (error) {
    console.error("Error completing task:", error);
    return false;
  }
}



async function createQuestEnvironment(quest, task, context) {
  const { owner, repo } = context.repo();
  var issueComment = "";
  var response = questResponse;
  // most will be creating an issue with multiple choice
  // quest 1 TODO: use another repo, use API enpoint to find issue numbers, include link to issues in the project
  if (quest === "Q1") {
    response = response.Quest1;
    // Find issue tracker
    if (task === "T1") {
      response = response.Task1.acceptQ1T1;
    }
    // find pull request menu
    else if (task === "T2") {
      response = response.Task2.acceptQ1T2;
    }
    // find the fork button
    else if (task === "T3") {
      response = response.Task3.acceptQ1T3;
    }
    // find the readme file
    else if (task === "T4") {
      response = response.Task4.acceptQ1T4;
    }
    // find the contributors
    else if (task === "T5") {
      response = response.Task5.acceptQ1T5;
    }
    issueComment = context.issue({
      body: response
    });
    try{
      // new issue for new task
      await context.octokit.issues.create({
        owner: owner,
        repo: repo,
        title: "❗ QUEST: " + task,
        body: response
      });
    } catch(error){
      console.error("Error creating new issue: ", error);
    }
    
  }

  // quest 2
  // choose issue that you would like to work with
  // generate issues, with tags
  // assign user to work on issue

  // post a commnet in the issue introducing yourself

  // mention a contributor

  // quest 3
  // solve issue (upload a file)

  // submit pull request

  // post in the issue askingfor someone to review

  // close issue
}

async function validateTask(db, context, user) {
  // quest 1
  const userData = await db.downloadUserData(user);
  // TODO: add exception handling
  const task = userData.user_data.current.task;
  const quest = userData.user_data.current.quest;
  var issueComment = context.payload.comment.body;
  var response = questResponse;
  console.log(task, quest);
  console.log(task === "T4")
  if (quest === "Q1") {
    response = response.Quest1;
    if (task === "T1") {
      response = response.Task1;
      // Check issue tracker count
      const issueCount = await getIssueCount(repoName);
      if (issueCount !== null && context.payload.comment.body == issueCount) {
        response = response.successQ1T1;
        await completeTask(db, user, "Q1", "T1", context);
      }
      else
      {
        response = response.errorQ1T1;
      }
    } else if (task === "T2") {
      response = response.Task2;
      // Check pull request count
      const PRCount = await getPRCount(repoName);
      if (PRCount !== null && context.payload.comment.body == PRCount) {
        response = response.successQ1T2;
        await completeTask(db, user, "Q1", "T2", context);
      } else {
        response = response.errorQ1T2;
      }
    } else if (task === "T3") {
      response = response.Task3;
      // On fork or multiple choice
      const correctAnswer = "c"; // TODO: parameterize ??
      if (issueComment.toLowerCase().includes(correctAnswer)) {
        response = response.successQ1T3;
        await completeTask(db, user, "Q1", "T3", context);
      } else {
        response = response.errorQ1T3;
      }
    } else if (task === "T4") {
      // Check issue body for a hint about readme
      const hint = "c"; 
      if (issueComment.toLowerCase().includes(hint)) {
          await completeTask(db, user, "Q1", "T4", context);  
          response = response.successQ1T4;
      } else {
          response = response.errorQ1T4;
      }
  }
   else if (task === "T5") {
      // Check for valid contributor name
      const correctCount = 633 // TODO: fix, issue with this one
      if (issueComment.toLowerCase().includes(correctCount)) {

        await completeTask(db, user, "Q1", "T5", context);
        response = response.successQ1T5;
      } else {
        response = response.errorQ1T5;
      }
    }
  }
  // quest 2
  else if (quest === "Q2") {
    // choose issue that you would like to work with
    // check for reply
    // assign user to work on issue
    // check for user assign
    // post a commnet in the issue introducing yourself
    // check for comment contains hello or hi or name
    // mention a contributor
    // check issue for mention of a contributor
  }
  // quest 3
  else if (quest === "Q3") {
    // solve issue (upload a file)
    // check for a push, commit of a file
    // submit pull request
    // check for PR
    // post in the issue asking for someone to review
    // check for issue comment
    // close issue
    // check for issue delete
  }
  issueComment = context.issue({
    body: response
  });
  await context.octokit.issues.createComment(issueComment);
}


// supporting functions for quest validation
async function getIssueCount(repo) {
  try {
      const response = await fetch(`https://api.github.com/repos/${repo}/issues`);
      if (response.ok) {
          const issues = await response.json();
          return issues.length;
      } else {
          console.error("Error:", response.status);
          return null;
      }
  } catch (error) {
      console.error("Error:", error);
      return null;
  }
}

async function getPRCount(repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls`);
    const data = await response.json();
    
    // Check if the response is an array (list of pull requests)
    if (Array.isArray(data)) {
      // The length of the array gives the number of pull requests
      return data.length;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    throw error;
  }
}

async function generateSVG(user, owner, repo, context, db){
  try {
    // get user data
    const userDocument = await db.downloadUserData(user);
    const percentage = userDocument.user_data.completion * 100;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percentage / 100);
    
    // svg content
    const svgContent = `
    <svg
        width="450"
        height="195"
        viewBox="0 0 450 195"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="descId"
    >
        <title id="titleId">User's Quest Stats, Level: 2</title>
        <desc id="descId">Total Quests Completed: 3, Power Ups Used: 2, Community Rating: 5</desc>
        <style>
            .header {
                font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
                fill: #21262d;
                animation: fadeInAnimation 0.8s ease-in-out forwards;
            }
            @supports(-moz-appearance: auto) {
                /* Selector detects Firefox */
                .header { font-size: 15.5px; }
            }
            
            .stat {
                font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; 
                fill: white;
            }
            @supports(-moz-appearance: auto) {
                /* Selector detects Firefox */
                .stat { font-size: 12px; }
            }
            .stagger {
                opacity: 0;
                animation: fadeInAnimation 0.3s ease-in-out forwards;
            }
            .rank-text {
                font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif; 
                fill: white;
                animation: scaleInAnimation 0.3s ease-in-out forwards;
            }
            .rank-percentile-header {
                font-size: 14px;
            }
            .rank-percentile-text {
                font-size: 16px;
            }
            
            .not_bold { font-weight: 400 }
            .bold { font-weight: 700 }
            .icon {
                fill: #4c71f2;
                display: none;
            }
    
            .rank-circle-rim {
                stroke: #2f80ed;
                fill: none;
                stroke-width: 6;
                opacity: 0.2;
            }
            .rank-circle {
                stroke: #2f80ed;
                stroke-dasharray: ${circumference};
                stroke-dashoffset: ${offset};
                fill: none;
                stroke-width: 6;
                stroke-linecap: round;
                opacity: 0.8;
                transform-origin: -10px 8px;
                transform: rotate(-90deg);
                animation: rankAnimation 1s forwards ease-in-out;
            }
            
            @keyframes rankAnimation {
                from {
                    stroke-dashoffset: ${circumference};
                }
                to {
                    stroke-dashoffset: ${offset};
                }
            }
        
            /* Animations */
            @keyframes scaleInAnimation {
                from {
                    transform: translate(-5px, 5px) scale(0);
                }
                to {
                    transform: translate(-5px, 5px) scale(1);
                }
            }
            @keyframes fadeInAnimation {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        </style>
    
        <rect
            data-testid="card-bg"
            x="0.5"
            y="0.5"
            rx="4.5"
            height="99%"
            stroke="#e4e2e2"
            width="449"
            fill="#21262d"
            stroke-opacity="1"
        />
    
        <g data-testid="card-title" transform="translate(25, 35)">
            <g transform="translate(0, 0)">
                <text x="0" y="0" class="header" data-testid="header">User's Quest Stats</text>
            </g>
        </g>
    
        <g data-testid="main-card-body" transform="translate(0, 55)">
            <g data-testid="rank-circle" transform="translate(365, 30)">
                <circle class="rank-circle-rim" cx="-10" cy="8" r="40" />
                <circle class="rank-circle" cx="-10" cy="8" r="40" />
                <g class="rank-text">
                    <text x="-5" y="3" alignment-baseline="central" dominant-baseline="central" text-anchor="middle" data-testid="level-rank-icon">${percentage}%</text>
                    <text x="-2" y="-55" alignment-baseline="middle" dominant-baseline="middle" text-anchor="middle" class="stat bold" fill="#2f80ed">User's Quest Progress 🕹️</text>
                </g>
            </g>
    
            <svg x="0" y="0">
                <g transform="translate(0, 0)">
                    <g class="stagger" style="animation-delay: 450ms" transform="translate(25, 0)">
                        <text class="stat bold" y="12.5">Total Quests Completed 🎲:</text>
                        <text class="stat bold" x="199.01" y="12.5" data-testid="stars">${(userDocument.user_data.completed && userDocument.user_data.completed !== undefined) ? userDocument.user_data.completed : 0}</text>
                    </g>
                </g>
                <g transform="translate(0, 25)">
                    <g class="stagger" style="animation-delay: 600ms" transform="translate(25, 0)">
                        <text class="stat bold" y="12.5">Total Points✨:</text>
                        <text class="stat bold" x="199.01" y="12.5" data-testid="commits">${userDocument.user_data.points}</text>
                    </g>
                </g>
                <g transform="translate(0, 50)">
                    <g class="stagger" style="animation-delay: 750ms" transform="translate(25, 0)">
                        <text class="stat bold" y="12.5">User's Level 🌟:</text>
                        <text class="stat bold" x="199.01" y="12.5" data-testid="prs">${Math.ceil(userDocument.user_data.xp/100)}</text>
                    </g>
                </g>
            </svg>
        </g>
    </svg>
    `;
  // write to file
  const{data:{sha}} = await context.octokit.repos.getContent({
    owner,
    repo,
    path: 'userCards/draft.svg'
  });
  // todo: change
  context.octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'userCards/draft.svg',
    message: 'Update draft.svg',
    content: Buffer.from(svgContent).toString('base64'),
    committer: {
      name: 'gitBot',
      email: 'connor.nicolai.aiton@gmail.com'
    },
    author: {
      name: 'caiton1',
      email: 'connor.nicolai.aiton@gmail.com'
    },
    sha: sha
  });

  } catch(error) {
    console.error('Error generating SVG:', error);
  }
  
}

async function updateReadme(user, owner, repo, context, db)
{
  // generate new svg
  await generateSVG(user, owner, repo, context, db);
  // updated content, user card, quests and tasks, quest map
  var newContent = `
  User Stats:<br>
  ![User Draft Stats](/userCards/draft.svg)

  `;
  newContent += await displayQuests(user, db);

  try {
    const {data: {sha}} = await context.octokit.repos.getReadme({
      owner,
      repo,
      path: 'README.md'
    });
    // todo: change
    context.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: 'Update README.md',
      content: Buffer.from(newContent).toString('base64'),
      committer: {
        name: 'gitBot',
        email: 'connor.nicolai.aiton@gmail.com'
      },
      author: {
        name: 'caiton1',
        email: 'connor.nicolai.aiton@gmail.com'
      },
      sha: sha
    });
  } catch(error){
    console.error('Error updating the README: ' + error);
  }
}

async function displayQuests(user, db)
{
  // get user data
  const userData = await db.downloadUserData(user);
  var task = '';
  var quest = '';
  var completed = '';
  // TODO: add exception handling
  if(userData.user_data.current !== undefined){
    task = userData.user_data.current.task;
    quest = userData.user_data.current.quest;
  }

  if(userData.user_data.completed !== undefined){
    completed = userData.user_data.completed;
  }
  var response = `
Quests:
[Go to issues page and create new issue](https://github.com/caiton1/probot-test/issues)
1. type /new_user
2. type /accept Q1

Quests Map:
![Quest Map](/map/QuestMap.png)
  `;

  // generate string based on quest

  // TODO, add map link also make more efficient, because this is ew
  if(quest === "Q1"){
    response = `
Quests:
  - Quest 1 - Exploring the Github World
`;
    if(task === "T1"){
    response += `    - Task 1 - Find the issue tracker
    - Task 2 - Find the pull-request menu
    - Task 3 - Find the fork button
    - Task 4 - Find the readme file
    - Task 5 - Find the contributors`;
    }else if(task === "T2"){
    response += `    - ~Task 1 - Find the issue tracker~
    - Task 2 - Find the pull-request menu
    - Task 3 - Find the fork button
    - Task 4 - Find the readme file
    - Task 5 - Find the contributors`;
    }else if(task === "T3"){
    response += `    - ~Task 1 - Find the issue tracker~
    - ~Task 2 - Find the pull-request menu~
    - Task 3 - Find the fork button
    - Task 4 - Find the readme file
    - Task 5 - Find the contributors`;
    }else if(task === "T4"){
    response += `    - ~Task 1 - Find the issue tracker~
    - ~Task 2 - Find the pull-request menu~
    - ~Task 3 - Find the fork button~
    - Task 4 - Find the readme file
    - Task 5 - Find the contributors`;
    }else if(task === "T5"){
    response += `    - ~Task 1 - Find the issue tracker~
    - ~Task 2 - Find the pull-request menu~
    - ~Task 3 - Find the fork button~
    - ~Task 4 - Find the readme file~
    - Task 5 - Find the contributors`;
    }

    if(completed !== '' && completed.includes('Q2')){
      response += '\n  - ~Quest 2 - Introducing yourself self to the community~\n'; 
    }
    else{
      response += '\n  - Quest 2 - Introducing yourself self to the community\n'; 
    }
    if(completed !== '' && completed.includes('Q3')){
      response += '\n  - ~Quest 3 - Introducing yourself self to the community~\n';
    }
    else{
      response += '\n  - Quest 3 - Introducing yourself self to the community\n';
    }
  } else if(quest === "Q2"){
    // quest 2 and its tasks
  } else if(quest === "Q3"){
    // quest 3 and its tasks
  }


  return response;
  // return new string
}

export const questFunctions = {
  acceptQuest,
  removeQuest,
  completeQuest,
  completeTask,
  displayQuests,
  createQuestEnvironment,
  validateTask,
  updateReadme,
  getIssueCount,
  getPRCount
};

