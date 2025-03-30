// import utils for tasks
import { utils } from "./taskUtils.js";
import { completeTask } from "./gamification.js";
import LLM from "./llm.js"
// NOTE: due to how these functions are accessed, keep parameters uniform, even if not used
const llmInstance = new LLM();
// Q0
async function handleQ0T1(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const user_response = context.payload.comment.body.toLowerCase();
    // WARNING: assumes that this quest and task will always be run first
    // will overwrite, otherwise do null check
    user_data.display_preference = [];

    // score
    if(user_response.includes("a")){
        // update user json preferences
        user_data.display_preference.push("score");

        await completeTask(user_data, "Q0", "T1", context, db);
        return [response.success, true];
    }
    // map
    else if(user_response.includes("b")){
        user_data.display_preference.push("map");
        await completeTask(user_data, "Q0", "T1", context, db);
        return [response.success, true];
    }
    // both
    else if(user_response.includes("c")){
        user_data.display_preference.push("score");
        user_data.display_preference.push("map");
        await completeTask(user_data, "Q0", "T1", context, db);
        return [response.success, true];
    }
    // neither
    else if(user_response.includes("d")){
        // do nothing, complete task
        await completeTask(user_data, "Q0", "T1", context, db);
        return [response.success, true];
    }
    // fail
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];

}
// Q1
async function handleQ1T1(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const issueCount = await utils.getIssueCount(ossRepo);
    if (issueCount !== null && context.payload.comment.body == issueCount) {
        await completeTask(user_data, "Q1", "T1", context, db);
        return [response.success, true];
    }

    var input = context.payload.comment.body;
    var newResponse = await llmInstance.validateAnswer(input,issueCount);
    console.log(newResponse);
    if(newResponse == "True") {
        await completeTask(user_data, "Q1", "T1", context, db);
        return [response.success, true];
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];

}

