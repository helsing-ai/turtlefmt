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
use std::{env, fs};

fn main() {
    // We copy TreeSitter data to a subdirectory of the build directory
    let source_path = Path::new("tree-sitter").to_path_buf();
    let build_path = Path::new(&env::var_os("OUT_DIR").unwrap()).join("tree-sitter");
    if !build_path.exists() {
        fs::create_dir(&build_path).unwrap();
    }
    fs::copy(
        source_path.join("grammar.js"),
        build_path.join("grammar.js"),
    )
    .unwrap();

    // We convert the TreeSitter grammar to C
    tree_sitter_cli::generate::generate_parser_in_directory(&build_path, None, 14, false, None)
        .unwrap();

    // We build the C code
    let src_path = build_path.join("src");
    cc::Build::new()
        .include(&src_path)
        .file(src_path.join("parser.c"))
        .compile("parser");

    // We make sure the build is run again if the grammar changes
    println!(
        "cargo:rerun-if-changed={}",
        source_path.join("grammar.js").to_str().unwrap()
    );
}
