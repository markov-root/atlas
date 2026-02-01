#set document(
  title: "Chapter " + str(chapter-number) + ": " + chapter-title,
  author: authors.map(a => a.name)
)

#set page(
  paper: "a4",
  margin: 2.5cm,
  header: context {
    if counter(page).get().first() > 1 [
      #set text(size: 9pt, fill: rgb("#666666"))
      Chapter #chapter-number: #chapter-title
      #h(1fr)
      #counter(page).display()
    ]
  },
  footer: []
)

#set text(
  font: "Jost",
  size: 11pt,
  lang: "en"
)

#set par(
  leading: 0.65em,
  justify: true,
  first-line-indent: 0em
)

#set heading(numbering: (..nums) => {
  let n = nums.pos()
  if n.len() == 1 {
    numbering("1.", ..n)
  } else {
    numbering("1.1", ..n)
  }
})

#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  v(1em)
  text(size: 18pt, weight: "regular", font: "Righteous", it)
  v(0.5em)
}

#show heading.where(level: 2): it => {
  v(0.8em)
  text(size: 14pt, weight: "regular", font: "Righteous", it)
  v(0.4em)
}

#show heading.where(level: 3): it => {
  v(0.6em)
  text(size: 12pt, weight: "regular", font: "Righteous", it)
  v(0.3em)
}

// Link styling
#show link: set text(fill: rgb("#0066cc"))

// Figure caption styling - matches LaTeX captionsetup
#show figure.caption: it => {
  set text(size: 10pt, fill: rgb("#666666"), style: "italic")
  set align(center)
  block(inset: (x: 1.5em, y: 1em))[
    #text(weight: "bold", fill: black, it.supplement + " " + context it.counter.display() + ": ")#it.body
  ]
}

// Colors
#let note-bg = rgb("#f8f9fa")
#let note-border = rgb("#dee2e6")
#let definition-header-bg = rgb("#212529")
#let warning-bg = rgb("#fff3cd")
#let warning-border = rgb("#ffc107")

// Custom definition box
#let definition-box(term, source, content) = {
  block(
    width: 100%,
    stroke: 1pt,
    radius: 4pt,
    clip: true,
    [
      #block(
        width: 100%,
        fill: definition-header-bg,
        inset: (x: 12pt, y: 8pt),
        [
          #text(fill: white, weight: "bold", size: 11pt, upper(term))
          #if source != none {
            h(1fr)
            text(fill: rgb("#adb5bd"), size: 9pt, source)
          }
        ]
      )
      #block(
        width: 100%,
        fill: note-bg,
        inset: 12pt,
        text(style: "italic", content)
      )
    ]
  )
}

// Custom note box - matches LaTeX tcolorbox style
#let note-box(title, content) = {
  v(2em)
  block(
    width: 100%,
    stroke: 1pt + definition-header-bg,
    radius: 6pt,
    clip: true,
    [
      // Header with dark background
      #block(
        width: 100%,
        fill: definition-header-bg,
        inset: (x: 14pt, top: 10pt, bottom: 8pt),
        [
          #text(fill: white, weight: "bold", size: 12pt, title)
          #linebreak()
          #v(2pt)
          #text(fill: rgb("#cccccc"), weight: "bold", size: 8pt, "OPTIONAL NOTE")
        ]
      )
      // Content area
      #block(
        width: 100%,
        fill: note-bg,
        inset: 14pt,
        [
          #set text(size: 9.5pt, fill: rgb("#1a1a1a"))
          #set par(spacing: 1em)
          #content
        ]
      )
    ]
  )
  v(2em)
}

// Custom quote box - matches LaTeX tcolorbox style
#let quote-box(speaker, position, date, source-url, content) = {
  v(2em)
  block(
    width: 100%,
    fill: note-bg,
    radius: 8pt,
    inset: (x: 24pt, y: 20pt),
    [
      // Quote content in italic
      #text(style: "italic", size: 12pt, fill: rgb("#1a1a1a"), content)
      
      // Attribution section (only if speaker provided)
      #if speaker != none [
        #v(12pt)
        #grid(
          columns: (1fr, auto),
          gutter: 8pt,
          [
            // Left side: speaker and position
            #text(weight: "bold", size: 11pt, fill: rgb("#0066cc"), speaker)
            #if position != none [
              #linebreak()
              #text(size: 9pt, fill: rgb("#666666"), position)
            ]
          ],
          align(right)[
            // Right side: date and source
            #if date != none [
              #text(weight: "bold", size: 8.5pt, fill: rgb("#666666"), date)
            ]
            #if source-url != none [
              #if date != none { linebreak() }
              #text(size: 8pt, fill: rgb("#666666"), source-url)
            ]
          ]
        )
      ]
    ]
  )
  v(2em)
}

// Warning callout
#let warning-box(content) = {
  block(
    width: 100%,
    fill: warning-bg,
    stroke: 1pt + warning-border,
    radius: 4pt,
    inset: 12pt,
    [
      #text(weight: "bold", fill: rgb("#856404"), [⚠ Warning])
      #v(4pt)
      #content
    ]
  )
}

// Video placeholder
#let video-placeholder(source) = {
  block(
    width: 100%,
    fill: rgb("#e9ecef"),
    stroke: 1pt + note-border,
    radius: 4pt,
    inset: 16pt,
    align(center)[
      #text(size: 24pt, "▶")
      #v(8pt)
      #text(fill: rgb("#666666"), [Video available on the website])
      #if source != none {
        linebreak()
        text(size: 9pt, fill: rgb("#999999"), source)
      }
    ]
  )
}

// Title page
#let title-page(chapter-number, title, description) = {
  align(center)[
    #v(2fr)
    #text(size: 14pt, fill: rgb("#666666"), weight: "regular", font: "Righteous", [CHAPTER #chapter-number])
    #v(16pt)
    #text(size: 28pt, weight: "regular", font: "Righteous", title)
    #v(24pt)
    #block(width: 70%)[
      #text(size: 11pt, fill: rgb("#444444"), style: "italic", description)
    ]
    #v(2fr)
    #line(length: 40%, stroke: 0.5pt + rgb("#cccccc"))
    #v(16pt)
    #for (i, author) in authors.enumerate() [
      #text(weight: "bold", author.name)
      #linebreak()
      #text(size: 10pt, fill: rgb("#666666"), author.affiliation)
      #if i < authors.len() - 1 { v(8pt) }
    ]
    #v(2fr)
  ]
  pagebreak()
}
