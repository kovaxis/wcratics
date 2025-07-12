# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

### Using the `adapter-node` adapter

Install production dependencies from the `package.json` and `package-lock.json` files:

```bash
npm ci --omit dev
```

Then run the built `build` directory using Node:

```bash
node build
```

## Deploying with Docker Compose

Simply run:

```bash
docker compose up --build --detach
```
