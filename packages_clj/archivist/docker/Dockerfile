FROM clojure:temurin-17-tools-deps
LABEL maintainer="Marc <xtof@relica.io>"

WORKDIR /usr/src/app

# Copy common dependency
COPY ../../common /usr/src/app/packages_clj/common

# Copy archivist code
COPY ../ /usr/src/app/packages_clj/archivist

WORKDIR /usr/src/app/packages_clj/archivist

# Expose both the application and nREPL ports
EXPOSE 3000
EXPOSE 7890

CMD ["clojure", "-M:run"]