import fs from "fs";
import { taskMapping } from "./taskMapping.js";

// Constants configuration object
const CONFIG = {
  paths: {
    quest: "./src/config/quest_config.json",
    response: "./src/config/response.json",
    svg: "./src/templates/template.svg",
    defaultReadme: "./src/templates/main.md",
    progressReadme: "./src/templates/progress.md"
  },
  badgeDescriptions: {
    Q0: "Configurator ⚙️",
    Q1: "Explorer 🚀",
    Q2: "Builder 🏗️",
    Q3: "Contributor 🥇"
  }
};

// Load configurations once
const questResponse = JSON.parse(fs.readFileSync(CONFIG.paths.response, "utf-8"));
const quests = JSON.parse(fs.readFileSync(CONFIG.paths.quest, "utf8"));
const ossRepo = process.env.OSS_REPO;
const mapRepoLink = quests.map_repo_link;

// Utility functions
const utils = {
  async updateGithubFile(context, { owner, repo, path, content, message }) {
    try {
      const { data: { sha } } = await context.octokit.repos.getContent({
        owner,
        repo,
        path
      });

      await context.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        committer: {
          name: "QuestBuddy",
          email: "naugitbot@gmail.com"
        },
        author: {
          name: "QuestBuddy",
          email: "naugitbot@gmail.com"
        },
        sha
      });
    } catch (error) {
      console.error(`Error updating file ${path}:`, error);
    }
  },

  async createGithubIssue(context, { owner, repo, title, body, labels = [] }) {
    try {
      return await context.octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels
      });
    } catch (error) {
      console.error("Error creating issue:", error);
      return null;
    }
  }
};

// Quest Management Class
class QuestManager {
  constructor(userData, context, db) {
    this.userData = userData;
    this.context = context;
    this.db = db;
  }

  async acceptQuest(quest) {
    if (!(quest in quests) || (this.userData.accepted && Object.keys(this.userData.accepted).length)) {
      return false;
    }

    try {
      this.userData.accepted = this.userData.accepted || {};
      this.userData.accepted[quest] = {};

      // Initialize tasks
      for (const task in quests[quest]) {
        if (task !== "metadata") {
          this.userData.accepted[quest][task] = {
            completed: false,
            attempts: 0,
            hints: 0,
            timeStart: 0,
            timeEnd: 0.0,
            issueNum: 0
          };
        }
      }

      // Set current progress
      this.userData.current = {
        quest: quest,
        task: "T1"
      };
      this.userData.completion = 0;

      if (quest === 'Q0') {
        await this.createQuestEnvironment(quest, "T1");
      }
      return true;
    } catch (error) {
      console.error("Error accepting quest:", error);
      return false;
    }
  }

  async completeTask(quest, task) {
    try {
      const questData = this.userData.accepted[quest];
      if (!questData || !questData[task]) return false;

      const points = quests[quest][task].points;
      const xp = quests[quest][task].xp;

      // Update task completion data
      questData[task].completed = true;
      questData[task].timeEnd = Date.now();
      questData[task].issueNum = this.context.issue().issue_number;

      // Update user stats
      this.userData.points += points;
      this.userData.xp += xp;
      
      // Update completion percentage
      const tasks = Object.keys(quests[quest]).filter(t => t !== "metadata");
      const taskIndex = tasks.indexOf(task);
      this.userData.completion = Math.round((taskIndex + 1) / tasks.length * 100) / 100;

      // Handle next task or quest completion
      if (taskIndex < tasks.length - 1) {
        this.userData.current.task = tasks[taskIndex + 1];
        await this.createQuestEnvironment(quest, this.userData.current.task);
      } else {
        this.userData.current.task = null;
        await this.completeQuest(quest);
      }

      await this.closeIssue();
      await this.updateReadme();
      return true;
    } catch (error) {
      console.error("Error completing task:", error);
      return false;
    }
  }

  // ... Additional methods would follow similar pattern
}

// SVG Generation Class
class SVGGenerator {
  constructor(userData, context) {
    this.userData = userData;
    this.context = context;
  }

  async generate() {
    try {
      const stats = this.calculateStats();
      const svgContent = this.generateSVGContent(stats);
      const filename = `userCards/draft-${Date.now()}.svg`;

      await utils.updateGithubFile(this.context, {
        owner: this.context.repo().owner,
        repo: this.context.repo().repo,
        path: filename,
        content: svgContent,
        message: `Update ${filename}`
      });

      return filename;
    } catch (error) {
      console.error("Error generating SVG:", error);
      return null;
    }
  }

  calculateStats() {
    // Move all the stat calculations here
    // Return an object with all necessary stats
  }

  generateSVGContent(stats) {
    // Move SVG template generation here
    // Use the stats to generate SVG content
  }
}

// Export a simplified interface
export const gameFunction = {
  createQuestManager: (userData, context, db) => new QuestManager(userData, context, db),
  createSVGGenerator: (userData, context) => new SVGGenerator(userData, context),
  utils
};