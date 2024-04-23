/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
import { questFunctions } from "./src/quest.js";
import { MongoDB } from "./src/database.js";
import fs from "fs";
const responseFilePath = "./src/response.json";

const responses = JSON.parse(
  fs.readFileSync(responseFilePath, "utf-8")
).responses;
const db = new MongoDB();
await db.connect();

export default (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  // webhooks: https://github.com/octokit/webhooks.js/#webhook-events

  // issue command
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: responses.newIssue,
    });
    return context.octokit.issues.createComment(issueComment);
  });

  app.on("issue_comment.created", async (context) => {
    const user = context.payload.comment.user.login;
    if (context.payload.comment.user.type === "Bot") {
      return;
    }

    // check if / command
    const comment = context.payload.comment.body;
    if (comment.startsWith("/")) {
      const command = parseCommand(comment);
      var response = "";
      var status = false;

      // detect command
      if (command) {
        switch (command.action) {
          case "accept":
            // accept
            status = await questFunctions.acceptQuest(
              context,
              db,
              user,
              command.argument
            );
            if (!status) {
              response = responses.failedAccept;
            }
            break;
          case "drop":
            // drop
            status = await questFunctions.removeQuest(db, user);
            if (status) {
              response = responses.taskAbandoned;
            } else {
              response =
                "Failed to drop quest. You might not be currently on any quests.";
            }
            break;
          case "new_user":
            // create user
            status = await db.createUser(user);
            if (status) {
              response = responses.newUserResponse;
            } else {
              response = "Failed to create new user, user already exists";
            }
            break;
          case "display":
            response = await questFunctions.displayQuests(db, user);
            break;
          default:
            // respond unknown command and avaialble commands
            response = responses.invalidCommand;
            break;
        }
        if (response !== "") {
          const issueComment = context.issue({ body: response });
          await context.octokit.issues.createComment(issueComment);
        }
      }
    } else {
      questFunctions.validateTask(db, context, user);
    }
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

// match and break down / command
function parseCommand(comment) {
  const regex = /^(\/(new_user|accept|drop|display))(\s.*)?$/;
  const match = comment.match(regex);
  if (match) {
    const action = match[2];
    var argument = match[3];
    if (argument) {
      argument = argument.trim();
    }
    return { action, argument };
  }
  const action = "";
  var argument = "";
  return { action, argument };
}
