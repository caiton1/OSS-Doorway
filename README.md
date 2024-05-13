# Gamification Bot

> A GitHub App built with [Probot](https://github.com/probot/probot) that aims to gamify the GitHub Experience

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```
You will need to include a mongoDB URI="link" and DB_NAME="database" in the .env file that the initial run will generate after donig the github app setup.
Set up script coming soon!

## Docker

```sh
# 1. Build container
docker build -t my-first-app .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> my-first-app
```

## Contributing

If you have suggestions for how my-first-app could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2024 Connor Aiton


testtest