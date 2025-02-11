/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
import { gameFunction } from "./src/gamification.js";
import { MongoDB } from "./src/database.js";
import mongoose from "mongoose";
import fs from "fs";
import LLM from "./src/llm.js"
const responseFilePath = "./src/config/response.json";
const responses = JSON.parse(
  fs.readFileSync(responseFilePath, "utf-8")
).responses;
const db = new MongoDB();
await db.connect();
const llmInstance = new LLM();

export default (app) => {
  // TODO: update to reflect new command structure
  app.on("issues.opened", async (context) => {
    if (context.payload.issue.user.type === "Bot") return;

    const user = context.payload.issue.user;
    const issueComment = context.issue({
      body: responses.newIssue,
    });

    try {
      context.octokit.issues.createComment(issueComment);
    } catch (error) {
      console.error("Error commenting: ", error);
    }

    return;
  });
  console.log(run());
  app.on("issue_comment.created", async (context) => {
    const user = context.payload.comment.user.login;
    // in orgs, the org is the "owner" of the repo
    const { owner, repo } = context.repo();
    const comment = context.payload.comment.body;
    // admin commands
    if (comment.startsWith("/")) {
      if (await isAdmin(context, owner, user) || context.payload.comment.user.type === "Bot") {
        await parseCommand(context, owner, comment);
      } else{
        issueComment(context, "You need to be a repo or org owner to run / commands.");
      }
    } 
    else if (comment.startsWith("help")){ // TODO: complete placeholder
      try{
        await connectToDatabase();
        var user_document = await db.downloadUserData(user);
        await gameFunction.giveHint(user_document.user_data, context, db);
        db.updateData(user_document);
        mongoose.disconnect();
      }
      catch (error) {
        console.log(error);
      }
    }

    // quest response
    else {
      if (context.payload.comment.user.type === "Bot") return;
      try {
        await connectToDatabase();
        var user_document = await db.downloadUserData(user);
        await gameFunction.validateTask(user_document.user_data, context, user, db);
        db.updateData(user_document);
        mongoose.disconnect();
      } catch (error) {
        issueComment(
          context,
          "user " +
            user +
            " commented but does not yet exist in database. /new_user <user>"
        );
        console.log(error);
      }
    }
  });
};

async function connectToDatabase() {
  try {
    await mongoose.connect(`${process.env.URI}/${process.env.DB_NAME}`);
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1); // fail code
  }
}

async function runRAG() {
  try {
    const result = await llmInstance.validateAnswer("what kind of trees","red","blue"); 
    return result;
  } catch (error) {
    console.error(error);
  }
}

async function runHint() {
  try {
    const result = await llmInstance.rewordHint("heat helps with melting"); 
    return result;
  } catch (error) {
    console.error(error);
  }
}


// Call the async function
// match and break down / command
async function parseCommand(context, org, comment) {
  const regex = /^(\/(new_user|del_user|del_repo|reset_repo|create_repos))(\s+(.+))?$/;
  const match = comment.match(regex);
  if (match) {
    const command = match[2];
    var argument = match[4];

    var response = "";
    var status = false;

    // detect command
    if (command) {
      const { owner, repo } = context.repo();
      switch (command) {
        case "create_repos":
          const users = argument.split(',').map(user => user.trim());
          response = await gameFunction.createRepos(context, org, users, db); 
          break;
        case "new_user":
          // create user
          status = await db.createUser(argument);
          if (status) {
            response = responses.newUserResponse;
            var user_document = await db.downloadUserData(argument);
            gameFunction.acceptQuest(context, user_document.user_data, "Q0");
            // update readme and data
            gameFunction.updateReadme(
              owner,
              repo,
              context,
              user_document.user_data
            ); // TODO: same as below
            await db.updateData(user_document);
          } else {
            response = "Failed to create new user, user already exists";
          }
          break;
        case "del_user":
          // wipe user from database
          await db.wipeUser(argument);
          response = "user wipe complete";
          break;
        case "del_repo":
          // delete repo
          response = await gameFunction.deleteRepo(context, owner, argument);
          break;
        case "reset_repo": // does not delete
          try {
            await gameFunction.resetReadme(org, argument, context);
            await gameFunction.closeIssues(context);
            response = "repo reset successful";
          } catch {
            response = "repo reset failed";
          }
          // might need to add hints to this?
          case "new_hint":
          // create hint
          status = await db.createHint(argument);
          if (status) {
            response = "Hint added";
            //var user_document = await db.downloadUserData(argument);
            //gameFunction.acceptQuest(context, user_document.user_data, "Q0");
            // update readme and data
            /*gameFunction.updateReadme(
              owner,
              repo,
              context,
              user_document.user_data
            );*/ // TODO: same as below
            //await db.hintData(user_document);
          } else {
            response = "Failed to create new user, user already exists";
          }
          break;
          
          
          break;
        default:
          response = responses.invalidCommand;
          break;
      }

      // feedback
      if (response !== "") {
        issueComment(context, response);
      }
    }
  }else{
    issueComment(context, responses.invalidCommand);
  }
}

async function issueComment(context, msg) {
  const issueComment = context.issue({ body: msg });
  try {
    await context.octokit.issues.createComment(issueComment);
  } catch (error) {
    console.error("Error creating issue comment: ", error);
  }
}

async function isAdmin(context, org, username) {
  try {
    const owner_list = await context.octokit.orgs.listMembers({
      org,
      role: "owner",
    });
    const owners = owner_list.data.map(user => user.login)
    return owners.includes(username);

  } catch (error) {
    context.log.error(error);
    throw new Error(
      "Failed to check if user is the owner of the organization."
    );
  }
}
