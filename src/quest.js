import fs from "fs";
const questFilePath = "./src/available-quests.json";
const responseFilePath = "./src/response.json";
const configFilePath = "./src/config.json"
const questResponse = JSON.parse(fs.readFileSync(responseFilePath, "utf-8"));
const repoName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).repo;
const userName = JSON.parse(fs.readFileSync(configFilePath, "utf-8")).user;

async function acceptQuest(context, db, user, quest) {
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
        }
        await db.updateData(user_data);

        createQuestEnvironment(quest, "T1", context);

        return true;
      } else {
        // TODO: may later need to implement reason for false, like already accepted, or user doesnt exist
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
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

    if (user_data.user_data.accepted && user_data.user_data.accepted[quest]) {
      const tasks_completed = Object.values(
        user_data.user_data.accepted[quest]
      ).every((task) => task.completed);

      if (tasks_completed) {
        delete user_data.user_data.accepted[quest];
        if (!user_data.user_data.completed) {
          user_data.user_data.completed = [];
        }
        user_data.user_data.completed.push(quest);
        await db.updateData(user_data);
        // notify user of completed quest
        const issueComment = context.issue({
          // TODO, make more dynamic
          body:
            "You have successfully completed " +
            quest +
            "! Please reply with display to see avaialble quests.",
        });
        await context.octokit.issues.createComment(issueComment);
        return true; // Quest successfully completed
      }
    }
    return false; // Quest not completed
  } catch (error) {
    console.error("Error completing quest:", error);
    return false;
  }
}

async function completeTask(db, user, quest, task, context) {
  try {
    const quests = JSON.parse(fs.readFileSync(questFilePath, "utf8"));
    const user_data = await db.downloadUserData(user);

    const points = quests[quest][task].points;
    console.log(`User got ${points} points`);

    if (
      user_data.user_data.accepted &&
      user_data.user_data.accepted[quest] &&
      user_data.user_data.accepted[quest][task]
    ) {
      user_data.user_data.accepted[quest][task].completed = true;
      user_data.user_data.points += points; // Assuming there is a 'points' field

      // Update current task
      const tasks = Object.keys(quests[quest]).filter((t) => t !== "metadata"); // Exclude metadata
      const taskIndex = tasks.indexOf(task);
      if (taskIndex !== -1 && taskIndex < tasks.length - 1) {
        const nextTask = tasks[taskIndex + 1];
        user_data.user_data.current.task = nextTask;
      } else {
        // If there are no more tasks, set current to null
        user_data.user_data.current.task = null;
        // complete quest due to no more tasks to do
        completeQuest(db, user, quest, context);
      }

      // Update data
      await db.updateData(user_data);

      // Check if there is a next task in the quest
      if (user_data.user_data.current) {
        // Call createQuestEnvironment for the next task
        await createQuestEnvironment(
          quest,
          user_data.user_data.current.task,
          context
        );
      }

      return true; // Task completed
    }
    return false; // Task not completed
  } catch (error) {
    console.error("Error completing task:", error);
    return false;
  }
}

async function displayQuests(db, user) {
  try {
    const quests = JSON.parse(fs.readFileSync(questFilePath, "utf8"));
    const user_data = await db.downloadUserData(user);

    if (!user_data) {
      return "Please comment /new_user to create user";
    } else {
      const completed_quests = user_data.user_data.completed || [];
      let response = "Available quests:\n\n";
      for (const [questId, questData] of Object.entries(quests)) {
        if (!completed_quests.includes(questId)) {
          response += `${questId}: ${questData.metadata.title}\n`;
        }
      }
      // TODO: implement check for accepted quests and respond with status
      return (
        response +
        "\nPlease respond with /accept <Q# --> corresponding quest number>"
      );
    }
  } catch (error) {
    console.error("Error displaying quests:", error);
    return;
  }
}

