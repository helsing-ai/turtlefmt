# TurtleFmt

`turtlefmt` is an auto formatter for [RDF Turtle](https://www.w3.org/TR/turtle/) under Apache 2 license.


## Installation

It is currently distributed on:
- [Crates.io](https://crates.io/crates/turtlefmt): `cargo install turtlefmt`
- [Pypi](https://pypi.org/project/turtlefmt): `pipx install turtlefmt`

Build from source requires NodeJS 6.0+ to be available in your `PATH`.


## Usage

To use it:

```sh
turtlefmt MY_TURTLE_FILE.ttl
```

It is also possible to check if formatting of a given file is valid according to the formatter using:

```sh
turtlefmt --check MY_TURTLE_FILE.ttl
```

If the formatting is not valid, a patch to properly format the file is written to the standard output.

It is also possible to check a complete directory (and its subdirectories):

```sh
turtlefmt MY_DIR
```

## Format

`turtlefmt` is in development and its output format is not stable yet.

Example:
```turtle
@prefix ex: <http://example.com/> . # Prefix
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Some facts

<s> a ex:Foo ;
    <p> "foo"@en , ( +01 +1.0 1.0e0 ) . # Foo

# An anonymous blank node
[ ex:p ex:o , ex:o2 ; ex:p2 ex:o3 ] ex:p3 true . # Bar
```

For now, it:
* Validates that the file is valid.
* Maintains consistent indentation and line jumps.
* Normalises string and IRI escapes to reduce their number as much as possible.
* Enforces the use of `"` instead of `'` in literals.
* Uses literals short notation for booleans, integers, decimals and doubles when it keeps the lexical representation unchanged.
* Uses `a` for `rdf:type` where possible.


## License

Copyright 2022 Helsing GmbH

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
