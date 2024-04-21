import fs from 'fs';
const questFilePath = './src/available-quests.json';
const responseFilePath = './src/responses.json';
const questResponse = JSON.parse(fs.readFileSync(responseFilePath, 'utf-8'));


async function acceptQuest(context, db, user, quest) {
    try {
        // Read in available qeusts and validate requested quest
        const quests = JSON.parse(fs.readFileSync(questFilePath, 'utf8'));
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
                    if (task !== 'metadata') {
                        user_data.user_data.accepted[quest][task] = { completed: false };
                    }
                    // track current progress
                    user_data.user_data.current = {
                        quest: quest,
                        task: 'T1' // TODO: depending on how indexing works in validate task, may need to change to 0
                    }; 
                }
                await db.updateData(user_data);

                createQuestEnvironment(quest, 'T1', context);

                return true;
            } 
            else {
                // may later need to implement reason for false, like already accepted 
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
        console.error('Error removing quest:', error);
        return false;
    }
}

async function completeQuest(db, user, quest, context) {
    try {
        const user_data = await db.downloadUserData(user);

        if (user_data.user_data.accepted && user_data.user_data.accepted[quest]) {
            const tasks_completed = Object.values(user_data.user_data.accepted[quest]).every(task => task.completed);

            if (tasks_completed) {
                delete user_data.user_data.accepted[quest];
                if (!user_data.user_data.completed) {
                    user_data.user_data.completed = [];
                }
                user_data.user_data.completed.push(quest);
                await db.updateData(user_data);
                // notify user of completed quest
                const issueComment = context.issue({
                    body: 'You have successfully completed ' + quest + '! Please reply with display to see avaialble quests.'
                });
                await context.octokit.issues.createComment(issueComment);
                return true; // Quest successfully completed
            }
        }
        return false; // Quest not completed
    } catch (error) {
        console.error('Error completing quest:', error);
        return false;
    }
}

async function completeTask(db, user, quest, task, context) {
    try {
        const quests = JSON.parse(fs.readFileSync(questFilePath, 'utf8'));
        const user_data = await db.downloadUserData(user);

        const points = quests[quest][task].points;
        console.log(`User got ${points} points`);

        if (user_data.user_data.accepted && user_data.user_data.accepted[quest] && user_data.user_data.accepted[quest][task]) {
            user_data.user_data.accepted[quest][task].completed = true;
            user_data.user_data.points += points; // Assuming there is a 'points' field

            // Update current task
            const tasks = Object.keys(quests[quest]).filter(t => t !== 'metadata'); // Exclude metadata
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
            
            // notify user of completed task
            const issueComment = context.issue({
                body: 'You have successfully completed the task!' // TODO: dynamically insert the task that is completed
              });
              await context.octokit.issues.createComment(issueComment);

            // Check if there is a next task in the quest
            if (user_data.user_data.current) {
                // Call createQuestEnvironment for the next task
                await createQuestEnvironment(quest, user_data.user_data.current.task, context);
            }

            return true; // Task completed
        }
        return false; // Task not completed
    } catch (error) {
        console.error('Error completing task:', error);
        return false;
    }
}

async function displayQuests(db, user) {
    try {
        const quests = JSON.parse(fs.readFileSync(questFilePath, 'utf8'));
        const user_data = await db.downloadUserData(user);

        if (!user_data) {
            return 'Please comment /new to create user';
        } else {
            const completed_quests = user_data.user_data.completed || [];
            let response = 'Available quests:\n';
            for (const [questId, questData] of Object.entries(quests)) {
                if (!completed_quests.includes(questId)) {
                    response += `${questId}: ${questData.metadata.title}\n`;
                }
            }
            // TODO: implement check for accepted quests and respond with status
            return response + 'Please respond with /accept <Q# --> corresponding quest number>';
        }
    } catch (error) {
        console.error('Error displaying quests:', error);
        return;
    }
}

