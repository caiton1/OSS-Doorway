// import utils for tasks
import { utils } from "./taskUtils.js";
import { completeTask } from "./quest.js";

// Q1
async function handleQ1T1(db, user, context, ossRepo, response, selectedIssue) {
    const issueCount = await utils.getIssueCount(ossRepo);
    if (issueCount !== null && context.payload.comment.body == issueCount) {
        await completeTask(db, user, "Q1", "T1", context);
        return response.success;
    }
    return response.error;

}

async function handleQ1T2(db, user, context, ossRepo, response, selectedIssue) {
    const PRCount = await utils.getPRCount(ossRepo);
    if (PRCount !== null && context.payload.comment.body == PRCount) {
        await completeTask(db, user, "Q1", "T2", context);
        return response.success;
    }
    return response.error;
}

async function handleQ1T3(db, user, context, ossRepo, response, selectedIssue) {
    const correctAnswer = "c";
    if (context.payload.comment.body.toLowerCase().includes(correctAnswer)) {
        await completeTask(db, user, "Q1", "T3", context);
        return response.success;

    }
    return response.error;
}

async function handleQ1T4(db, user, context, ossRepo, response, selectedIssue) {
    const correctAnswer = "d";
    if (context.payload.comment.body.toLowerCase().includes(correctAnswer)) {
        await completeTask(db, user, "Q1", "T4", context);
        return response.success;
    }
    return response.error;
}

async function handleQ1T5(db, user, context, ossRepo, response, selectedIssue) {
    const contributorCount = await utils.countContributors(ossRepo, context);
    if (context.payload.comment.body == contributorCount) {
        await completeTask(db, user, "Q1", "T5", context);
        return response.success;
    }
    return response.error;
}

// Q2
async function handleQ2T1(db, user, context, ossRepo, response, selectedIssue) {
    const issueComment = context.payload.comment.body;
    const openIssues = await utils.openIssues(ossRepo, context);
    const firstAssignee = await utils.isFirstAssignee(ossRepo, user, Number(issueComment));

    var user_data = await db.downloadUserData(user);

    if (openIssues.includes(Number(issueComment)) && firstAssignee) {
        user_data.user_data.selectedIssue = Number(issueComment);
        await db.updateData(user_data);
        await completeTask(db, user, "Q2", "T1", context);
        return response.success;
    }
    return response.error;
}

async function handleQ2T2(db, user, context, ossRepo, response, selectedIssue) {
    if (await utils.checkAssignee(ossRepo, selectedIssue, user, context)) {
        await completeTask(db, user, "Q2", "T2", context);
        return response.success;
    }
    return response.error;
}

async function handleQ2T3(db, user, context, ossRepo, response, selectedIssue) {
    if (await utils.userCommentedInIssue(ossRepo, selectedIssue, user, context)) {
        await completeTask(db, user, "Q2", "T3", context);
        return response.success;
    }
    return response.error;
}

async function handleQ2T4(db, user, context, ossRepo, response, selectedIssue) {
    if (await utils.isContributorMentionedInIssue(ossRepo, selectedIssue, context)) {
        await completeTask(db, user, "Q2", "T4", context);
        return response.success;
    }
    return response.error;
}

// Q3
async function handleQ3T1(db, user, context, ossRepo, response, selectedIssue) {
    const correctAnswer = "c";
    if (context.payload.comment.body.toLowerCase().includes(correctAnswer)) {
        await completeTask(db, user, "Q3", "T1", context);
        return response.success;
    }
    return response.error;
}

async function handleQ3T2(db, user, context, ossRepo, response, selectedIssue) {
    if (await utils.userPRAndComment(ossRepo, user, context)) {
        await completeTask(db, user, "Q3", "T2", context);
        return response.success;
    }
    return response.error;
}

async function handleQ3T3(db, user, context, ossRepo, response, selectedIssue) {
    if (await utils.issueClosed(ossRepo, selectedIssue, context)) {
        await completeTask(db, user, "Q3", "T3", context);
        return response.success;
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