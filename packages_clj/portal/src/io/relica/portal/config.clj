(ns io.relica.portal.config)

(def jwt-secret (or (System/getenv "JWT_SECRET") "changeme"))
(def server-port 2174)

(def app-config
  {:ws-server {:port (or (System/getenv "PORTAL_PORT") 2174)}

   ;; Add any other configuration needed for portal services
   ;; :services {:semantic-model {:cache-enabled (or (System/getenv "SEMANTIC_MODEL_CACHE_ENABLED") true)
   ;;                            :cache-ttl (or (System/getenv "SEMANTIC_MODEL_CACHE_TTL") 3600)}}

   ;; Add configuration for external services that portal depends on
   :archivist {:host (or (System/getenv "ARCHIVIST_HOST") "localhost")
               :port (or (System/getenv "ARCHIVIST_PORT") 3000)}
   :clarity {:host (or (System/getenv "CLARITY_HOST") "localhost")
             :port (or (System/getenv "CLARITY_PORT") 2176)}
   :aperture {:host (or (System/getenv "APERTURE_HOST") "localhost")
             :port (or (System/getenv "APERTURE_PORT") 2175)}})
