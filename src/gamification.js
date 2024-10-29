import fs from "fs";
import { taskMapping } from "./taskMapping.js";

// Files from context of file accessing exported functions (from viewpoint of index.js) when using I/O functions
const questFilePath = "./src/config/quest_config.json";
const responseFilePath = "./src/config/response.json";

const svgTemplatePath = "./src/templates/template.svg";
const defaultReadmePath = "./src/templates/main.md";
const progressReadmePath = "./src/templates/progress.md";

const questResponse = JSON.parse(fs.readFileSync(responseFilePath, "utf-8"));
const quests = JSON.parse(fs.readFileSync(questFilePath, "utf8"));

const ossRepo = quests.oss_repo;
const mapRepoLink = quests.map_repo_link;

//////////////////////////////////
/* ----- QUEST MANAGEMENT ----- */
//////////////////////////////////

// Will also start the first task associated with quest
function acceptQuest(context, user_data, quest) {
  const { owner, repo } = context.repo();
  try {
    // Read in available qeusts and validate requested quest
    if (quest in quests) {
      if (!user_data.accepted) {
        user_data.accepted = {};
      }
      // if user has not accepted quest
      if (!Object.keys(user_data.accepted).length) {
        user_data.accepted[quest] = {};
        // add list of tasks to user in database
        for (const task in quests[quest]) {
          if (task !== "metadata") {
            user_data.accepted[quest][task] = {
              completed: false,
              attempts: 0,
              hints: 0,
              timeStart: 0,
              timeEnd: 0.0,
              issueNum: 0,
            };
          }
          // track current progress
          user_data.current = {
            quest: quest,
            task: "T1", // depending on how indexing works in validate task, may need to change to 0
          };
          user_data.completion = 0;
        }

        createQuestEnvironment(user_data, quest, "T1", context);
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error accepting quest: " + error);
    return false;
  }
}

export async function completeTask(user_data, quest, task, context, db) {
  const { owner, repo } = context.repo();
  try {
    const quests = JSON.parse(fs.readFileSync(questFilePath, "utf8"));

    const points = quests[quest][task].points;
    const xp = quests[quest][task].xp;

    // check user accepted quest and task
    if (
      user_data.accepted &&
      user_data.accepted[quest] &&
      user_data.accepted[quest][task]
    ) {
      // change quest data to complete
      user_data.accepted[quest][task].completed = true;
      user_data.accepted[quest][task].timeEnd = Date.now();
      user_data.accepted[quest][task].issueNum = context.issue().issue_number;

      user_data.points += points;
      user_data.xp += xp;

      // get list of tasks from quest in json except for metadata
      const tasks = Object.keys(quests[quest]).filter((t) => t !== "metadata");
      const taskIndex = tasks.indexOf(task);

      user_data.completion = (taskIndex + 1) / tasks.length;
      user_data.completion = Math.round(user_data.completion * 100) / 100; // two decimal places

      // more tasks
      if (taskIndex !== -1 && taskIndex < tasks.length - 1) {
        const nextTask = tasks[taskIndex + 1];
        user_data.current.task = nextTask;
        // last task
      } else {
        user_data.current.task = null;
        completeQuest(user_data, quest, context);
      }

      context.octokit.issues.update({
        owner: owner,
        repo: repo,
        issue_number: context.issue().issue_number,
        state: "closed",
      });

      if (user_data.current && user_data.current.task != null) {
        createQuestEnvironment(
          user_data,
          quest,
          user_data.current.task,
          context
        );
      }


      db.updateData(user_data); // refresh points

      await updateReadme(owner, repo, context, user_data, db);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error completing task:", error);
    return false;
  }
}

function completeQuest(user_data, quest, context) {
  try {
    // ASSUMES that user_data.accepted exsists (pre existing check in parent function)
    // all tasks completed
    const tasks_completed = Object.values(user_data.accepted[quest]).every(
      (task) => task.completed
    );

    // clear quest and task
    if (tasks_completed) {
      if (!user_data.completed) {
        user_data.completed = {};
      }

      // add quest to users completed list
      user_data.completed[quest] = user_data.accepted[quest];

      delete user_data.accepted;
      delete user_data.current;

      // hardcoded quest logic (its a small prototype 👀)
      if (quest === "Q0") {
        acceptQuest(context, user_data, "Q1");
      }
      if (quest === "Q1") {
        acceptQuest(context, user_data, "Q2");
      }
      if (quest === "Q2") {
        acceptQuest(context, user_data, "Q3");
      }

      return true; // Quest successfully completed
    }
  } catch (error) {
    console.error("Error completing quest:", error);
  }
  return false; // Quest not completed
}

// geenrates "quest" by generating a github issues with the quest details
async function createQuestEnvironment(user_data, quest, task, context) {
  const { owner, repo } = context.repo();
  var response = questResponse;
  var title = quests;
  var flag = false;
  // most will be creating an issue with multiple choice

  try {
    // using global var quests and checking if in quest_config
    if (quests[quest]) {
      const questData = quests[quest];
      response = response[quest];
      if (questData[task]) {
        user_data.accepted[quest][task].timeStart = Date.now();
        response = response[task].accept;
        title = questData[task].desc;
      }

      // link to OSS repo
      response += `\n\n[Click here to start](https://github.com/${ossRepo})`;

      // create issue for task interaction
      const issueComment = context.issue({
        body: response,
      });
      // new issue for new task
      context.octokit.issues.create({
        owner: owner,
        repo: repo,
        title: `❗ ${quest} ${task}: ` + title,
        body: response,
      });
    }
  } catch (error) {
    console.error("Error creating new issue: ", error);
  }
}
async function giveHint(user_data, context, db){
  // user_data.current.(quest, hint)
  const quest = user_data.user_data.current.quest;
  const task = user_data.user_data.current.task;
  var response = '';

  // user hints used
  if (!("hints" in user_data.user_data.accepted[quest][task])){
    user_data.user_data.accepted[quest][task].hints = 0;
  }
  const hints = user_data.user_data.accepted[quest][task].hints;
  const hintResponse = await db.findHintResponse(quest, task, hints + 1)

  if(hintResponse == null){
    response = "There are no more hints!";
  }
  else
  {
    response += `${hintResponse}`;
    user_data.user_data.points -= 5; // arbitrary for now, but stored in DB
    user_data.user_data.accepted[quest][task].hints += 1;
  }
  

  var issueComment = context.issue({
    body: response,
  });
  await context.octokit.issues.createComment(issueComment);

}

// 

// validates task by using object oriented function mapping from the taskMapping.js file
async function validateTask(user_data, context, user, db) {
  try {
    // issue context
    const selectedIssue = user_data.selectedIssue;
    const task = user_data.current.task;
    const quest = user_data.current.quest;
    const { owner, repo } = context.repo();

    // incriment attempt
    user_data.accepted[quest][task].attempts += 1;
    // streak
    if (user_data.streakCount != null) {
      // no failed attempt
      if (user_data.accepted[quest][task].attempts <= 1) {
        user_data.currentStreak += 1;
        // check if streak is full
        // TODO: remove hardcode
        if (user_data.currentStreak > 2) {
          user_data.currentStreak = 0;
          user_data.streakCount += 1;
        }
      }
      // failed, reset streak
      else {
        user_data.currentStreak = 0;
      }
    } else {
      // no previous streak
      user_data.streakCount = 0;
      user_data.currentStreak = 1;
    }

    // validate current task
    const taskHandler = taskMapping[quest][task]; // function mapped through dictionary
    var response = questResponse[quest][task];
    response = await taskHandler(
      user_data,
      user,
      context,
      ossRepo,
      response,
      selectedIssue,
      db
    );
    response += `\n\nReturn [Home](https://github.com/${owner}/${repo})`;

    var issueComment = context.issue({
      body: response,
    });
    await context.octokit.issues.createComment(issueComment);
  } catch (error) {
    console.error("Error validating task: " + error);
  }
}

/////////////////////////////////
/* ----- FRONT END (ish) ----- */
/////////////////////////////////

// TODO: do not display on quest 0
async function generateSVG(owner, repo, context, user_data, db) {
  try {
    // math for svg dials and numbers (The user banner that will appear on the front page)
    var user_score = 0
    if(user_data && user_data.points){
      user_score = await db.downloadUserData(repo);
    }
    const currentPos = user_score && user_score.userPosition ? user_score.userPosition : -1;


    const percentage = user_data.completion * 100;
    const currentStreak =
      user_data && user_data.currentStreak ? user_data.currentStreak : 0;
    const streakCount =
      user_data && user_data.streakCount ? user_data.streakCount : 0;

    const radius = 40;

    const rankCircumference = 2 * Math.PI * radius;
    const rankOffset = rankCircumference * (1 - percentage / 100);
    const streakCircumference = 2 * Math.PI * radius;
    const streakOffset = rankCircumference * (1 - currentStreak / 3);

    const numCompleted =
      user_data && user_data.completed
        ? Object.keys(user_data.completed).length
        : 0;
    const points = Number(user_data.points);
    const level = Math.ceil(Number(user_data.xp) / 100);

    const badgeDescriptions = {
      Q0: "Configurator ⚙️",
      Q1: "Explorer 🚀",
      Q2: "Builder 🏗️",
      Q3: "Contributor 🥇",
    };

    // List of completed quests (Q1, Q2, Q3) to later display and use for logic
    const completedQuests =
      user_data.completed && user_data.completed !== undefined
        ? Object.keys(user_data.completed).filter((quest) => {
          const tasks = user_data.completed[quest];
          return Object.values(tasks).every((task) => task.completed);
        })
        : [];

    let formattedBadges = "";
    let userScore = "";
    let offset = 75; // vertical spacing between entries on svg

    // TODO: user points / position preference
    if (user_data.display_preference && user_data.display_preference.includes("score")) {
      userScore = `
          <g transform="translate(0, ${offset})">
              <g class="stagger" style="animation-delay: 600ms" transform="translate(25, 0)">
                  <text class="stat bold" y="12.5">Total Points✨:</text>
                  <text class="stat bold" x="199.01" y="12.5" data-testid="commits">${points}</text>
              </g>
          </g>
          <g transform="translate(0, ${offset + 25})">
              <g class="stagger" style="animation-delay: 750ms" transform="translate(25, 0)">
                  <text class="stat bold" y="12.5">Current Position:</text>
                  <text class="stat bold" x="199.01" y="12.5" data-testid="prs">${currentPos}</text>
              </g>
          </g>
    `
      offset += 50;
    }

    const badgeCount = `
      <g transform="translate(0, ${offset})">
          <g class="stagger" style="animation-delay: 750ms" transform="translate(25, 0)">
              <text class="stat bold" y="12.5">Badges:</text>
              <text class="stat bold" x="199.01" y="12.5" data-testid="prs">${completedQuests.length}</text>
          </g>
      </g>
    `
    offset += 25

    for (let i = 0; i < completedQuests.length; i++) {
      const badge = completedQuests[i];
      formattedBadges += `
            <g transform="translate(0, ${offset})">
                <g class="stagger" style="animation-delay: 750ms" transform="translate(25, 0)">
                    <text class="stat bold" y="12.5">  - ${badgeDescriptions[badge]}</text>
                    <text class="stat bold" x="199.01" y="12.5" data-testid="prs"></text>
                </g>
            </g>
            `;
      offset += 25;
    }

    // SVG content
    const svgTemplate = fs
      .readFileSync(svgTemplatePath, "utf-8")
      .replaceAll("${rankCircumference}", rankCircumference)
      .replaceAll("${rankOffset}", rankOffset)
      .replaceAll("${streakCircumference}", streakCircumference)
      .replaceAll("${streakOffset}", streakOffset)
      .replaceAll("${currentStreak}", currentStreak)
      .replaceAll("${streakCount}", streakCount)
      .replaceAll("${percentage}", percentage)
      .replaceAll("${numCompleted}", numCompleted)
      .replaceAll("${userScore}", userScore)
      .replaceAll("${level}", level)
      .replaceAll("${formattedBadges}", formattedBadges)
      .replaceAll("${badgeCount}", badgeCount)
      .replaceAll("${viewHeight}", 220 + 25 * completedQuests.length);

    // Generate a unique filename based on the current timestamp to cache bust github
    const timestamp = Date.now();
    const newFilename = `userCards/draft-${timestamp}.svg`;

    // non synchronus file update
    context.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: newFilename,
      message: `Update ${newFilename}`,
      content: Buffer.from(svgTemplate).toString("base64"),
      committer: {
        name: "gitBot",
        email: "connor.nicolai.aiton@gmail.com",
      },
      author: {
        name: "caiton1",
        email: "connor.nicolai.aiton@gmail.com",
      },
    });

    return newFilename;
  } catch (error) {
    console.error("Error generating SVG:", error);
  }
}

// Temp solution to map feature, avoiding github cache TTL
function getMapLink(user_data, quest, task, completed) {
  if (!user_data) {
    return `${mapRepoLink}/Q1.png`; // Return default map link if userData or accepted quests are not available
  }

  // if all quests completed
  if (Object.keys(completed).length === 3) {
    return `${mapRepoLink}/F.png`;
  }
  if (quest === "") {
    // Check if the current quest is completed and find the next available quest
    if (completed !== "" && user_data.accepted != null) {
      const accepted_quests = Object.keys(user_data.accepted);
      const currentQuestIndex = accepted_quests.indexOf(completed);
      const nextQuest =
        currentQuestIndex !== -1 &&
          currentQuestIndex + 1 < accepted_quests.length
          ? accepted_quests[currentQuestIndex + 1]
          : null;

      // Return the map link for the next available quest if exists
      if (nextQuest) {
        return `${mapRepoLink}/${nextQuest}.png`;
      }
    }
    return `${mapRepoLink}/Q1.png`; // Fall through if no next quest is available or no quest is currently set
  }

  const acceptedTasks = user_data.accepted[quest];
  if (!acceptedTasks || Object.keys(acceptedTasks).length === 0) {
    return `${mapRepoLink}/${quest}.png`; // Quest image when no task is started
  }

  const completedTasks = Object.values(acceptedTasks).filter(
    (t) => t.completed
  ).length;
  const totalTasks = Object.keys(acceptedTasks).length;

  if (completedTasks === 0) {
    return `${mapRepoLink}/${quest}T1.png`; // Quest initial map
  } else if (completedTasks === totalTasks) {
    return `${mapRepoLink}/${quest}F.png`; // Quest completed map
  } else {
    return `${mapRepoLink}/${quest}${task}.png`; // Specific task image
  }
}

function displayQuests(user_data, context) {
  // Get user data
  const repo = context.issue();
  var task = "";
  var quest = "";
  var completed = "";
  var response = ``;

  if (user_data.current !== undefined) {
    task = user_data.current.task;
    quest = user_data.current.quest;
  }

  if (user_data.completed !== undefined) {
    completed = user_data.completed;
  }

  const mapLink = getMapLink(user_data, quest, task, completed);

  const questData = quests;
  // accepted/ current
  if (quest in questData) {
    response += `⚙️ Current Quest: \n  - ${quest} - ${questData[quest].metadata.title}\n`;
    for (let taskKey in questData[quest]) {
      if (taskKey === "metadata") continue;
      // check if user has completed or not
      // if completed, strikeout but keep the issue number link
      let isCompleted = user_data.accepted[quest]?.[taskKey].completed ?? false;

      if (isCompleted) {
        response += `    -  ~${taskKey} - ${questData[quest][taskKey].desc}~ [[COMPLETED](https://github.com/${repo.owner}/${repo.repo}/issues/${user_data.accepted[quest][taskKey].issueNum})]\n`;
      } else if (task == taskKey) {
        response += `    - ${taskKey} - ${questData[quest][taskKey].desc
          } [[Click here to start](https://github.com/${repo.owner}/${repo.repo
          }/issues/${repo.issue_number + 1})]\n`; // WARNING, this is assuming user is responding on the last issue
      } else {
        response += `    - ${taskKey} - ${questData[quest][taskKey].desc}\n`;
      }
    }
    response += "\n";
  }

  // completed
  if (completed) {
    response += `✅ Completed Quests: \n`;
    for (let questKey in completed) {
      response += `  - ${questKey} - ${questData[questKey].metadata.title}\n`;
      for (let taskKey in questData[questKey]) {
        if (taskKey === "metadata") continue;
        response += `    - ~${taskKey} - ${questData[questKey][taskKey].desc}~ [[COMPLETED](https://github.com/${repo.owner}/${repo.repo}/issues/${user_data.completed[questKey][taskKey].issueNum})]\n`;
      }
    }
  }

  if (user_data.display_preference && user_data.display_preference.includes("map")) {
    response += `\nQuests Map:\n![Quest Map](${mapLink})`;
  }

  return response;
}

async function updateReadme(owner, repo, context, user_data, db) {
  try {
    // Generate new svg and quest list (returns link to unique svg)
    const newSVG = await generateSVG(owner, repo, context, user_data, db);
    const questList = displayQuests(user_data, context);

    // README
    const newContent = fs
      .readFileSync(progressReadmePath, "utf8")
      .replace("${newSVG}", newSVG)
      .replace("${questList}", questList);

    // Get the origional README
    const readmeResponse = await context.octokit.repos.getReadme({
      owner,
      repo,
      path: "README.md",
    });

    // README sha
    const {
      data: { sha },
    } = readmeResponse;

    // Verify the sha
    if (!sha) {
      throw new Error("README sha is undefined or null");
    }

    // Update the README file
    context.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "README.md",
      message: "Update README.md",
      content: Buffer.from(newContent).toString("base64"),
      committer: {
        name: "QuestBuddy",
        email: "naugitbot@gmail.com",
      },
      author: {
        name: "QuestBuddy",
        email: "naugitbot@gmail.com",
      },
      sha: sha,
    });
  } catch (error) {
    console.error("Error updating the README: " + error);
  }
}

