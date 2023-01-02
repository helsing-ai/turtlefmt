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

use std::path::Path;

fn main() {
    let base_path = Path::new("tree-sitter").to_path_buf();
    let grammar_path = base_path.join("grammar.js");
    let src_path = base_path.join("src");
    let source_path = src_path.join("parser.c");

    tree_sitter_cli::generate::generate_parser_in_directory(&base_path, None, 14, false, None)
        .unwrap();

    cc::Build::new()
        .include(&src_path)
        .file(&source_path)
        .compile("parser");

    println!("cargo:rerun-if-changed={}", grammar_path.to_str().unwrap());
}
