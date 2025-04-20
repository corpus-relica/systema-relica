FROM clojure:temurin-17-tools-deps
LABEL maintainer="Marc <xtof@relica.io>"

WORKDIR /usr/src/app

# Copy common dependency
COPY packages_clj/common /usr/src/app/packages_clj/common

# Copy clarity code
COPY packages_clj/clarity /usr/src/app/packages_clj/clarity

WORKDIR /usr/src/app/packages_clj/clarity

# Expose both the application and nREPL ports
EXPOSE 2176
EXPOSE 7893

CMD ["clojure", "-M:run"]
