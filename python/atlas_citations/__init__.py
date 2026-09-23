"""Citation resolution and bibliography generation for the AI Safety Atlas.

The Python half of the citation pipeline (``task:0029``). TypeScript walks the
document AST and emits ``data/citations/citations.json``; everything downstream
of that file - resolvers, the CSL store, BibTeX, the reports - lives here.
"""

__all__ = ["__version__"]

__version__ = "0.1.0"