///////////////////////////////////////////////////
/* ----- Repo/Org administration functions ----- */
///////////////////////////////////////////////////

async function closeIssues(context) {
  const issue = context.payload.issue;

  // Check if the comment contains the command to close all issues
  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;
  const currentIssueNumber = issue.number;

  // Fetch all issues in the repository
  const issues = await context.octokit.issues.listForRepo({
    owner,
    repo,
    state: "open", // Only fetch open issues since closed issues are already closed
  });

  // Iterate through the issues and close them except for the current issue
  for (const issue of issues.data) {
    if (issue.number !== currentIssueNumber) {
      try {
        // Close issue
        await context.octokit.issues.update({
          owner,
          repo,
          issue_number: issue.number,
          state: "closed",
        });
      } catch (error) {
        console.error(`Failed to close issue #${issue.number}:`, error);
      }
    }
  }
}

async function resetReadme(owner, repo, context) {
  var content = fs.readFileSync(defaultReadmePath, "utf-8");

  try {
    const {
      data: { sha },
    } = await context.octokit.repos.getReadme({
      owner,
      repo,
      path: "README.md",
    });
    await context.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "README.md",
      message: "Reseting README.md",
      content: Buffer.from(content).toString("base64"),
      committer: {
        name: "QuestBuddy",
        email: "naugitbot@gmail.com",
      },
      author: {
        name: "QuestBuddy",
        email: "naugitbot@gmail.com",
      },
      sha: sha,
    });
  } catch (error) {
    console.error("Error reseting the README: " + error);
  }
}

