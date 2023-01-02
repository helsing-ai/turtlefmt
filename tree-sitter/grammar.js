/*
    Copyright 2022 Helsing GmbH

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

function caseInsensitive(word) {
    return alias(new RegExp(word.split('')
        .map(letter => `[${letter.toLowerCase()}${letter.toUpperCase()}]`)
        .join('')), word);
}

// [163s] 	PN_CHARS_BASE 	::= 	[A-Z] | [a-z] | [#x00C0-#x00D6] | [#x00D8-#x00F6] | [#x00F8-#x02FF] | [#x0370-#x037D] | [#x037F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
const PN_CHAR_BASE = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}'

// [164s] 	PN_CHARS_U 	::= 	PN_CHARS_BASE | '_'
const PN_CHARS_U = PN_CHAR_BASE + '_'

// [166s] 	PN_CHARS 	::= 	PN_CHARS_U | '-' | [0-9] | #x00B7 | [#x0300-#x036F] | [#x203F-#x2040]
const  PN_CHARS = PN_CHARS_U + '\\-0-9\u00B7\u0300-\u036F\u203F-\u2040'

// [169s] 	PLX 	::= 	PERCENT | PN_LOCAL_ESC
// [170s] 	PERCENT 	::= 	'%' HEX HEX
// [171s] 	HEX 	::= 	[0-9] | [A-F] | [a-f]
// [172s] 	PN_LOCAL_ESC 	::= 	'\' ('_' | '~' | '.' | '-' | '!' | '$' | '&' | "'" | '(' | ')' | '*' | '+' | ',' | ';' | '=' | '/' | '?' | '#' | '@' | '%')
const PLX = '%[0-9a-fA-F]{2}|\\\\[_~.\\-!$&\'()*+,;=/?#@%]'

module.exports = grammar({
    name: 'turtle',

    extras: $ => [/\s*/, $.comment],

    rules: {
        // [1] 	turtleDoc 	::= 	statement*
        turtle_doc: $ => repeat($._statement),

        // [2] 	statement 	::= 	directive | triples '.'
        _statement: $ => choice($._directive, $.triples), // We move the '.' to the triples rule to make the AST cleaner

        // [3] 	directive 	::= 	prefixID | base | sparqlPrefix | sparqlBase
        _directive: $ => choice($.prefix, $.base),

        // [4] 	prefixID 	::= 	'@prefix' PNAME_NS IRIREF '.'
        // [6s] sparqlPrefix 	::= 	"PREFIX" PNAME_NS IRIREF
        prefix: $ => choice(seq('@prefix', field('label', $._pname_ns), field('iri', $._iriref), '.'), seq(caseInsensitive('PREFIX'), field('label', $._pname_ns), field('iri', $._iriref))),

        // [5] 	base 	::= 	'@base' IRIREF '.'
        // [5s] sparqlBase 	::= 	"BASE" IRIREF
        base: $ => choice(seq('@base', field('iri', $._iriref), '.'), seq(caseInsensitive('BASE'), field('iri', $._iriref))),

        // [6] 	triples 	::= 	subject predicateObjectList | blankNodePropertyList predicateObjectList?
        triples: $ => choice(seq(field('subject', $._subject), $._predicate_object_list, '.'), seq(field('subject', $.blank_node_property_list), optional($._predicate_object_list), '.')),

        // [7] 	predicateObjectList 	::= 	verb objectList (';' (verb objectList)?)*
        _predicate_object_list: $ => seq($.predicate_objects, repeat(seq(';', optional($.predicate_objects)))),
        predicate_objects: $ => seq(field('predicate', $._verb), $._object_list),

        // [8] 	objectList 	::= 	object (',' object)*
        _object_list: $ => seq($._object, repeat(seq(',', $._object))),

        // [9] 	verb 	::= 	predicate | 'a'
        _verb: $ => choice($._predicate, $.a),
        a: $ => 'a',

        // [10] 	subject 	::= 	iri | BlankNode | collection
        _subject: $ => choice($._iri, $._blank_node, $.collection),

        // [11] 	predicate 	::= 	iri
        _predicate: $ => $._iri,

        // [12] 	object 	::= 	iri | BlankNode | collection | blankNodePropertyList | literal
        _object: $ => choice($._iri, $._blank_node, $.collection, $.blank_node_property_list, $._literal),

        // [13] 	literal 	::= 	RDFLiteral | NumericLiteral | BooleanLiteral
        _literal: $ => choice($.literal, $._numeric_literal, $.boolean),

        // [14] 	blankNodePropertyList 	::= 	'[' predicateObjectList ']'
        blank_node_property_list: $ => seq('[', $._predicate_object_list, ']'),

        // [15] 	collection 	::= 	'(' object* ')'
        collection: $ => seq('(', repeat($._object), ')'),

        // [16] 	NumericLiteral 	::= 	INTEGER | DECIMAL | DOUBLE
        _numeric_literal: $ => choice($.integer, $.decimal, $.double),

        // [128s] 	RDFLiteral 	::= 	String (LANGTAG | '^^' iri)?
        literal: $ => seq(field('value', $.string), optional(choice(field('language', $._langtag), seq('^^', field('datatype', $._iri))))),

        // [133s] 	BooleanLiteral 	::= 	'true' | 'false'
        boolean: $ => token(choice('true', 'false')),

        // [17] 	String 	::= 	STRING_LITERAL_QUOTE | STRING_LITERAL_SINGLE_QUOTE | STRING_LITERAL_LONG_SINGLE_QUOTE | STRING_LITERAL_LONG_QUOTE
        // [22] 	STRING_LITERAL_QUOTE 	::= 	'"' ([^#x22#x5C#xA#xD] | ECHAR | UCHAR)* '"' /* #x22=" #x5C=\ #xA=new line #xD=carriage return */
        // [23] 	STRING_LITERAL_SINGLE_QUOTE 	::= 	"'" ([^#x27#x5C#xA#xD] | ECHAR | UCHAR)* "'" /* #x27=' #x5C=\ #xA=new line #xD=carriage return */
        // [24] 	STRING_LITERAL_LONG_SINGLE_QUOTE 	::= 	"'''" (("'" | "''")? ([^'\] | ECHAR | UCHAR))* "'''"
        // [25] 	STRING_LITERAL_LONG_QUOTE 	::= 	'"""' (('"' | '""')? ([^"\] | ECHAR | UCHAR))* '"""'
        // [26] 	UCHAR 	::= 	'\u' HEX HEX HEX HEX | '\U' HEX HEX HEX HEX HEX HEX HEX HEX
        // [159s] 	ECHAR 	::= 	'\' [tbnrf"'\]
        // [171s] 	HEX 	::= 	[0-9] | [A-F] | [a-f]
        string: $ => choice(
            /"([^"\\\r\n]|\\[tbnrf"'\\]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})*"/,
            /'([^'\\\r\n]|\\[tbnrf"'\\]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})*'/,
            /'''('?'?([^'\\]|\\[tbnrf"'\\]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8}))*'''/,
            /"""("?"?([^"\\]|\\[tbnrf"'\\]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8}))*"""/,
        ),

        // [135s] 	iri 	::= 	IRIREF | PrefixedName
        _iri: $ => choice($._iriref, $.prefixed_name),

        // [136s] 	PrefixedName 	::= 	PNAME_LN | PNAME_NS
        // [140s] 	PNAME_LN 	::= 	PNAME_NS PN_LOCAL
        prefixed_name: $ => new RegExp("([" + PN_CHAR_BASE + "]([" + PN_CHARS + ".]*[" + PN_CHARS + "])?)?:(([" + PN_CHARS_U + ":0-9]|" + PLX + ")(([" + PN_CHARS + ".:]|" + PLX + ")*([" + PN_CHARS + ":]|" + PLX + "))?)?", 'u'),

        // [137s] 	BlankNode 	::= 	BLANK_NODE_LABEL | ANON
        _blank_node: $ => choice($._blank_node_label, $.anon),

        // [18] 	IRIREF 	::= 	'<' ([^#x00-#x20<>"{}|^`\] | UCHAR)* '>' /* #x00=NULL #01-#x1F=control codes #x20=space */
        _iriref: $ => seq('<', $.iriref, token.immediate('>')),
        iriref: $ => token.immediate(/([^\x00-\x20<>"{}|^`\\]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})*/),

        // [139s] 	PNAME_NS 	::= 	PN_PREFIX? ':'
        _pname_ns: $ => seq(optional($.pn_prefix), ':'),

        // [141s] 	BLANK_NODE_LABEL 	::= 	'_:' (PN_CHARS_U | [0-9]) ((PN_CHARS | '.')* PN_CHARS)?
        _blank_node_label: $ => seq('_:', $.blank_node_label),
        blank_node_label: $ => token.immediate(new RegExp("[" + PN_CHARS_U + "0-9]([" + PN_CHARS + ".]*[" + PN_CHARS + "])?", 'u')),

        // [144s] 	LANGTAG 	::= 	'@' [a-zA-Z]+ ('-' [a-zA-Z0-9]+)*
        _langtag: $ => seq('@', $.langtag),
        langtag: $ => token.immediate(/[a-zA-Z]+(-[a-zA-Z0-9]+)*/),

        // [19] 	INTEGER 	::= 	[+-]? [0-9]+
        integer: $ => /[+-]?[0-9]+/,

        // [20] 	DECIMAL 	::= 	[+-]? [0-9]* '.' [0-9]+,
        decimal: $ => /[+-]?[0-9]*\.[0-9]+/,

        // [21] 	DOUBLE 	::= 	[+-]? ([0-9]+ '.' [0-9]* EXPONENT | '.' [0-9]+ EXPONENT | [0-9]+ EXPONENT)
        // [154s] 	EXPONENT 	::= 	[eE] [+-]? [0-9]+
        double: $ => /[+-]?([0-9]+\.[0-9]*[eE][+-]?[0-9]+|\.[0-9]+[eE][+-]?[0-9]+|[0-9]+[eE][+-]?[0-9]+)/,

        // [162s] 	ANON 	::= 	'[' WS* ']'
        anon: $ => /\[\s*]/,

        // [167s] 	PN_PREFIX 	::= 	PN_CHARS_BASE ((PN_CHARS | '.')* PN_CHARS)?
        pn_prefix: $ => new RegExp("[" + PN_CHAR_BASE + "]([" + PN_CHARS + ".]*[" + PN_CHARS + "])?", 'u'),

        // [168s] 	PN_LOCAL 	::= 	(PN_CHARS_U | ':' | [0-9] | PLX) ((PN_CHARS | '.' | ':' | PLX)* (PN_CHARS | ':' | PLX))?
        pn_local: $ => token.immediate(new RegExp("([" + PN_CHARS_U + ":0-9]|" + PLX + ")(([" + PN_CHARS + ".:]|" + PLX + ")*([" + PN_CHARS + ":]|" + PLX + "))?", 'u')),

        comment: $ => token(prec(-1, /#[^\r\n]*/)),
    }
});
