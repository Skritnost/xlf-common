# xlf-merge
Command line tool that extract common translations of any number of XLF 1.2 files.
Input and output is tested and compatible with Angular compiler.

Designed for (but not limited to) Angular-based applications to simplify their i18n process.
The NG compiler requires a single dictionary file per language. If your translations are organized into
many small files, you can run this tool to merge them before invoking the Angular compilation.

## Installation
```bash
# Install globally (run by xlf-merge <parameters>)
npm install xlf-common -g

# Install locally as development tool (run by node ./node_modules/xlf-merge <parameters>)
npm install xlf-common --save-dev
```

## Usage
- Accepts any number of input files (wildcards supported)
- File format is detected by file extension
    - *.xlf, *.xml - file treated as XLF 1.2 
- Requires single output file path (--output parameter) to merge translated texts
```bash
# Extract common translations from three input files into output.xlf
xlf-merge input1.xlf input2.xlf input3.xlf --output all-translations.xlf
```

## Example set-up
Supposing XLF files are in path src/i18n/**.
German translations have pattern *.de.xlf, Swedish translations have pattern *.sv.xlf.
- Install Xlf-merge locally by running "npm install --save-dev xlf-merge"
- Run xlf-merge before production build of Angular application
- Write npm scripts to automate the entire build task, for example:
```json
"scripts": {
    "merge-de": "node ./node_modules/xlf-common input1.xlf input2.xlf input3.xlf --output all-translations.xlf"
}
```

## License
MIT
