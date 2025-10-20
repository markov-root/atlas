Python scripts for converting Google Docs exports into multiple documentation formats (Docusaurus, LaTeX, TTS-ready text). The scripts handle preprocessing, format conversion, and output generation for Docusaurus websites, LaTeX PDFs, and text-to-speech engines.

Here is the general flow: Edit on Google Docs → Export Zip via Gdoc to MD Pro Plugin → Run Parser → Preprocess Parser → Other parsers

This means you can jump in and edit/translate/fork at any point in the pipeline - Gdoc, Markdown, LaTeX, or website ready mdx.

## Target Audience

I can see these being most useful for:
- **Translators** who want to work with preprocessed files and automatically generate Docusaurus and LaTeX outputs

## Directory Structure

To use these scripts, set up the following directory structure:

```
project-root/
├── processed/          # Output directory (auto-generated)
├── scripts/            # This repository
└── source_zips/        # Input: Google Docs exports (*.zip)
```

### Required Setup

1. Export your Google Docs using the **Docs to Markdown** plugin
2. Place the exported `.zip` files in the `source_zips/` directory (I uploaded these already into the git repo, if you dont want to buy the plugin)
3. Run the conversion scripts from the `scripts/` directory
## Usage

The main entry point is `convert.py`, which accepts various commands for different processing stages.

### Basic Syntax

```bash
python convert.py <input> [options]
```

### Input Formats

- **Zip file path**: `source_zips/ch5.zip` - Process a new export
- **Directory name**: `ch5` - Process an existing preprocessed directory

### Processing Options

- `--preprocess` - Run preprocessing only (always run this first for new exports)
- `--docusaurus` - Generate Docusaurus MDX files
- `--latex` - Generate LaTeX files
- `--tts` - Generate TTS-ready text files
- `--full` - Run all processing steps sequentially
- `--debug` - Enable debug output for troubleshooting

### Examples

```bash
# Initial preprocessing of a new chapter export
python convert.py source_zips/ch5.zip --preprocess

# Generate Docusaurus files from preprocessed content
python convert.py ch5 --docusaurus

# Run complete pipeline on a new export
python convert.py source_zips/ch5.zip --full

# Generate LaTeX with debug information
python convert.py source_zips/ch5.zip --latex --debug

# Generate TTS-ready files from existing preprocessed content
python convert.py ch5 --tts
```

## Processing Pipeline

### 1. Preprocess Parser

**Purpose**: Cleans up Google Docs export and creates a standardized format for subsequent parsers.

**What it does**:

- Cleans up exported Markdown formatting
- Splits content into section-level files
- Generates table of contents
- Creates metadata files
- Establishes a common format for all downstream parsers

**Output location**: `processed/0X/chX/preprocessed/`

**Note**: This should always be run first when processing a new export.

### 2. Docusaurus Parser

**Purpose**: Converts preprocessed files into Docusaurus-compatible MDX format.

**What it does**:

- Transforms Markdown to MDX
- Injects JSX components where needed
- Generates `sidebars.js` configuration
- Creates Docusaurus-specific frontmatter

**Output location**: `processed/0X/chX/docusaurus/`

### 3. LaTeX Parser

**Purpose**: Generates LaTeX files suitable for PDF compilation.

**What it does**:

- Converts Markdown syntax to LaTeX commands
- Handles special characters and formatting
- Creates `main.tex` and supporting files

**Output location**: `processed/0X/chX/latex/`

**Manual compilation required**:

```bash
cd processed/0X/chX/latex/
pdflatex main.tex
```

**Note**: LaTeX compilation can be finicky with special characters. Some manual adjustments may be needed for certain chapters.

### 4. TTS Parser

**Purpose**: Prepares clean text for text-to-speech engines.

**What it does**:

- Strips Markdown formatting
- Removes code blocks
- Cleans special characters
- Creates plain text suitable for TTS engines (e.g., Gemini Pro)

**Output location**: `processed/0X/chX/tts/`

## Output Structure

After processing, your output will be organized as:

```
processed/
└── 0X/                 # Book/section number
    └── chX/            # Chapter number
        ├── preprocessed/
        ├── docusaurus/
        ├── latex/
        └── tts/
```

### LaTeX Compilation Issues

LaTeX processing can fail due to special characters or complex formatting. If compilation fails:

1. Run with debug flag: `python convert.py chX --latex --debug`
2. Check the output for specific error messages
3. Manually edit the generated `.tex` files in `processed/0X/chX/latex/`
4. Compile manually: `cd processed/0X/chX/latex/ && pdflatex main.tex`

### Path Issues

The scripts expect to be run from the `scripts/` directory and will look for source files in `../source_zips/`. If you have a different setup, you can specify absolute paths:

```bash
python convert.py /path/to/export.zip --preprocess
```
