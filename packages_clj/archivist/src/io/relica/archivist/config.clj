(ns io.relica.archivist.config)

(def db-config
  {:postgres {:dbtype "postgresql"
              :dbname (or (System/getenv "POSTGRES_DB") "postgres")
             :host (or (System/getenv "POSTGRES_HOST") "postgres")
             :port (or (System/getenv "POSTGRES_PORT") 5432)
             :user (or (System/getenv "POSTGRES_USER") "user")
             :password (or (System/getenv "POSTGRES_PASSWORD") "password")}

   :redis {:url (or (System/getenv "REDIS_URL") "redis://:redis@redis:6379")
           :host (or (System/getenv "REDIS_HOST") "redis")
           :port (or (System/getenv "REDIS_PORT") 6379)}

   :neo4j {:url (or (System/getenv "NEO4J_URL") "bolt://localhost:7687")
           :host (or (System/getenv "REDIS_HOST") "neo4j")
           :port (or (System/getenv "REDIS_PORT") 7687)
           :user (or (System/getenv "NEO4J_USER") "neo4j")
           :password (or (System/getenv "NEO4J_PASSWORD") "password")}})

      ;; - NEO4J_HOST=neo4j
      ;; - NEO4J_PORT=7687
      ;; - NEO4J_USER=neo4j
      ;; - NEO4J_PASSWORD=password
      ;; - REDIS_URL=redis://:redis@redis:6379

      ;; - POSTGRES_HOST=postgres
      ;; - POSTGRES_PORT=5432
      ;; - POSTGRES_USER=postgres
      ;; - POSTGRES_PASSWORD=password
      ;; - POSTGRES_DB=postgres
