(ns io.relica.portal.auth.jwt
  (:require [buddy.sign.jwt :as jwt]
            [clojure.tools.logging :as log]
            [io.relica.portal.config :as config]))

(defn validate-jwt [token]
  (try
    (let [claims (jwt/unsign token config/jwt-secret)]
      (:user-id claims))
    (catch Exception e
      (log/error "JWT validation failed:" e)
      nil)))
