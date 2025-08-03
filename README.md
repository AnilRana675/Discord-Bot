# 🎌 Anime AI Discord Bot

An anime-themed Discord bot that integrates with GitHub AI models to provide AI-powered responses with kawaii personality! Perfect for anime lovers who want an AI waifu assistant in their Discord server.

## ✨ Features

- 🤖 **AI Waifu Assistant** - Chat with different anime personality types (Tsundere, Gentle, Energetic, etc.)
- 🎌 **Anime Commands** - Get quotes, motivation, and recommendations
- 🖼️ **Waifu Pictures** - Random SFW anime pictures in various categories
- 💻 **Code Help** - AI-powered coding assistance with anime flair
- 🎭 **Multiple Personalities** - Choose from 6 different waifu personality types
- 📚 **Anime Recommendations** - Get personalized anime suggestions based on your mood

## Setup

1. **Discord Bot Setup:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the bot token

2. **GitHub Setup:**
   - Generate a GitHub Personal Access Token with appropriate permissions
   - You'll need access to GitHub's AI models

3. **Environment Variables:**
   Create a `.env` file in the root directory:

   ```env
   DISCORD_TOKEN=your_discord_bot_token
   GITHUB_TOKEN=your_github_token
   CLIENT_ID=your_discord_application_client_id
   GUILD_ID=your_discord_server_id
   ```

4. **Installation:**

   ```bash
   npm install
   ```

5. **Running the Bot:**

   ```bash
   npm start
   ```

   For development with auto-restart:

   ```bash
   npm run dev
   ```

## 🎮 Usage

### Main Commands

- **`/waifu <prompt>`** - Chat with your AI waifu! Choose from different personality types
- **`/ai <prompt>`** - Get AI-powered responses for coding, general questions, etc.
- **`/anime quote`** - Get inspirational anime quotes
- **`/anime motivate`** - Get anime-inspired motivation
- **`/anime recommend <mood>`** - Get anime recommendations based on your mood
- **`/waifu-pic <category>`** - Get random SFW waifu pictures
- **`/status`** - Check bot status
- **`/help`** - Show all available commands

### Waifu Personalities

- 🔥 **Tsundere** - "It's not like I want to help you or anything!"
- 🌸 **Gentle** - Sweet and caring personality
- ⚡ **Energetic** - Cheerful genki girl energy
- 🎭 **Mysterious** - Cool and enigmatic responses
- 📚 **Smart** - Studious and academic
- 😊 **Childhood Friend** - Warm and familiar

### Examples

```bash
/waifu prompt:Help me learn Python personality:tsundere
/anime recommend mood:action
/waifu-pic category:neko
/ai prompt:Create a sorting algorithm type:code language:python
```

## 🎌 Commands

### AI & Waifu Commands

- **`/waifu <prompt> [personality]`** - Chat with your AI waifu assistant
- **`/ai <prompt> [type] [language]`** - AI-powered responses with technical options

### Anime Features

- **`/anime quote`** - Random inspirational anime quotes
- **`/anime motivate`** - Anime-inspired motivation messages  
- **`/anime recommend <mood>`** - Personalized anime recommendations
- **`/waifu-pic [category]`** - Random SFW anime pictures

### Utility Commands

- **`/status`** - Bot status and performance metrics
- **`/help`** - Complete command reference

## Configuration

You can modify the bot's behavior by editing the configuration in `src/config.js`.

## Contributing

Feel free to contribute to this project by submitting issues or pull requests.

## License

MIT License
