import P from 'parsimmon';

const idx = index => array => array[index];

const toNsName = (ns, name) => {
  const nsPrefix = ns ? ns + ':' : '';
  return nsPrefix + name;
};

export default P.createLanguage({
  String() {
    const double = P.string('"');
    const single = P.string("'");

    const singleString = P.seq(single, P.regexp(/[^']*/), single);
    const doubleString = P.seq(double, P.regexp(/[^"]*/), double);

    return P.alt(singleString, doubleString).map(idx(1));
  },

  Identifier() {
    return P.regexp(/([a-z]|-)+/i).desc('Identifier');
  },

  Namespace({ Identifier }) {
    return P.seq(Identifier, P.string(':'))
      .desc('XML namespace')
      .map(idx(0));
  },

  NamespacedIdentifier({ Namespace, Identifier }) {
    const implicit = Identifier.map(ident => [null, ident]);
    const explicit = P.seq(Namespace, Identifier);

    return P.alt(explicit, implicit);
  },

  AttributeName({ NamespacedIdentifier }) {
    return NamespacedIdentifier.desc('Attribute name');
  },

  AttributeWithValue({ AttributeName, String }) {
    const value = String.desc('Attribute value');
    const delimiter = P.string('=').trim(P.optWhitespace);

    return P.seq(AttributeName, delimiter, value).map(result => {
      const [[ns, property]] = result;

      return {
        value: result[2],
        property,
        ns,
      };
    });
  },

  BooleanAttribute({ AttributeName }) {
    return AttributeName.map(([ns, property]) => ({
      value: property,
      property,
      ns,
    }));
  },

  Attribute({ AttributeWithValue, BooleanAttribute }) {
    return P.alt(AttributeWithValue, BooleanAttribute);
  },

  Attributes({ Attribute }) {
    return Attribute.sepBy(P.optWhitespace)
      .trim(P.optWhitespace)
      .map(attrs =>
        attrs.reduce((attrs, attr) => {
          attrs[toNsName(attr.ns, attr.property)] = attr;

          return attrs;
        }, {})
      );
  },

  OpeningTag({ Attributes, NamespacedIdentifier }) {
    const tagSpecifier = NamespacedIdentifier.desc('Tag name').map(result => ({
      name: result[1],
      ns: result[0],
    }));

    return P.seq(
      P.string('<'),
      tagSpecifier.trim(P.optWhitespace),
      Attributes,
      P.string('>')
    ).map(result => {
      return {
        attributes: result[2],
        ...result[1],
      };
    });
  },

  SelfClosingTag({ NamespacedIdentifier, Attributes }) {
    return P.seq(
      P.string('<'),
      NamespacedIdentifier,
      Attributes,
      P.string('/').trim(P.optWhitespace),
      P.string('>')
    ).map(result => {
      const [ns, name] = result[1];

      return {
        attributes: result[2],
        children: [],
        name,
        ns,
      };
    });
  },

  ClosingTag({ NamespacedIdentifier }) {
    const openingDelimiter = P.seq(
      P.string('<').trim(P.optWhitespace),
      P.string('/').trim(P.optWhitespace)
    );

    const closingDelimiter = P.string('>').trim(P.optWhitespace);

    const closingTag = P.seq(
      openingDelimiter,
      NamespacedIdentifier,
      closingDelimiter
    ).desc('Closing tag');

    return closingTag.map(result => {
      const [ns, name] = result[1];

      return {
        name,
        ns,
      };
    });
  },

  Children({ Tree }) {
    return P.alt(Tree, P.regexp(/[^<]+/))
      .sepBy(P.optWhitespace)
      .fallback([]);
  },

  Declaration({ Attributes }) {
    const string = value => P.string(value).trim(P.optWhitespace);
    const marker = P.seq(string('<'), string('?'), string('xml')).desc(
      'XML declaration'
    );

    const terminator = P.seq(string('?'), string('>'));
    const attributes = Attributes.desc('Declaration attributes').chain(
      attrs => {
        if (!attrs.version) {
          return P.fail('required attribute "version" was omitted.');
        }

        return P.of(attrs);
      }
    );

    return P.seq(marker, attributes, terminator).map(result => {
      return Object.keys(result[1]).reduce((attrs, attrName) => {
        const attr = result[1][attrName];
        attrs[attrName] = attr.value;

        return attrs;
      }, {});
    });
  },

  Tree({ OpeningTag, ClosingTag, Children, SelfClosingTag }) {
    const Tree = P.seq(OpeningTag, Children, ClosingTag)
      .desc('tag')
      .chain(result => {
        const [openingTag, children, closingTag] = result;
        const openingTagName = toNsName(openingTag.ns, openingTag.name);
        const closingTagName = toNsName(closingTag.ns, closingTag.name);

        if (openingTagName !== closingTagName) {
          return P.fail(
            `</${openingTagName}> closing tag (got </${closingTagName}> instead)`
          );
        }

        return P.of({
          ...openingTag,
          children,
        });
      });

    return P.alt(Tree, SelfClosingTag).trim(P.optWhitespace);
  },

  Document({ Declaration, Tree }) {
    const withDeclaration = P.seq(Declaration, Tree).map(
      ([declaration, root]) => ({
        declaration,
        root,
      })
    );

    const withoutDeclaration = Tree.map(root => ({
      declaration: null,
      root,
    }));

    return P.alt(withDeclaration, withoutDeclaration);
  },
});
