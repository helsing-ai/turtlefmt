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
use oxigraph::io::{GraphFormat, GraphParser};
use oxigraph::model::vocab::rdf;
use oxigraph::model::{Graph, NamedNodeRef, SubjectRef, TermRef};
use std::collections::hash_map::DefaultHasher;
use std::hash::Hasher;
use std::path::Path;
use std::{fs, str};
use turtlefmt::{format_turtle, FormatOptions};

const CACHE: &str = "tests/cache";

fn get_remote_file(url: &str) -> Result<String> {
    let mut hasher = DefaultHasher::new();
    hasher.write(url.as_bytes());
    let cache_path = Path::new(CACHE).join(hasher.finish().to_string());
    if cache_path.exists() {
        return Ok(fs::read_to_string(cache_path)?);
    }

    let content = reqwest::blocking::get(url)?.error_for_status()?.text()?;
    fs::write(cache_path, &content)?;
    Ok(content)
}

fn parse_turtle(url: &str, data: &str) -> Result<Graph> {
    GraphParser::from_format(GraphFormat::Turtle)
        .with_base_iri(url)?
        .read_triples(data.as_bytes())?
        .collect::<std::result::Result<_, _>>()
        .with_context(|| format!("Error while parsing:\n{data}"))
}

fn run_test(test: SubjectRef<'_>, manifest: &Graph) -> Result<()> {
    let Some(TermRef::NamedNode(test_type)) =
        manifest.object_for_subject_predicate(test, rdf::TYPE)
    else {
        bail!("No type")
    };

    let Some(TermRef::NamedNode(input_url)) = manifest.object_for_subject_predicate(
        test,
        NamedNodeRef::new("http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#action")?,
    ) else {
        bail!("No action")
    };
    let original = get_remote_file(input_url.as_str())?.replace('\0', "");
    let formatted_result = format_turtle(&original, &FormatOptions::default());

    match test_type.as_str() {
        "http://www.w3.org/ns/rdftest#TestTurtleEval"
        | "http://www.w3.org/ns/rdftest#TestTurtlePositiveSyntax" => {
            let formatted = formatted_result?;
            let mut original_graph = parse_turtle(input_url.as_str(), &original)?;
            original_graph.canonicalize();
            let mut formatted_graph = parse_turtle(input_url.as_str(), &formatted)?;
            formatted_graph.canonicalize();
            if original_graph != formatted_graph {
                bail!("The formatted graph is not the same as the original graph.\nOriginal:\n{}\n\nFormatted:\n{}", original, formatted);
            }
            let reformatted = format_turtle(&formatted, &FormatOptions::default())?;
            if formatted != reformatted {
                bail!(
                    "The formatting is not stable.\nOriginal:\n{}\n\nReformatted:\n{}",
                    formatted,
                    reformatted
                );
            }
            Ok(())
        }
        "http://www.w3.org/ns/rdftest#TestTurtleNegativeSyntax" => {
            if formatted_result.is_ok() {
                bail!(
                    "The following file has been parsed without error even if it should fail:\n{}",
                    original
                )
            }
            Ok(())
        }
        _ => Ok(()),
    }
}

#[test]
fn test_w3c_files() -> Result<()> {
    fs::create_dir_all(CACHE)?; // We ensure cache existence

    let manifest = parse_turtle(
        "http://w3c.github.io/rdf-tests/rdf/rdf11/rdf-turtle/manifest.ttl",
        &get_remote_file("http://w3c.github.io/rdf-tests/rdf/rdf11/rdf-turtle/manifest.ttl")?,
    )?;
    let errors = manifest
        .subjects_for_predicate_object(
            NamedNodeRef::new("http://www.w3.org/ns/rdftest#approval")?,
            NamedNodeRef::new("http://www.w3.org/ns/rdftest#Approved")?,
        )
        .filter_map(|t| {
            run_test(t, &manifest)
                .with_context(|| format!("{t} failed"))
                .map_err(|e| format!("{e:?}"))
                .err()
        })
        .collect::<Vec<_>>();
    assert!(errors.is_empty(), "{}", errors.join("\n"));
    Ok(())
}
