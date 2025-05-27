# TODO

[ ] render - risks
[ ] render - strategies
[ ] render - governance
[ ] render - generalization
[ ] render - oversight
[ ] render - interpretability
[ ] add section numbering to h3 h4 headers
[ ] font for section numbers on sidebar
[ ] docs page - remove edit page auto insert
[ ] docs page - design next/previous page
[ ] docs landing page - design
[ ] docs page - audio + errors
[ ] home page - design
[ ] quote component - design
[ ] definitions component - design
[ ] warning component - design
[ ] note component - design
[ ] footnote component - change svg
[ ] abbreviations component
[ ] progress bar
[ ] citation box
[ ] meta - add + commit excalidraw
[ ] course page
[ ] devlog page
[ ] about page
[ ] feedback page
[ ] analytics integration
[ ] algolia search integration
[ ] modal - feedback
[ ] donate button + link on topbar
[ ] plugins review - https://docusaurus.community/plugindirectory/


# Website

This website is built using [Docusaurus](https://docusaurus.io/).

### Install Dependencies

The list of dependencies are in package.json

```
$ yarn install
```

### Local Development

```
$ yarn start
```


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
