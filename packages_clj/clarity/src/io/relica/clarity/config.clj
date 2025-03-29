(ns io.relica.clarity.config)

(def app-config
  {:ws-server {:port (or (System/getenv "CLARITY_PORT") 2176)}
   
   ;; Add any other configuration needed for clarity services
   :services {:semantic-model {:cache-enabled (or (System/getenv "SEMANTIC_MODEL_CACHE_ENABLED") true)
                              :cache-ttl (or (System/getenv "SEMANTIC_MODEL_CACHE_TTL") 3600)}}
   
   ;; Add configuration for external services that clarity depends on
   :archivist {:host (or (System/getenv "ARCHIVIST_HOST") "localhost")
               :port (or (System/getenv "ARCHIVIST_PORT") 3000)}})
