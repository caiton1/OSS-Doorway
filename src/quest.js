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

// Will also start the tasks associated with quest
async function acceptQuest(context, db, user, quest) {
    const { owner, repo } = context.repo();
    try {
        // Read in available qeusts and validate requested quest
        if (quest in quests) {
            const user_data = await db.downloadUserData(user);
            if (!user_data.user_data.accepted) {
                user_data.user_data.accepted = {};
            }
            // if user has not accepted quest
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

// removes the current accepted quest, however not the completed quests
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

export async function completeTask(db, user, quest, task, context) {
    const { owner, repo } = context.repo();
    try {
        const quests = JSON.parse(fs.readFileSync(questFilePath, "utf8"));
        const user_data = await db.downloadUserData(user);

        const points = quests[quest][task].points;
        const xp = quests[quest][task].xp;

        if (
            user_data.user_data.accepted &&
            user_data.user_data.accepted[quest] &&
            user_data.user_data.accepted[quest][task]
        ) {
            user_data.user_data.accepted[quest][task].completed = true;
            user_data.user_data.points += points;
            user_data.user_data.xp += xp;

            const tasks = Object.keys(quests[quest]).filter((t) => t !== "metadata");
            const taskIndex = tasks.indexOf(task);

            user_data.user_data.completion = (taskIndex + 1) / tasks.length;
            user_data.user_data.completion =
                Math.round(user_data.user_data.completion * 100) / 100; // two decimal places

            if (taskIndex !== -1 && taskIndex < tasks.length - 1) {
                const nextTask = tasks[taskIndex + 1];
                user_data.user_data.current.task = nextTask;
                await db.updateData(user_data);
            } else {
                user_data.user_data.current.task = null;
                await db.updateData(user_data);
                await completeQuest(db, user, quest, context);
            }

            await context.octokit.issues.update({
                owner: owner,
                repo: repo,
                issue_number: context.issue().issue_number,
                state: "closed",
            });

            if (user_data.user_data.current) {
                await createQuestEnvironment(
                    quest,
                    user_data.user_data.current.task,
                    context
                );
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

// completes quests and does nessessary DB operations 
// TODO: instead of wiping quest, move to entire quest to completed
async function completeQuest(db, user, quest, context) {
    try {
        const user_data = await db.downloadUserData(user);
        // user has the requested quest accepted
        if (user_data.user_data.accepted && user_data.user_data.accepted[quest]) {
            const tasks_completed = Object.values(
                user_data.user_data.accepted[quest]
            ).every((task) => task.completed); // all tasks completed

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

                // reset quest accepted and current
                await removeQuest(db, user);

                if (quest === "Q1") {
                    await acceptQuest(context, db, user, "Q2");
                }
                if (quest === "Q2") {
                    await acceptQuest(context, db, user, "Q3");
                }

                return true; // Quest successfully completed
            }
        }
    } catch (error) {
        console.error("Error completing quest:", error);
    }
    return false; // Quest not completed
}

async function createQuestEnvironment(quest, task, context) {
    const { owner, repo } = context.repo();
    var response = questResponse;
    var title = quests;
    var flag = false; // check for if task is selected
    // most will be creating an issue with multiple choice

    try {
        // using global var quests and checking if in quest_config
        if (quests[quest]) {
            const questData = quests[quest];
            response = response[quest];
            if (questData[task]) {
                response = response[task].accept;
                title = questData[task].desc;
            }
        }

        // link to OSS repo
        response += `\n\n[Click here to start](https://github.com/${ossRepo})`;

        // create issue for task interaction
        const issueComment = context.issue({
            body: response,
        });
        // new issue for new task
        await context.octokit.issues.create({
            owner: owner,
            repo: repo,
            title: `❗ ${quest} ${task}: ` + title,
            body: response,
        });
    } catch (error) {
        console.error("Error creating new issue: ", error);
    }
}

async function validateTask(db, context, user) {
    try {
        var user_data = await db.downloadUserData(user);
        console.log(user)

        // TODO: add exception handling
        const selectedIssue = user_data.user_data.selectedIssue;
        const task = user_data.user_data.current.task;
        const quest = user_data.user_data.current.quest;
        const taskHandler = taskMapping[quest][task];
        var response = questResponse[quest][task];
        const { owner, repo } = context.repo();

        response = await taskHandler(db, user, context, ossRepo, response, selectedIssue);

        response += `\n\nReturn [Home](https://github.com/${owner}/${repo})`;

        var issueComment = context.issue({
            body: response,
        });
        await context.octokit.issues.createComment(issueComment);
    } catch (error) {
        console.error("Error validating task: " + error);
    }
}

async function generateSVG(user, owner, repo, context, db) {
    try {

        // user data
        const userDocument = await db.downloadUserData(user);
        const percentage = userDocument.user_data.completion * 100;
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference * (1 - percentage / 100);
        const numCompleted = 9999; // TODO: get num quest completed
        const points = Number(userDocument.user_data.points); // TODO: get num points completed
        const level = Math.ceil(Number(userDocument.user_data.xp)/100); // TODO: calculate level

        // SVG content
        const svgTemplate = fs.readFileSync(svgTemplatePath, 'utf-8')
            .replace('${circumference}', circumference)
            .replace('${offset}', offset)
            .replace('${percentage}', percentage)
            .replace('${numCompleted}', numCompleted)
            .replace('${points}', points)
            .replace('${level}', level);

        // Generate a unique filename based on the current timestamp to cache bust github
        const timestamp = Date.now();
        const newFilename = `userCards/draft-${timestamp}.svg`;

        // Write to the new file
        await context.octokit.repos.createOrUpdateFileContents({
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
    var content = fs.readFileSync(defaultReadmePath, 'utf-8');

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

// Temp solution to map feature, avoiding github cache TTL
function getMapLink(userData, quest, task, completed) {
    if (!userData || !userData.user_data) {
        return `${mapRepoLink}/Q1.png`; // Return default map link if userData or accepted quests are not available
    }

    // if all quests completed
    if (completed.length === 3) { // TODO: remove hard code, improve mess of a function
        return `${mapRepoLink}/F.png`;
    }
    if (quest === "") {
        // Check if the current quest is completed and find the next available quest
        if (completed !== "") {
            const accepted_quests = Object.keys(userData.user_data.accepted);
            const currentQuestIndex = accepted_quests.indexOf(completed);
            const nextQuest =
                currentQuestIndex !== -1 && currentQuestIndex + 1 < accepted_quests.length
                    ? accepted_quests[currentQuestIndex + 1]
                    : null;

            // Return the map link for the next available quest if exists
            if (nextQuest) {
                return `${mapRepoLink}/${nextQuest}.png`;
            }
        }
        return `${mapRepoLink}/Q1.png`; // Fall through if no next quest is available or no quest is currently set
    }

    const acceptedTasks = userData.user_data.accepted[quest];
    if (!acceptedTasks || Object.keys(acceptedTasks).length === 0) {
        return `${mapRepoLink}/${quest}.png`; // Quest image when no task is started
    }

    const completedTasks = Object.values(acceptedTasks).filter(
        (t) => t.completed
    ).length;
    const totalTasks = Object.keys(acceptedTasks).length;

    if (completedTasks === 0) {
        return `${mapRepoLink}/${quest}.png`; // Quest initial map
    } else if (completedTasks === totalTasks) {
        return `${mapRepoLink}/${quest}F.png`; // Quest completed map
    } else {
        return `${mapRepoLink}/${quest}${task}.png`; // Specific task image
    }
}

async function displayQuests(user, db, context) {
    // Get user data
    const repo = context.issue();
    const userData = await db.downloadUserData(user);
    var task = "";
    var quest = "";
    var completed = "";

    // TODO: add exception handling
    if (userData.user_data.current !== undefined) {
        task = userData.user_data.current.task;
        quest = userData.user_data.current.quest;
    }

    if (userData.user_data.completed !== undefined) {
        completed = userData.user_data.completed;
    }
    // Determine the map link
    const mapLink = getMapLink(userData, quest, task, completed);

    var response = ``;
    // TODO: get from json, not hardcode
    const quests = {
        Q1: {
            title: "Quest 1 - Exploring the Github World",
            tasks: [
                "Explore the issue tracker",
                "Explore the pull-request menu",
                "Explore the fork button",
                "Explore the readme file",
                "Explore the contributors",
            ],
        },
        Q2: {
            title: "Quest 2 - Introducing yourself to the community",
            tasks: [
                "Choose an issue that you would like to work with",
                "Assign your user to work on the issue",
                "Post a comment in the issue introducing yourself",
                "Mention a contributor that has most recently been active in the project to help you solve the issue",
            ],
        },
        Q3: {
            title: "Quest 3 - Making your first contribution",
            tasks: [
                "Solve the issue (upload a file)",
                "Submit a pull request",
                "Close the issue",
            ],
        },
    };

    if (completed !== "" && completed.includes("Q1")) {
        response += "\n  - ~Quest 1 - Exploring the GitHub World~\n";
    }
    if (completed !== "" && completed.includes("Q2")) {
        response += "\n  - ~Quest 2 - Introducing yourself to the community~\n";
    }
    if (completed !== "" && completed.includes("Q3")) {
        response += "\n  - ~Quest 3 - Making your first contribution~\n";
    }
    response += "\n";
    if (quest in quests) {
        const currentQuest = quests[quest];
        response += `Quest:\n  - ${currentQuest.title}\n`;
        currentQuest.tasks.forEach((desc, index) => {
            const taskNum = `T${index + 1}`;
            const isCompleted =
                userData.user_data.accepted[quest] &&
                userData.user_data.accepted[quest][taskNum] &&
                userData.user_data.accepted[quest][taskNum].completed;
            if (isCompleted) {
                response += `    - ~Task ${index + 1} - ${desc}~ [COMPLETED]\n`;
            } else if (task === taskNum) {
                response += `    - Task ${index + 1} - ${desc} [[Click here to start](https://github.com/${repo.owner
                    }/${repo.repo}/issues/${repo.issue_number + 1})]\n`;
            } else {
                response += `    - Task ${index + 1} - ${desc}\n`;
            }
        });
    }
    response += `\nQuests Map:\n![Quest Map](${mapLink})`;
    return response;
}

async function updateReadme(user, owner, repo, context, db) {
    try {
        // Generate new svg and quest list (returns link to unique svg)
        const newSVG = await generateSVG(user, owner, repo, context, db);
        const questList = await displayQuests(user, db, context);

        // README
        const newContent = fs.readFileSync(progressReadmePath, 'utf8')
            .replace('${newSVG}', newSVG)
            .replace('${questList}', questList);

        // Get the origional README
        const readmeResponse = await context.octokit.repos.getReadme({
            owner,
            repo,
            path: "README.md",
        });

        // README sha
        const { data: { sha }, } = readmeResponse;

        // Verify the sha 
        if (!sha) {
            throw new Error("README sha is undefined or null");
        }

        // Update the README file
        await context.octokit.repos.createOrUpdateFileContents({
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

export const questFunctions = {
    completeTask,
    acceptQuest,
    removeQuest,
    completeQuest,
    displayQuests,
    createQuestEnvironment,
    validateTask,
    closeIssues,
    resetReadme,
    updateReadme
};
