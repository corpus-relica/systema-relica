(ns io.relica.archivist.core.mundane
  (:require [mundaneum.query :refer [search entity entity-data clojurize-claims describe label query *default-language*]]
            [mundaneum.properties :refer [wdt]]))

(query `{:select *
         :where [[:wd/Q451 ?p ?o]]})

(query `{:select *
         :where [[:wd/Q451 :wdt/P1705 ?o]]})

(entity "Mundaneum")

(query `{:select *
         :where [[~(entity "Mundaneum") :wdt/P1705 ?o]]})
