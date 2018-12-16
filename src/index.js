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
      P.string('<').trim(P.optWhitespace),
      tagSpecifier.trim(P.optWhitespace),
      Attributes,
      P.string('>').trim(P.optWhitespace)
    ).map(result => {
      return {
        attributes: result[2],
        ...result[1],
      };
    });
  },

  SelfClosingTag({ NamespacedIdentifier, Attribute }) {
    const attributes = Attribute.sepBy(P.optWhitespace).trim(P.optWhitespace);

    return P.seq(
      P.string('<'),
      NamespacedIdentifier,
      attributes,
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

  Tree({ OpeningTag, ClosingTag }) {
    return P.seq(OpeningTag, ClosingTag);
  },
});
