import P from 'parsimmon';

const idx = index => array => array[index];

export default P.createLanguage({
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

  AttributeWithValue({ AttributeName }) {
    const value = P.seq(P.string('"'), P.regexp(/[^"]+/), P.string('"'))
      .desc('Attribute value')
      .map(idx(1));

    return P.seq(AttributeName, P.string('='), value).map(result => {
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
    return Attribute.sepBy(P.optWhitespace).trim(P.optWhitespace);
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
      P.string('/>')
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

  Tree({ OpeningTag, ClosingTag, Children, SelfClosingTag }) {
    const Tree = P.seq(OpeningTag, Children, ClosingTag)
      .desc('XML Tree')
      .map(result => {
        return {
          ...result[0],
          children: result[1],
        };
      });

    return P.alt(Tree, SelfClosingTag).trim(P.optWhitespace);
  },
});
