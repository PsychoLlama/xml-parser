# XML parser

I made this purely for fun. If you're wondering "Who writes an XML parser for fun?" well... me. I do.

I've been playing with parsers lately and wanted an excuse to try out the [Parsimmon](https://github.com/jneen/parsimmon/) parser combinator library on a non-trivial language grammar. Spoilers: it's awesome.

To be clear though: I have no intention of further developing or maintaining this project. It was just an experiment.

## Local usage
Install & compile the program, then point it to an XML-style file.
```sh
$ yarn install
$ yarn build
$ ./dist/index.js ./path/to/file.xml
```

Tested mostly with XML datasets and SVG graphics. For example, this SVG:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg width="52px" height="52px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <circle
    cx="26"
    cy="26"
    r="25"
    fill="#202B33"
    stroke="#F14981"
    stroke-width="2" />
</svg>
```

Generates the following Abstract Syntax Tree ([AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)):
```json
{
  "declaration": {
    "version": "1.0",
    "encoding": "UTF-8"
  },
  "root": {
    "name": "svg",
    "ns": null,
    "attributes": {
      "width": {
        "value": "52px",
        "property": "width",
        "ns": null
      },
      "height": {
        "value": "52px",
        "property": "height",
        "ns": null
      },
      "xmlns": {
        "value": "http://www.w3.org/2000/svg",
        "property": "xmlns",
        "ns": null
      },
      "xmlns:xlink": {
        "value": "http://www.w3.org/1999/xlink",
        "property": "xlink",
        "ns": "xmlns"
      }
    },
    "children": [
      {
        "name": "circle",
        "ns": null,
        "attributes": {
          "cx": {
            "value": "26",
            "property": "cx",
            "ns": null
          },
          "cy": {
            "value": "26",
            "property": "cy",
            "ns": null
          },
          "r": {
            "value": "25",
            "property": "r",
            "ns": null
          },
          "fill": {
            "value": "#202B33",
            "property": "fill",
            "ns": null
          },
          "stroke": {
            "value": "#F14981",
            "property": "stroke",
            "ns": null
          },
          "stroke-width": {
            "value": "2",
            "property": "stroke-width",
            "ns": null
          }
        },
        "children": []
      }
    ]
  }
}
```

Where each tag has a `name`, `attributes` set, array of `children` (possibly containing more tags), and an optional XML namespace. If the document contains an XML declaration (`<?xml ... ?>`) then the metadata is stored in `document.declaration`.

So to summarize, [Parsimmon](https://github.com/jneen/parsimmon/) is cool and you should try it.