async function createQuestEnvironment(quest, task, context){
    var issueComment = '';
    // most will be creating an issue with multiple choice
    // quest 1 TODO: use another repo, use API enpoint to find issue numbers, include link to issues in the project 
    if(quest === 'Q1'){ 
      // Find issue tracker
      if(task === 'T1'){
        issueComment = context.issue({
          body: 'Where is the issue tracker tab? (Hint: you are already in it):\n'+
                '(a) The second tab on the top left when on a repo\n'+
                '(b) In the settings\n'+
                '(c) In the repo home page\n'+
                'respond with a, b or c\n'
        });
      }
      // find pull request menu
      else if(task === 'T2'){
        issueComment = context.issue({
          body: 'Where is the pull request tab?\n'+
                '(a) Inside an issue on the right menu\n'+
                '(b) In the insights tab\n'+
                '(c) In the repo home page\n'+
                '(d) Next to the issues tab\n'+
                'respond with a, b, c or d'
        });
      }
      // find the fork button
      else if(task === 'T3'){
        issueComment = context.issue({
          body: 'Where is the fork button?\n' +
                '(a) In the kitchen drawer where the forks are located\n'+
                '(b) In repo settings\n'+
                '(c) Under the code tab located on the top right side of the repo home page\n'+
                '(d) Inside the issues tab\n'+
                'respond with a, b, c or d'
        });
      }
      // find the readme file
      else if(task === 'T4'){
        issueComment = context.issue({
          body: "Find the readme and reply with the secret command!\n (hint: it's somewhere in the repo code tab)"
        });
      }
      // find the contributors
      else if(task === 'T5'){
        issueComment = context.issue({ 
          body: "Find a the contributors, then copy and paste their full name here."
        });
      }
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
  
  async function validateTask(db, context, user){
    // quest 1
    const user_data = await db.downloadUserData(user);
    // TODO: add exception handling
    const task = user_data.user_data.current.task;
    const quest = user_data.user_data.current.quest;
    const issueComment = context.payload.comment.body;

    if (quest === 'Q1') {
        if (task === 'T1') {
            // Check issue tracker title
            const correctAnswer = 'a';
            if (issueComment.toLowerCase().includes(correctAnswer)) {
                completeTask(db, user, 'Q1', 'T1', context);
                return true; // Correct answer
            } else {
                return false; // Incorrect answer
            }
        } else if (task === 'T2') {
            // Check pull request title
            const correctAnswer = 'd';
            if (issueComment.toLowerCase().includes(correctAnswer)) {
                completeTask(db, user, 'Q1', 'T2', context);
                return true; // Correct answer
            } else {
                return false; // Incorrect answer
            }
        } else if (task === 'T3') {
            // On fork or multiple choice
            const correctAnswer = 'c';
            if (issueComment.toLowerCase().includes(correctAnswer)) {
                completeTask(db, user, 'Q1', 'T3', context);
                return true; // Correct answer
            } else {
                return false; // Incorrect answer
            }
        } else if (task === 'T4') {
            // Check issue body for a hint about readme
            const hint = "/ketchup"; // TODO: CHANGE
            if (issueComment.toLowerCase().includes(hint)) {
                completeTask(db, user, 'Q1', 'T4', context);
                return true; // Correct hint given
            } else {
                return false; // Hint not found
            }
        } else if (task === 'T5') {
            // Check for valid contributor name 
            const validContributors = ['John Doe', 'Jane Smith', 'Alice Johnson']; // TODO: UPDATE
            const issueComment = await context.octokit.issues.listComments(context.issue()); // TODO: potential issue
            const userReply = issueComment.data[issueComment.data.length - 1].body.toLowerCase(); // Assuming user's reply is the last comment
            const userContributor = userReply.replace('@', '').trim(); // Remove '@' and trim whitespace
            if (validContributors.includes(userContributor)) {
                completeTask(db, user, 'Q1', 'T5', context);
                return true; // Valid contributor name
            } else {
                return false; // Invalid contributor name
            }
        }
    }
    // quest 2
    else if(quest === 'Q2'){
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
    else if(quest === 'Q3'){
        // solve issue (upload a file)
            // check for a push, commit of a file
        // submit pull request
            // check for PR
        // post in the issue asking for someone to review
            // check for issue comment 
        // close issue
            // check for issue delete
    }
  }

export const questFunctions = {
    acceptQuest,
    removeQuest,
    completeQuest,
    completeTask,
    displayQuests,
    createQuestEnvironment,
    validateTask
  };