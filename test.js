import fs from 'fs';
const responseFilePath = './src/responses.json';


//const responses = JSON.parse(fs.readFileSync(responseFilePath, 'utf8'));

//console.log(responses.responses.taskAbandoned);

const repo = 'RESHAPELab/jabref';


async function getContributorCount(repo) {
    try {
      let totalCount = 0;
      let page = 1;
      while (true) {
        const response = await fetch(`https://api.github.com/repos/${repo}/contributors?page=${page}&per_page=100`);
        const contributors = await response.json();
        console.log( contributors.length)
        totalCount += contributors.length;
        if (contributors.length < 100) {
          // If there are fewer than 100 contributors on this page, we've fetched all contributors
          break;
        }
        page++;
      }
      return totalCount;
    } catch (error) {
      console.error('Error fetching contributor count:', error);
      throw error;
    }
  }
  const contributorCount = await getContributorCount(repo);
  console.log(contributorCount);