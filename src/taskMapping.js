// import utils for tasks
import { utils } from "./taskUtils.js";
import { completeTask } from "./gamification.js";

// NOTE: due to how these functions are accessed, keep parameters uniform, even if not used

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

        completeTask(user_data, "Q0", "T1", context, db);
        return response.success;
    }
    // map
    else if(user_response.includes("b")){
        user_data.display_preference.push("map");
        completeTask(user_data, "Q0", "T1", context, db);
        return response.success;
    }
    // both
    else if(user_response.includes("c")){
        user_data.display_preference.push("score");
        user_data.display_preference.push("map");
        completeTask(user_data, "Q0", "T1", context, db);
        return response.success;
    }
    // neither
    else if(user_response.includes("d")){
        // do nothing, complete task
        completeTask(user_data, "Q0", "T1", context, db);
        return response.success;
    }
    // fail
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;

}
// Q1
async function handleQ1T1(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const issueCount = await utils.getIssueCount(ossRepo);
    if (issueCount !== null && context.payload.comment.body == issueCount) {
        completeTask(user_data, "Q1", "T1", context, db);
        return response.success;
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;

}

async function handleQ1T2(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const PRCount = await utils.getPRCount(ossRepo);
    if (PRCount !== null && context.payload.comment.body == PRCount) {
        completeTask(user_data, "Q1", "T2", context, db);
        return response.success;
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

async function handleQ1T3(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const correctAnswer = "c";
    if (context.payload.comment.body.toLowerCase().includes(correctAnswer)) {
        completeTask(user_data, "Q1", "T3", context, db);
        return response.success;

    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

async function handleQ1T4(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const correctAnswer = "d";
    if (context.payload.comment.body.toLowerCase().includes(correctAnswer)) {
        completeTask(user_data, "Q1", "T4", context, db);
        return response.success;
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

async function handleQ1T5(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const contributorCount = await utils.countContributors(ossRepo, context);
    if (context.payload.comment.body == contributorCount) {
        await completeTask(user_data, "Q1", "T5", context, db);
        if (Object.keys(user_data.completed["Q1"]).every(task => user_data.completed["Q1"][task].attempts === 1)) {
            return response.badge;
        } else {
            return response.success;
        }
    }

    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

// Q2
async function handleQ2T1(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const issueComment = context.payload.comment.body;
    const openIssues = await utils.openIssues(ossRepo, context);
    const firstAssignee = await utils.isFirstAssignee(ossRepo, user, Number(issueComment));

    if (openIssues.includes(Number(issueComment)) && firstAssignee) {
        user_data.selectedIssue = Number(issueComment);
        completeTask(user_data, "Q2", "T1", context, db);
        return response.success;
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

async function handleQ2T2(user_data, user, context, ossRepo, response, selectedIssue, db) {
    if (await utils.checkAssignee(ossRepo, selectedIssue, user, context)) {
        completeTask(user_data, "Q2", "T2", context, db);
        return response.success;
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

async function handleQ2T3(user_data, user, context, ossRepo, response, selectedIssue, db) {
    if (await utils.userCommentedInIssue(ossRepo, selectedIssue, user, context)) {
        completeTask(user_data, "Q2", "T3", context, db);
        return response.success;
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

async function handleQ2T4(user_data, user, context, ossRepo, response, selectedIssue, db) {
    if (await utils.isContributorMentionedInIssue(ossRepo, selectedIssue, context)) {
        await completeTask(user_data, "Q2", "T4", context, db);
        if (Object.keys(user_data.completed["Q2"]).every(task => user_data.completed["Q2"][task].attempts === 1)) {
            return response.badge;
        } else {
            return response.success;
        }
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

// Q3
async function handleQ3T1(user_data, user, context, ossRepo, response, selectedIssue, db) {
    const correctAnswer = "c";
    if (context.payload.comment.body.toLowerCase().includes(correctAnswer)) {
        completeTask(user_data, "Q3", "T1", context, db);
        return response.success;
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

async function handleQ3T2(user_data, user, context, ossRepo, response, selectedIssue, db) {
    if (await utils.userPRAndComment(ossRepo, user, context)) {
        completeTask(user_data, "Q3", "T2", context, db);
        return response.success;
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
}

async function handleQ3T3(user_data, user, context, ossRepo, response, selectedIssue, db) {
    if (await utils.issueClosed(ossRepo, selectedIssue, context)) {
        await completeTask(user_data, "Q3", "T3", context, db);
        const newPoints = user_data.streakCount * 100;
        user_data.points += newPoints;
        return response.badge.replace('${points}', newPoints + 25); 
    }
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${ossRepo})`;
    return response;
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
    },
    Q2: {
        T1: handleQ2T1,
        T2: handleQ2T2,
        T3: handleQ2T3,
        T4: handleQ2T4,
    },
    Q3: {
        T1: handleQ3T1,
        T2: handleQ3T2,
        T3: handleQ3T3,
    }
};