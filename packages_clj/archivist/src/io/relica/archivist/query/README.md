# Gellish Expression Language (GEL) Parser

## Overview

The GEL Parser is a Clojure implementation of a parser for the Gellish Expression Language, a concise notation for expressing facts, relationships, and queries in knowledge representation systems.

This parser converts GEL expressions into structured Clojure data representations that can be further processed for query generation, execution, and result aggregation.

## Parser Features

The parser supports:

- Basic facts with UIDs and names
- Facts with roles
- Metadata annotations
- Queries with placeholders
- Multiple placeholder shorthands
- Nested entity structures
- Taxonomic queries (lineage and subtype cone)
- Special character handling in quoted strings

## Usage

```clojure
(require '[io.relica.archivist.query.gel-parser :as gel])

;; Basic parsing
(gel/parse "101.Pump A > 1190.has as part > 201.Impeller")

;; Complete pipeline including expansion of nested structures
(gel/parse-and-expand "101.Pump A > 1190.has as part > (201.Impeller, 202.Shaft)")

;; Converting to fact maps for the existing system
(-> "101.Pump A > 1190.has as part > 201.Impeller"
    gel/parse
    gel/parsed-to-facts)
```

## Data Format

The parser generates data in the following structure:

```clojure
;; Basic fact
{:type :statement
 :left {:type :regular :uid 101 :name "Pump A"}
 :relation {:type :regular :uid 1190 :name "has as part"}
 :right {:type :regular :uid 201 :name "Impeller"}}

;; Fact with metadata
[{:type :metadata :key "INTENTION" :value "statement"}
 {:type :statement
  :left {:type :regular :uid 101 :name "Pump A"}
  :relation {:type :regular :uid 1190 :name "has as part"}
  :right {:type :regular :uid 201 :name "Impeller"}}]

;; Query with placeholder
{:type :statement
 :left {:type :regular :uid 101 :name "Pump A"}
 :relation {:type :regular :uid 1190 :name "has as part"}
 :right {:type :placeholder}}

;; Nested structure
{:type :statement
 :left {:type :regular :uid 101 :name "Pump A"}
 :relation {:type :regular :uid 1190 :name "has as part"}
 :right {:type :nested
         :entities [{:type :regular :uid 201 :name "Impeller"}
                    {:type :regular :uid 202 :name "Shaft"}]}}
```

## Complete GEL Specification

See the GEL specification document for the full language definition, including all syntax features, examples, and parsing considerations.

## Implementation Notes

- The parser uses a modular approach, breaking down parsing into smaller specialized functions
- Expansion of shortcuts and nested structures happens in a post-processing phase
- The implementation prioritizes clarity and correctness over optimization

## Future Improvements

- Optimized parsing for very large GEL expressions
- Better handling of quoted strings with special characters
- More sophisticated error reporting
- Integration with Instaparse for a more formal grammar definition