// 12d MTF files (.mtf), boxing files (.bf) and MTF snippets (.mtfsnippet).
//
// These are line-oriented text files:
//   left_side = {                 an MTF: keyword = { lines }  or  keyword = value
//      150   std                  a row (a chainage and a template)
//      width "kerb" 103 203.0 0.0 3.0 absolute linear      a modifier command: a word, then arguments
//   }
//   // PARAMETER  LAYER  TEXT  "Layer name prefix"  "PIPE"   a snippet's parameter, in a comment
//   @ def_tok NQM $(NQ)           a snippet directive: '@', a space, the directive, arguments
//   insert "$(LAYER)O>>T0" ( $(DZ) + $(ROUT) )              $(NAME) is substituted; ( ) is an expression
//
// The grammar is deliberately loose about arguments (words, numbers, strings, $(tokens), ( ) groups and
// punctuation, in any order): 12d checks the commands, this only has to colour and outline them.

module.exports = grammar({
  name: 'om_12dmtf',

  extras: $ => [/[ \t\r\f]+/, $.line_comment, $.block_comment],

  rules: {
    // Lines are separated by newlines, so the last line needs no newline after it.
    source_file: $ => seq(optional($._line), repeat(seq($._newline, optional($._line)))),

    _line: $ => choice($.block, $.assignment, $.directive, $.command, $.row, $.parameter_comment, $.meta_comment),

    // left_side = {  ...  }          boxing "std kerb" {  ...  }  (a boxing file has no =)
    block: $ => seq(
      field('name', $.word), repeat($._arg), optional('='), '{',
      repeat(seq($._newline, optional($._body_line))),
      '}',
    ),
    _body_line: $ => choice($.directive, $.command, $.row, $.parameter_comment, $.meta_comment),

    // boxing_file = "something.bf"      section_width = 2.5
    assignment: $ => seq(field('name', $.word), '=', field('value', $._arg)),

    // @ directive args
    directive: $ => seq('@', field('name', $.word), repeat($._arg)),

    // width "kerb" 103 203.0 0.0 3.0 absolute linear
    command: $ => seq(field('name', $.word), repeat($._arg)),

    // 150   std      -99999.9 "std"      ( ... )     a line that starts with a value
    row: $ => seq(choice($.number, $.string, $.token_ref, $.group), repeat($._arg)),

    _arg: $ => choice($.word, $.number, $.string, $.token_ref, $.group, $.punctuation),

    // ( $(DZ) + $(ROUT) )     sqrt ( square( 2.0 ) + 1 )
    group: $ => seq('(', repeat($._arg), ')'),

    word: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    number: _ => token(seq(optional('-'), /\d+(\.\d*)?|\.\d+/, optional(/[eE][+-]?\d+/))),

    // "text with $(TOKEN) inside"
    string: $ => seq('"', repeat(choice($.string_content, alias($._string_dollar, $.string_content), alias($._string_token_ref, $.token_ref), $.escape_sequence)), '"'),
    string_content: _ => token.immediate(prec(1, /[^"\\\r\n$]+/)),
    _string_dollar: _ => token.immediate('$'),
    escape_sequence: _ => token.immediate(/\\./),
    _string_token_ref: _ => token.immediate(/\$\([^)\r\n]*\)|\$[A-Za-z_][A-Za-z0-9_]*/),

    // $(NAME)   $(P_T[2:4])   $NAME (the old style)   $null
    token_ref: _ => token(/\$\([^)\r\n]*\)|\$[A-Za-z_][A-Za-z0-9_]*/),

    // < > ; , : * ? / \ + - ! % ^ & | ~ . # and the like (link names like Layer>>A;B, "+" in expressions)
    punctuation: _ => token(/[<>;,:*?\/\\+\-!%^&|~.#=\[\]]/),

    // ---- comments ----------------------------------------------------------------------------
    // A snippet keeps its parameters and help in comments that start with one of these words. They are
    // their own kind of line (higher lexical precedence than an ordinary // comment, which is an extra).

    //   // PARAMETER  NAME  TYPE  "description"  default
    parameter_comment: $ => seq(
      alias(token(prec(2, /\/\/[ \t]*PARAMETER/)), $.meta_marker),
      optional(seq(
        field('name', choice($.word, $.string)),           // usually a word; some shipped snippets quote it
        optional(seq(field('type', choice($.word, $.string)), repeat($._arg))),
      )),
    ),
    //   // INFO text    // DISPLAY name    // INCREMENT name step ...
    meta_comment: $ => seq(
      alias(token(prec(2, /\/\/[ \t]*(START_PARAMETER_REGION|END_PARAMETER_REGION|START_PARAMETER|END_PARAMETER|DISPLAY_TYPE|DISPLAY|INCREMENT|INFO_SIZING|INFO|END_DATE|OUTPUT_PARSING_STAGES|NO_REPEAT_DIRECTIVES)/)), $.meta_marker),
      optional(alias(token(prec(-1, /[^\r\n]+/)), $.meta_text)),
    ),
    line_comment: _ => token(seq('//', /[^\r\n]*/)),
    // /* ... */ across lines (snippets, section 1 of the snippet language)
    block_comment: _ => token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),

    _newline: _ => /\r?\n/,
  },
});