async function createQuestEnvironment(quest, task, context) {
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

    await context.octokit.issues.createComment(issueComment);
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
  const user_data = await db.downloadUserData(user);
  // TODO: add exception handling
  const task = user_data.user_data.current.task;
  const quest = user_data.user_data.current.quest;
  var issueComment = context.payload.comment.body;
  var response = questResponse;

  if (quest === "Q1") {
    response = response.Quest1;
    if (task === "T1") {
      response = response.Task1;
      // Check issue tracker count
      const issueCount = await getIssueCount(repoName);
      if (issueCount !== null && context.payload.comment.body == issueCount) {
        response = response.successQ1T1;
        completeTask(db, user, "Q1", "T1", context);
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
        completeTask(db, user, "Q1", "T2", context);
      } else {
        response = response.errorQ1T2;
      }
    } else if (task === "T3") {
      response = response.Task3;
      // On fork or multiple choice
      const correctAnswer = "c"; // TODO: parameterize ??
      if (issueComment.toLowerCase().includes(correctAnswer)) {
        response = response.successQ1T3;
        completeTask(db, user, "Q1", "T3", context);
      } else {
        response = response.errorQ1T3;
      }
    } else if (task === "T4") {
      // Check issue body for a hint about readme
      const hint = "c"; 
      if (issueComment.toLowerCase().includes(hint)) {

        completeTask(db, user, "Q1", "T4", context);
        response = response.successQ1T4;
      } else {
        response = response.errorQ1T4;
      }
    } else if (task === "T5") {
      // Check for valid contributor name
      const correctCount = 633 // TODO: fix, issue with this one
      if (issueComment.toLowerCase().includes(correctCount)) {

        completeTask(db, user, "Q1", "T5", context);
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

async function generateSVG(user, db){
  try {
    // get user data
    const userDocument = await downloadUserData(user);
    console.log('Fetched user data :', userDocument);
    // svg styles
    const styles = `
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
          
          .username {
              font: 600 15px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: black;
          }

          .stat {
              font: 600 9px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: black;
          }

          .levels {
              font: 600 12px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: black;
          }

          @supports(-moz-appearance: auto) {
              /* Selector detects Firefox */
              .stat { font-size:12px; }
          }
          .stagger {
              opacity: 0;
              animation: fadeInAnimation 0.3s ease-in-out forwards;
          }
          .rank-text {
              font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: black;
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
              stroke-dasharray: 200;
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
                  stroke-dashoffset: 251.32741228718345;
              }
              to {
                  stroke-dashoffset: 151.89854433219094;
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
      `;
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
          <title id="titleId">User's Quest Stats</title>
          ${styles}
          <rect
          data-testid="card-bg"
          x="0.5"
          y="0.5"
          rx="4.5"
          height="99%"
          stroke="#e4e2e2"
          width="449"
          fill="white"
          stroke-opacity="1"
          />



          <!-- Displays User Stats -->
          <g data-testid="main-card-body" transform="translate(0, 75)">  
              <g data-testid="rank-circle" transform="translate(365, 30)">
                  <circle class="rank-circle-rim" cx="-300" cy="-20" r="58" />
                  <circle class="rank-circle" cx="17" cy="-282" r="58" />
                  <g class="rank-text">
                  <text x="-295" y="55" 
                      alignment-baseline="middle" 
                      dominant-baseline="middle" 
                      text-anchor="middle" 
                      class="username bold" 
                      fill="#2f80ed">
                      ${userDocument._id}
                  </text>
                  </g>
              </g>
          </g>

          <g data-testid="main-card-body" transform="translate(0, 75)">  
              <g data-testid="rank-circle" transform="translate(15, -40)">
              <circle r="50" cx="50" cy="50" fill="lightblue" />
          </g>
      </g>

          <!-- Quests Completed -->
          <g data-testid="main-card-body" transform="translate(0, 55)">
          <svg x="130" y="-29" width="550" height="550">

              <!-- width=3% is the 0% of bar-->
              <!-- width=33% is the all of bar-->
              <!-- 30 -->

              <!-- Level -->
              <g transform="translate(97, -5)">
                  <g class="stagger" style="animation-delay: 750ms" transform="translate(25, 0)">
                      <text class="stat  bold"  y="12.5">📊LEVEL:</text>
                      <text
                      class="stat  bold"
                      x="45"
                      y="12.5"
                      data-testid="prs">
                      ${userDocument.user_data.level}
                      </text>
                  </g>
              </g>


              <!-- XP -->
              <g transform="translate(165, -5)">
                  <g class="stagger" style="animation-delay: 750ms" transform="translate(25, 0)">
                      <text class="stat  bold"  y="12.5">✨XP:</text>
                      <text
                      class="stat  bold"
                      x="30"
                      y="12.5"
                      data-testid="prs">
                      ${userDocument.user_data.xp}
                      </text>
                  </g>
              </g>

              <!-- Gitcoins -->
              <g transform="translate(215, -5)">
                  <g class="stagger" style="animation-delay: 750ms" transform="translate(25, 0)">
                      <text class="stat  bold"  y="12.5">GITCOINS:</text>
                      <text
                      class="stat  bold"
                      x="50"
                      y="12.5"
                      data-testid="prs">
                      ${userDocument.user_data.gitcoins}
                      </text>
                  </g>
              </g>



              <!-- Quests Completed -->
              <text x="2" y="36" class="levels bold" fill="black">Quests Completed</text>
              <rect x="120" y="20" width="185" height="25" fill="white" rx="10" stroke="black" stroke-width="2"/>
              <rect x="123" y="22" width="3%" height="20" fill="#2f80ed" rx="10" class="questsCompletedBar"/>
              <text x="265" y="35" fill="black" dominant-baseline="middle">0%</text>

              <!-- Current Progress -->
              <text x="2" y="70" class="levels bold" fill="black">Current Progress</text>
              <rect x="120" y="55" width="188" height="25" fill="white" rx="10" stroke="black" stroke-width="2"/>
              <rect x="123" y="57" width="3%" height="20" fill="#2f80ed" rx="10" class="currentProgressBar"//>
              <text x="265" y="70" fill="black" dominant-baseline="middle">0%</text>

              <!-- Streak  -->
              <text x="2" y="105" class="levels bold" fill="black">Streak</text>
              <rect x="120" y="90" width="188" height="25" fill="white" rx="10" stroke="black" stroke-width="2"/>
              <rect x="123" y="92" width="3%" height="20" fill="#2f80ed" rx="10" class="streakBar"/>
              <text x="265" y="105" fill="black" dominant-baseline="middle">0%</text>

              <!-- Streak  -->
              <text x="2" y="145" class="levels bold" fill="black">Badges</text>
              <rect x="120" y="125" width="188" height="25" fill="white" rx="10" stroke="black" stroke-width="2"/>
              
          </svg>
        </g>
    </svg>`;
  // write to file
  const{data:{sha}} = await context.octokit.repos.getContents({
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

  } catch {
    console.error('Error generating SVG:', error);
  }
  
}

async function updateReadme(user, owner, repo, context, db)
{
  // generate new svg

  // updated content, user card, quests and tasks, quest map
  var newContent = `
  Testing User Card Stats Here:<br>
  ![User Draft Stats](/userCards/draft.svg)
  
  Quests:
  [See current quest in issues](https://github.com/caiton1/probot-test/issues)
  
  Quests Map:
  ![Quest Map](/map/QuestMap.png)`
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