async function createRepos(context, org, users, db) {
  var success = [];
  var unsuccessful = [];
  const ossRepoData = ossRepo.split('/');

  for (const username of users) {
    try {
      console.log("creating user");
      // user exists on GitHub and not on database
      const userResponse = await context.octokit.users.getByUsername({
        username,
      });
      const exists = await db.userExists(username);
      if (userResponse.status === 200 && !exists) {
        // repo named after user
        const repoResponse = await context.octokit.repos.createInOrg({
          org,
          name: username,
          private: true,
          auto_init: true,
        });

        // invite user
        await context.octokit.repos.addCollaborator({
          owner: org,
          repo: username,
          username,
          permission: "triage",
        });
        console.log(ossRepoData[0]);
        console.log(ossRepoData[1]);
  
        // invite user to OSS Repo NOTE: bot will need access to OSS repo to create these issues and invite user
        await context.octokit.repos.addCollaborator({
          owner: ossRepoData[0],
          repo: ossRepoData[1],
          username,
          permission: "triage",
        });

        // create issue in OSS Repo with non-code contribution tag
        await context.octokit.issues.create({
          owner: ossRepoData[0],
          repo: ossRepoData[1],
          title: username,
          body: "The Readme file is currently lengthy and complex, making it challenging for newcomers to comprehend how to contribute effectively to the project.\n\nTo enhance accessibility and clarity, I propose relocating the Contributing section to the beginning of the Readme file and streamlining its content where feasible.\n\nI kindly request assistance from anyone willing to dedicate time to address this issue and improve the project's accessibility for all contributors. Thank you!",
          labels: ["non-code contribution"]
        })

        success.push(username);
      }
      // create issue inside new repo
      const issueResponse = await context.octokit.issues.create({
        owner: org,
        repo: username,
        title: "New User Setup",
        body: "Setting up new user repository.",
      });
      // inside issue, comment /new_user <username>
      await context.octokit.issues.createComment({
        owner: org,
        repo: username,
        issue_number: issueResponse.data.number,
        body: `/new_user ${username}`,
      });
      // close issue
      await context.octokit.issues.update({
        owner: org,
        repo: username,
        issue_number: issueResponse.data.number,
        state: "closed",
      });

    } catch (error) {
      // log errors for debugging
      context.log.error(
        `Error processing user '${username}': ${error.message}`
      );
      unsuccessful.push(username);
    }
  }
  return `User creation complete:\nSuccessful: ${success}\nError: ${unsuccessful}`;
}

async function deleteRepo(context, org, repo) {
  try {
    // Deletes a repository in the specified organization
    await context.octokit.repos.delete({
      owner: org,
      repo: repo
    });
    return `Repository ${repo} deleted successfully in organization ${org}`
  } catch (error) {
    return `Error deleting repository: ${error}`;
  }
}


export const gameFunction = {
  completeTask,
  acceptQuest,
  completeQuest,
  displayQuests,
  createQuestEnvironment,
  validateTask,
  closeIssues,
  resetReadme,
  updateReadme,
  createRepos,
  deleteRepo,
  giveHint
};
