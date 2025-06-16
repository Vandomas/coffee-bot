# coffee-bot

To install bun (JS Runtime):

```bash
# with install script (recommended)
curl -fsSL https://bun.sh/install | bash

# on windows
powershell -c "irm bun.sh/install.ps1 | iex"

# with npm
npm install -g bun

# with Homebrew
brew tap oven-sh/bun
brew install bun

# with Docker
docker pull oven/bun
docker run --rm --init --ulimit memlock=-1:-1 oven/bun
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
