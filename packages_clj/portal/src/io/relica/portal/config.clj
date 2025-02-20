(ns io.relica.portal.config)

(def jwt-secret (or (System/getenv "JWT_SECRET") "changeme"))
(def server-port 2174)
