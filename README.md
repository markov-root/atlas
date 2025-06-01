# TODO

## Render
[ ] risks
[ ] strategies
[ ] governance
[x] generalization
[ ] oversight
[ ] interpretability


 - [ ] next page is broken e.g. http://localhost:3000/chapters/02/01#02 should go to http://localhost:3000/chapters/02/02
 - [ ] facilitate links not being fetched from gdoc
 - [ ] font for section numbers on sidebar
 - [ ] docs page - remove edit page auto insert
 - [ ] docs page - design next/previous page
 - [ ] docs landing page - design
 - [ ] docs page - audio + errors
 - [ ] home page - funders
 - [ ] home page - hero
 - [ ] home page - who we are
 - [ ] home page - what we do
 - [ ] collapse appendix
 - [ ] use theme around #1a202c
 - [ ] definitions counting and numbering
 - [ ] get download pdf working
 - [ ] add image source to quotes
 - [x] get audio + parser working
 - [x] add section numbering to h3 h4 headers

## Design
[x] definitions component
[ ] warning component
[x] note component
[x] footnote component
[x] quote component
[x] tippy, perspective-extreme , offset, large arrow


## New components
[ ] progress bar
[ ] citation box


## Organization
[x] move sidebars.js to config folder
[ ] add + commit excalidraw


## After deployment to main

[ ] feedback forms, explore Formspree
[ ] algolia search integration
[ ] integrate analytics - https://plausible.io/ 

## Future features
[ ] abbreviations component
[ ] course page
[ ] devlog page
[ ] about page
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
