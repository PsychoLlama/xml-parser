import xml from '../language';

describe('xml-parser', () => {
  describe('OpeningTag', () => {
    it('returns an object', () => {
      const tag = xml.OpeningTag.tryParse('<yolo>');

      expect(tag).toMatchObject(expect.any(Object));
    });

    it('contains the tag name', () => {
      const tag = xml.OpeningTag.tryParse('<foreignObject>');

      expect(tag.name).toBe('foreignObject');
    });

    it('dies if the tag name is omitted', () => {
      const parse = () => xml.OpeningTag.tryParse('<>');

      expect(parse).toThrow();
    });

    it('includes the namespace', () => {
      const tag = xml.OpeningTag.tryParse('<svg:foreignObject>');

      expect(tag.ns).toBe('svg');
    });

    it('allows attributes in the tag', () => {
      const tag = xml.OpeningTag.tryParse('<input type="text">');

      expect(tag).toMatchObject({
        attributes: {
          type: { ns: null, property: 'type', value: 'text' },
        },
      });
    });

    it('works with wonky whitespace', () => {
      const tag = xml.OpeningTag.tryParse('<  input type="no" >');

      expect(tag).toMatchObject({
        name: 'input',
      });
    });
  });

  describe('SelfClosingTag', () => {
    it('contains tag-like properties', () => {
      const tag = xml.SelfClosingTag.tryParse('<html:input type="text" />');

      expect(tag).toMatchObject({
        attributes: {
          type: { ns: null, property: 'type', value: 'text' },
        },
        name: 'input',
        children: [],
        ns: 'html',
      });
    });
  });

  describe('Attribute', () => {
    it('returns an object', () => {
      const attr = xml.Attribute.tryParse('yolo="amaze"');

      expect(attr).toEqual(expect.any(Object));
    });

    it('contains the property name', () => {
      const attr = xml.Attribute.tryParse('type="input"');

      expect(attr).toMatchObject({
        property: 'type',
      });
    });

    it('contains the value', () => {
      const attr = xml.Attribute.tryParse('src="http://"');

      expect(attr).toMatchObject({
        value: 'http://',
      });
    });

    it('works with boolean attributes', () => {
      const attr = xml.Attribute.tryParse('disabled');

      expect(attr).toMatchObject({
        property: 'disabled',
        value: 'disabled',
      });
    });

    it('allows hyphens', () => {
      const attr = xml.Attribute.tryParse('tab-index="-1"');

      expect(attr).toMatchObject({
        property: 'tab-index',
        value: '-1',
      });
    });

    it('includes the namespace', () => {
      const attr = xml.Attribute.tryParse('xmlns:xlink="svg"');

      expect(attr).toMatchObject({
        property: 'xlink',
        value: 'svg',
        ns: 'xmlns',
      });
    });
  });

  describe('Attributes', () => {
    it('returns an object', () => {
      const attrs = xml.Attributes.tryParse('type="text" disabled=""');

      expect(attrs).toMatchObject({
        disabled: { property: 'disabled', ns: null, value: '' },
        type: { property: 'type', ns: null, value: 'text' },
      });
    });

    it('includes the namespace in the attribute identifier', () => {
      const attrs = xml.Attributes.tryParse('xmlns:xlink="value"');

      expect(attrs).toMatchObject({
        'xmlns:xlink': { property: 'xlink', ns: 'xmlns', value: 'value' },
      });
    });
  });

  describe('String', () => {
    it('works with single quotes', () => {
      const str = xml.String.tryParse("'single'");

      expect(str).toBe('single');
    });

    it('works with double quotes', () => {
      const str = xml.String.tryParse('"double"');

      expect(str).toBe('double');
    });
  });

  describe('ClosingTag', () => {
    it('includes the tag name and namespace', () => {
      const tag = xml.ClosingTag.tryParse('</soapenv:Body>');

      expect(tag).toMatchObject({
        ns: 'soapenv',
        name: 'Body',
      });
    });

    it('survives with wonky whitespace', () => {
      const tag = xml.ClosingTag.tryParse('<   /   soapenv:Body   >');

      expect(tag).toMatchObject({
        ns: 'soapenv',
        name: 'Body',
      });
    });
  });

  describe('Tree', () => {
    it('returns a tag-like structure', () => {
      const tag = xml.Tree.tryParse('<button>hey</button>');

      expect(tag).toMatchObject({
        name: 'button',
        children: ['hey'],
      });
    });

    it('works with nested elements', () => {
      const tag = xml.Tree.tryParse('<p><b>bold</b></p>');

      expect(tag.children).toHaveLength(1);
      expect(tag.children[0]).toMatchObject({
        children: ['bold'],
        name: 'b',
      });
    });

    it('works with multiline input', () => {
      const input = `
        <html>
          <head>
            <title>Hello parser!</title>
          </head>
        </html>
      `;

      const tag = xml.Tree.tryParse(input);

      expect(tag.name).toBe('html');
      expect(tag.children).toHaveLength(1);
      expect(tag.children[0].name).toBe('head');
      expect(tag.children[0].children).toHaveLength(1);
      expect(tag.children[0].children[0].name).toBe('title');
      expect(tag.children[0].children[0].children).toEqual(['Hello parser!']);
    });

    it('survives for empty tags', () => {
      const pass = () => xml.Tree.tryParse('<script></script>');

      expect(pass).not.toThrow();
      expect(pass()).toMatchObject({
        children: [],
      });
    });

    it('survives with self-closing tags', () => {
      const tag = xml.Tree.tryParse('<input />');

      expect(tag).toMatchObject({
        name: 'input',
        children: [],
      });
    });

    it('accepts multiple children', () => {
      const tag = xml.Tree.tryParse('<p><span></span><br /></p>');

      expect(tag.children).toEqual([
        expect.objectContaining({ name: 'span' }),
        expect.objectContaining({ name: 'br' }),
      ]);
    });

    it('works with mixed children', () => {
      const tag = xml.Tree.tryParse('<p>text <hr /> more text</p>');

      expect(tag.children).toHaveLength(3);
    });

    it('dies if the closing tag mismatches', () => {
      const fail = () => xml.Tree.tryParse('<p></bacon>');

      expect(fail).toThrow(/bacon/);
    });
  });

  describe('Declaration', () => {
    it('returns metadata', () => {
      const dec = xml.Declaration.tryParse(
        '<?xml version="1.1" encoding="UTF-8" ?>'
      );

      expect(dec).toMatchObject({
        encoding: 'UTF-8',
        version: '1.1',
      });
    });

    it('dies if version is omitted', () => {
      const fail = () => xml.Declaration.tryParse('<?xml encoding="UTF-8" ?>');

      expect(fail).toThrow(/version/i);
    });

    it('works with single quote', () => {
      const dec = xml.Declaration.tryParse(
        "<?xml version='1.0' encoding='UTF-8'?>"
      );

      expect(dec).toMatchObject({
        encoding: 'UTF-8',
      });
    });
  });

  describe('Document', () => {
    it('parses the given XML document', () => {
      const document = `
        <?xml version="1.1"?>
        <metadata>
          <title>Content</title>
        </metadata>
      `;

      const doc = xml.Document.tryParse(document);

      expect(doc).toMatchObject({
        declaration: { version: '1.1' },
        root: {
          name: 'metadata',
          children: [
            expect.objectContaining({
              name: 'title',
              children: ['Content'],
            }),
          ],
        },
      });
    });

    // I think this is valid. Not sure. I don't really care enough to find
    // out.
    it('survives without a declaration', () => {
      const doc = xml.Document.tryParse('<no-decl />');

      expect(doc).toMatchObject({
        root: { name: 'no-decl' },
        declaration: null,
      });
    });
  });
});
