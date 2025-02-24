// assisting funcitons mostly just abstracting github API for the task mapping file

async function getIssueCount(repo) {
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/issues`);
        if (response.ok) {
            const issues = await response.json();
            // Filter out pull requests
            const actualIssues = issues.filter((issue) => !issue.pull_request);
            return actualIssues.length;
        } else {
            console.error("Error:", response.status);
            return null;
        }
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

// assignee to github issue
async function isFirstAssignee(repo, user, selectedIssue) {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${repo}/issues/${selectedIssue}`
        );
        if (!response.ok) {
            throw new Error(`Issue ${selectedIssue} not found in repository ${repo}`);
        }
        const issueSelected = await response.json();
        const assignees = issueSelected.assignees.map((assignee) => assignee.login);

        if (assignees.length === 0) {
            return true; // no assignees
        } else if (assignees.length === 1 && assignees.includes(user)) {
            return true; // user first assignee
        } else {
            return false; // other assignee or issue doesnt exist
        }
    } catch (error) {
        console.error("Error checking assignees: " + error);
        return false;
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
            throw new Error("Unexpected response format");
        }
    } catch (error) {
        console.error("Error fetching pull requests:", error);
        throw error;
    }
}

// first contributor that appears in the github API
async function getFirstContributor(repo, context) {
    try {
        const installationID = context.payload.installation.id;
        const accessToken = await context.octokit.auth({
            type: "installation",
            installationID,
        });

        const response = await context.octokit.request(
            `GET /repos/${repo}/contributors`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );
        const contributors = response.data;
        if (contributors.length > 0) {
            return contributors[0].login;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting first contributor: ", error);
        return null;
    }
}

async function isContributorMentionedInIssue(repo, issueNumber, context) {
    try {
        // Get the installation ID from the context
        const installationID = context.payload.installation.id;

        // Authenticate as the installation to get the access token
        const accessToken = await context.octokit.auth({
            type: "installation",
            installationID,
        });

        // Fetch the list of contributors for the repository
        const contributorsResponse = await context.octokit.request(
            `GET /repos/${repo}/contributors`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );

        // Extract the contributors data
        const contributors = contributorsResponse.data;
        const contributorLogins = contributors.map(
            (contributor) => contributor.login
        );

        // Fetch the specified issue
        const issueResponse = await context.octokit.request(
            `GET /repos/${repo}/issues/${issueNumber}`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );

        // Extract the issue data
        const issue = issueResponse.data;
        const issueBody = issue.body;

        // Fetch the comments for the issue
        const commentsResponse = await context.octokit.request(
            `GET /repos/${repo}/issues/${issueNumber}/comments`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );

        // Extract the comments data
        const comments = commentsResponse.data;
        const commentsBody = comments.map((comment) => comment.body).join(" ");

        // Combine the i ssue body and comments to check for mentions
        const combinedText = issueBody + " " + commentsBody;

        // Check if any contributor is mentioned in the combined text
        for (const contributorLogin of contributorLogins) {
            if (combinedText.includes(`@${contributorLogin}`)) {
                return true;
            }
        }

        return false;
    } catch (error) {
        // Log any errors and return false to indicate failure
        console.error(
            "Error checking if any contributor is mentioned in the issue: ",
            error
        );
        return false;
    }
}

async function userCommited(repo, user, context) {
    try {
        const installationID = context.payload.installation.id;
        const accessToken = await context.octokit.auth({
            type: "installation",
            installationID,
        });

        const response = await context.octokit.request(
            `GET /repos/${repo}/commits`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );
        const commits = response.data;
        const userCommited = commits.find(
            (commit) => commit.author && commit.author.login == user
        );
        if (userCommited) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error finding user commits: ", error);
        return false;
    }
}

async function getTopContributor(ossRepo, context) {
    // Destructure owner and repo from the repository name (e.g., "owner/repo")
    const [owner, repo] = ossRepo.split("/");

    try {
        // Fetch the list of contributors sorted by their contributions
        const { data: contributors } = await context.octokit.repos.listContributors({
            owner,
            repo,
            per_page: 1,
            order: "desc", // By default, GitHub API returns contributors in descending order by commits
        });

        // Ensure there is at least one contributor
        if (contributors.length > 0) {
            // Return the login (username) of the top contributor
            return contributors[0].login;
        } else {
            throw new Error("No contributors found for the repository.");
        }
    } catch (error) {
        console.error("Error fetching top contributor:", error);
        throw error;
    }
}

async function countContributors(repo, context) {
    try {
        const installationID = context.payload.installation.id;
        const accessToken = await context.octokit.auth({
            type: "installation",
            installationID,
        });
        const response = await context.octokit.request(
            `GET /repos/${repo}/contributors`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );

        // Extract the contributors data from the response
        const contributors = response.data;

        // Return the number of contributors
        return contributors.length;
    } catch (error) {
        // Log any errors and return 0 to indicate failure
        console.error("Error counting contributors: ", error);
        return 0;
    }
}

async function userPRAndComment(repo, user, context) {
    try {
        const installationID = context.payload.installation.id;
        const accessToken = await context.octokit.auth({
            type: "installation",
            installationID,
        });

        // Check if the user submitted any pull requests
        const pullRequestsResponse = await context.octokit.request(
            `GET /repos/${repo}/pulls`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );
        const pullRequests = pullRequestsResponse.data;
        const userPullRequest = pullRequests.find(
            (pr) => pr.user && pr.user.login === user
        );

        if (!userPullRequest) {
            return false;
        }

        // Check if the user commented on their pull request
        const pullNumber = userPullRequest.number;
        const commentsResponse = await context.octokit.request(
            `GET /repos/${repo}/issues/${pullNumber}/comments`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );
        const comments = commentsResponse.data;
        const userCommented = comments.find(
            (comment) => comment.user && comment.user.login === user
        );

        if (userCommented) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error finding user pull requests or comments: ", error);
        return false;
    }
}

async function userCommentedInIssue(repo, issueNum, user, context) {
    try {
        const installationID = context.payload.installation.id;
        const accessToken = await context.octokit.auth({
            type: "installation",
            installationID,
        });

        const response = await context.octokit.request(
            `GET /repos/${repo}/issues/${issueNum}/comments`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );
        const comments = response.data;

        const userInComments = comments.some(
            (comment) => comment.user.login === user
        ); // find any instance of user commenting
        return userInComments;
    } catch (error) {
        console.error("Error finding user comment in issues: ", error);
        return false;
    }
}

async function openIssues(repo, context) {
    try {
        const installationID = context.payload.installation.id;
        const accessToken = await context.octokit.auth({
            type: "installation",
            installationID,
        });
        const response = await fetch(
            `https://api.github.com/repos/${repo}/issues?state=open`,
            {
                headers: {
                    Authorization: `token ${accessToken.token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        const issues = await response.json();
        const openIssueNumbers = issues.map((issue) => issue.number);
        return openIssueNumbers;
    } catch (error) {
        console.error(`Error getting open issues: ${error}`);
        return null;
    }
}

async function issueClosed(repo, issueNum, context) {
    try {
        const installationID = context.payload.installation.id;
        const accessToken = await context.octokit.auth({
            type: "installation",
            installationID,
        });
        const response = await fetch(
            `https://api.github.com/repos/${repo}/issues/${issueNum}`,
            {
                headers: {
                    Authorization: `token ${accessToken.token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        const issue = await response.json();
        const isClosed = issue.state === "closed";
        return isClosed;
    } catch (error) {
        console.error("Error checking if issue closed: ", error);
        return false;
    }
}

async function checkAssignee(repo, issueNum, user, context) {
    try {
        const installationID = context.payload.installation.id;
        const accessToken = await context.octokit.auth({
            type: "installation",
            installationID,
        });

        const response = await context.octokit.request(
            `GET /repos/${repo}/issues/${issueNum}`,
            {
                headers: {
                    authorization: `token ${accessToken.token}`,
                },
            }
        );

        const issue = response.data;
        // assignees
        const assignees = issue.assignees.map((assignee) => assignee.login);

        // is user in one of the assignees
        if (assignees.includes(user)) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error checking assignees:" + error);
    }
}

function validateAnswers(userAnswerString, correctAnswers) {
    const match = userAnswerString.match(/\[([A-Z,\s]+)\]/i);
    var userAnswers = {};

    if (match) {
        userAnswers = match[1].split(',').map(answer => answer.trim().toLowerCase());
    } else {
      throw new Error("Invalid input format");
    }

    const lowerCaseCorrectAnswers = correctAnswers.map(answer => answer.toLowerCase());
  
    if (userAnswers.length !== lowerCaseCorrectAnswers.length) {
      throw new Error("Arrays must be of the same length");
    }

    let correctAnswersNumber = 0

    const feedback = userAnswers.map((answer, index) => {
        const isCorrect = answer === lowerCaseCorrectAnswers[index];
        
        if (isCorrect) {
            correctAnswersNumber += 1;
        }
        
        return `Question ${index + 1}: ${isCorrect ? "Correct" : "Incorrect"}. ${isCorrect ? `Answer: ${correctAnswers[index]}` : ""} \n`;
    });
    
    return {correctAnswersNumber, feedback};
}

export const utils = {
    getIssueCount,
    isFirstAssignee,
    getPRCount,
    getFirstContributor,
    isContributorMentionedInIssue,
    userCommited,
    countContributors,
    userPRAndComment,
    userCommentedInIssue,
    openIssues,
    issueClosed,
    checkAssignee,
    getTopContributor,
    validateAnswers
};
