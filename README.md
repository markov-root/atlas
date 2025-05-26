# TODO
[ ] parser - post split the imports are not being injected in the files, so the components are not going to render properly
[ ] the size of iframes, images, videos, etc. should span content width
[ ] notes component needs to be reworked similar to definitions and quotes
[ ] footer copy code from mkdocs
[ ] tippy injection
[ ] header component injection + create
[ ] sidebar integrate into 1
[ ] topbar - textbook, course materials, devlog, about, feedback, donate
[ ] plugins - https://docusaurus.community/plugindirectory/
[ ] logo sample top left rotation - https://reactnative.dev/


# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
