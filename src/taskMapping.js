// import utils for tasks
import { utils } from "./taskUtils.js";
import { completeTask } from "./quest.js";

// Q1
async function handleQ1T1(user_data, user, context, ossRepo, response, selectedIssue) {
    const issueCount = await utils.getIssueCount(ossRepo);
    if (issueCount !== null && context.payload.comment.body == issueCount) {
        completeTask(user_data, "Q1", "T1", context);
        return response.success;
    }
    return response.error;

}

async function handleQ1T2(user_data, user, context, ossRepo, response, selectedIssue) {
    const PRCount = await utils.getPRCount(ossRepo);
    if (PRCount !== null && context.payload.comment.body == PRCount) {
        completeTask(user_data, "Q1", "T2", context);
        return response.success;
    }
    return response.error;
}

async function handleQ1T3(user_data, user, context, ossRepo, response, selectedIssue) {
    const correctAnswer = "c";
    if (context.payload.comment.body.toLowerCase().includes(correctAnswer)) {
        completeTask(user_data, "Q1", "T3", context);
        return response.success;

    }
    return response.error;
}

async function handleQ1T4(user_data, user, context, ossRepo, response, selectedIssue) {
    const correctAnswer = "d";
    if (context.payload.comment.body.toLowerCase().includes(correctAnswer)) {
        completeTask(user_data, "Q1", "T4", context);
        return response.success;
    }
    return response.error;
}

async function handleQ1T5(user_data, user, context, ossRepo, response, selectedIssue) {
    const contributorCount = await utils.countContributors(ossRepo, context);
    if (context.payload.comment.body == contributorCount) {
        await completeTask(user_data, "Q1", "T5", context);
        if (Object.keys(user_data.completed["Q1"]).every(task => user_data.completed["Q1"][task].attempts === 1)) {
            return response.badge;
        } else {
            return response.success;
        }
    }

    return response.error;
}

// Q2
async function handleQ2T1(user_data, user, context, ossRepo, response, selectedIssue) {
    const issueComment = context.payload.comment.body;
    const openIssues = await utils.openIssues(ossRepo, context);
    const firstAssignee = await utils.isFirstAssignee(ossRepo, user, Number(issueComment));

    if (openIssues.includes(Number(issueComment)) && firstAssignee) {
        user_data.selectedIssue = Number(issueComment);
        completeTask(user_data, "Q2", "T1", context);
        return response.success;
    }
    return response.error;
}

async function handleQ2T2(user_data, user, context, ossRepo, response, selectedIssue) {
    if (await utils.checkAssignee(ossRepo, selectedIssue, user, context)) {
        completeTask(user_data, "Q2", "T2", context);
        return response.success;
    }
    return response.error;
}

async function handleQ2T3(user_data, user, context, ossRepo, response, selectedIssue) {
    if (await utils.userCommentedInIssue(ossRepo, selectedIssue, user, context)) {
        completeTask(user_data, "Q2", "T3", context);
        return response.success;
    }
    return response.error;
}

async function handleQ2T4(user_data, user, context, ossRepo, response, selectedIssue) {
    if (await utils.isContributorMentionedInIssue(ossRepo, selectedIssue, context)) {
        await completeTask(user_data, "Q2", "T4", context);
        if (Object.keys(user_data.completed["Q2"]).every(task => user_data.completed["Q2"][task].attempts === 1)) {
            return response.badge;
        } else {
            return response.success;
        }
    }
    return response.error;
}

// Q3
async function handleQ3T1(user_data, user, context, ossRepo, response, selectedIssue) {
    const correctAnswer = "c";
    if (context.payload.comment.body.toLowerCase().includes(correctAnswer)) {
        completeTask(user_data, "Q3", "T1", context);
        return response.success;
    }
    return response.error;
}

async function handleQ3T2(user_data, user, context, ossRepo, response, selectedIssue) {
    if (await utils.userPRAndComment(ossRepo, user, context)) {
        completeTask(user_data, "Q3", "T2", context);
        return response.success;
    }
    return response.error;
}

async function handleQ3T3(user_data, user, context, ossRepo, response, selectedIssue) {
    if (await utils.issueClosed(ossRepo, selectedIssue, context)) {
        await completeTask(user_data, "Q3", "T3", context);
        const newPoints = user_data.streakCount * 100;
        user_data.points += newPoints;
        // TODO: need to change message to reflect the new points
        return response.badge.replace('${points}', newPoints + 25); 
    }
    return response.error;
}

export const taskMapping = {
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