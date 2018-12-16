import xml from '../index';

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
        attributes: [{ property: 'type', value: 'text' }],
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
        attributes: [{ ns: null, property: 'type', value: 'text' }],
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
  });
});
