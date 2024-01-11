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

use anyhow::{bail, Context, Result};
use clap::Parser;
use diffy::{create_patch, PatchFormatter};
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;
use turtlefmt::{format_turtle, FormatOptions};

/// Apply a consistent formatting to a Turtle file
#[derive(Parser, Debug)]
#[command(author, version, about)]
struct Args {
    /// File(s) or directory to format.
    #[arg()]
    src: Vec<PathBuf>,
    /// Do not edit the file but only checks if it already applies the tool format.
    #[arg(long)]
    check: bool,
    /// Number of spaces in the indentation
    #[arg(long, default_value = "4")]
    indentation: usize,
}

fn main() -> Result<ExitCode> {
    let args = Args::parse();
    let options = FormatOptions {
        indentation: args.indentation,
    };
    let mut exit_code = ExitCode::SUCCESS;

    let mut files = Vec::new();
    for source in args.src {
        if source.is_file() {
            files.push(source);
        } else if source.is_dir() {
            add_files_with_suffix(&source, OsStr::new("ttl"), &mut files)?;
        } else {
            bail!(
                "The target to format {} does not seem to exist",
                source.display()
            );
        }
    }

    for file in files {
        let original = fs::read_to_string(&file)
            .with_context(|| format!("Error while reading {}", file.display()))?;
        let formatted = format_turtle(&original, &options)?;
        if original == formatted {
            // Nothing to do
            continue;
        }
        if args.check {
            let patch = create_patch(&original, &formatted);
            eprintln!("The format of {} is not correct", file.display());
            println!("{}", PatchFormatter::new().with_color().fmt_patch(&patch));
            exit_code = ExitCode::from(65);
        } else {
            fs::write(&file, formatted)?;
        }
    }
    Ok(exit_code)
}

fn add_files_with_suffix(dir: &Path, extension: &OsStr, files: &mut Vec<PathBuf>) -> Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let entry_type = entry.file_type()?;
        if entry_type.is_file() {
            let file = entry.path();
            if file.extension() == Some(extension) {
                files.push(file);
            }
        } else if entry_type.is_dir() {
            add_files_with_suffix(&entry.path(), extension, files)?;
        }
    }
    Ok(())
}
