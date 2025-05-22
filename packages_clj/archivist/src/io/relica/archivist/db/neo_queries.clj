(ns io.relica.archivist.db.neo-queries
  (:require [neo4j-clj.core :as neo4j]))


(neo4j/defquery related-facts
  "MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE start.uid = $start_uid AND r.rel_type_uid = $rel_type_uid
  RETURN r")