async function handleQ1T2(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const PRCount = await utils.getPRCount(ossRepo);
    if (PRCount !== null && context.payload.comment.body == PRCount) {
        await completeTask(user_data, "Q1", "T2", context, db);
        return [response.success, true];
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

async function handleQ1T3(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const correctAnswer = "c";
    if (context.payload.comment.body.toLowerCase() === correctAnswer) {
        await completeTask(user_data, "Q1", "T3", context, db);
        return [response.success, true];
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

async function handleQ1T4(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const correctAnswer = "d";
    if (context.payload.comment.body.toLowerCase() === correctAnswer) {
        await completeTask(user_data, "Q1", "T4", context, db);
        return [response.success, true];
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

async function handleQ1T5(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const topContributor = await utils.getTopContributor(ossRepo, context);
    
    if (context.payload.comment.body.trim() === topContributor) {
        await completeTask(user_data, "Q1", "T5", context, db);
        return [response.success, true];
    }
    response = response.error; 
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

// Q2
async function handleQ2T1(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const issueComment = context.payload.comment.body;
    const openIssues = await utils.openIssues(ossRepo, context);
    const firstAssignee = await utils.isFirstAssignee(ossRepo, user, Number(issueComment));
    const nonCodeLabel = await utils.hasNonCodeContributionLabel(ossRepo, Number(issueComment));

    if (openIssues.includes(Number(issueComment)) && firstAssignee && nonCodeLabel) {
        user_data.selectedIssue = Number(issueComment);
        await completeTask(user_data, "Q2", "T1", context, db);
        return [response.success, true];
    }
    
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

async function handleQ2T2(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const issueComment = context.payload.comment.body.trim().toLowerCase();

    if (issueComment === "done" && await utils.checkAssignee(ossRepo, selectedIssue, user, context)) {
        await completeTask(user_data, "Q2", "T2", context, db);
        return [response.success, true];
    }

    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

async function handleQ2T3(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const issueComment = context.payload.comment.body.trim().toLowerCase();

    if (issueComment === "done" && await utils.userCommentedInIssue(ossRepo, selectedIssue, user, context)) {
        await completeTask(user_data, "Q2", "T3", context, db);
        return [response.success, true];
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

async function handleQ2T4(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const issueComment = context.payload.comment.body.trim().toLowerCase();

    if (issueComment === "done" && await utils.isContributorMentionedInIssue(ossRepo, selectedIssue, context)) {
        await completeTask(user_data, "Q2", "T4", context, db);
        return [response.success, true];
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

// Q3
async function handleQ3T1(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const correctAnswer = "c";
    if (context.payload.comment.body.toLowerCase() === correctAnswer) {
        await completeTask(user_data, "Q3", "T1", context, db);
        return [response.success, true];
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

async function handleQ3T2(user_data, user, context, ossRepo, response, selectedIssue, db) {
    if (await utils.userPRAndComment(ossRepo, user, context)) {
        await completeTask(user_data, "Q3", "T2", context, db);
        return [response.success, true];
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

async function handleQ3T3(user_data, user, context, ossRepo, response, selectedIssue, db) {
    if (await utils.issueClosed(ossRepo, selectedIssue, context)) {
        await completeTask(user_data, "Q3", "T3", context, db);
        const newPoints = user_data.streakCount * 100;
        user_data.points += newPoints;
        return [response.success, true]; 
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return [response, false];
}

// QUIZES

async function handleQ1Quiz(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const correctAnswers = ["b", "a", "c", "b", "d"]; 
    const userAnswerString = context.payload.comment.body;
    
    try {
      const { correctAnswersNumber, feedback } = utils.validateAnswers(userAnswerString, correctAnswers);
  
      await completeTask(user_data, "Q1", "T6", context, db);
  
      response = response.success + 
        `Number of Correct Answers: ${correctAnswersNumber}` + 
        `\n\nFeedback:\n${feedback.join('')}`;

      return [response, true];
    } catch (error) {
      console.log(error);
      response = response.error + `\n\n[Click here to start](https://github.com/${ossRepo})`;
      return [response, false];
    }
}

async function handleQ2Quiz(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const correctAnswers = ["c", "b", "c", "c", "b", "c"]; 
    const userAnswerString = context.payload.comment.body;
    
    try {
      const { correctAnswersNumber, feedback } = utils.validateAnswers(userAnswerString, correctAnswers);
  
      await completeTask(user_data, "Q2", "T5", context, db);
  
      response = response.success + 
        `Number of Correct Answers: ${correctAnswersNumber}` + 
        `\n\nFeedback:\n${feedback.join('')}`;

      return [response, true];
    } catch (error) {
      response = response.error + `\n\n[Click here to start](https://github.com/${ossRepo})`;
      return [response, false];
    }
}

async function handleQ3Quiz(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const correctAnswers = ["b", "c", "c", "b", "b", "d"]; 
    const userAnswerString = context.payload.comment.body;
    
    try {
      const { correctAnswersNumber, feedback } = utils.validateAnswers(userAnswerString, correctAnswers);
  
      await completeTask(user_data, "Q3", "T4", context, db);
  
      response = response.success + 
        `Number of Correct Answers: ${correctAnswersNumber}` + 
        `\n\nFeedback:\n${feedback.join('')}`;

      return [response, true];
    } catch (error) {
      response = response.error + `\n\n[Click here to start](https://github.com/${ossRepo})`;
      return [response, false];
    }
}

// export quest functions as dictionary
export const taskMapping = {
    Q0: {
        T1: handleQ0T1
    },
    Q1: {
        T1: handleQ1T1,
        T2: handleQ1T2,
        T3: handleQ1T3,
        T4: handleQ1T4,
        T5: handleQ1T5,
        T6: handleQ1Quiz,
    },
    Q2: {
        T1: handleQ2T1,
        T2: handleQ2T2,
        T3: handleQ2T3,
        T4: handleQ2T4,
        T5: handleQ2Quiz,
    },
    Q3: {
        T1: handleQ3T1,
        T2: handleQ3T2,
        T3: handleQ3T3,
        T4: handleQ3Quiz,
    }
};
