## 🛡️ OSSDoorway: A Gamified Learning Environment for OSS Contributions

OSSDoorway is a free, open-source platform designed to engage users in learning about the open-source software (OSS) contribution process through interactive quests. Users embark on educational quests that guide them through the various stages of OSS contributions, such as submitting pull requests, writing documentation, and solving issues. Each quest is designed to be both informative and engaging, incorporating game elements like progression bars, XP, and levels.

OSSDoorway quests and activities are designed to be accessible and inclusive, ensuring that users from diverse backgrounds and skill levels can benefit from the platform. Join OSSDoorway today and start your journey towards becoming a proficient OSS contributor!

---

### Setup
Requirnments:
- Node.js 18+
- npm 10+
- MongoDB

How to run:
#### Without docker
1. Run NPM start and go to generated link
2. Follow instructions and make sure to give access to the repo you want to interact with the bot in!
3. in .env create two entries (subject to change later)
  - URI <-- uri to mongoDB
  - DB_NAME <-- name of mongoDB

#### With docker (development)
1. build docker ```docker build -t OSS-dev .```
2. run docker, binding to project root directory for more seemless development
```
docker run -it --rm \
  -v "$(pwd)":/app/OSS-doorway \
  -p 3000:3000 \
  OSS-dev
```
  - -it for interactive terminal, -d for detached mode
3. check up on docker container with docker logs (img name)

#### Commands
In issues tab, you can interact with basic bot functions, create a new issue and it will list available commands.
