FROM clojure:temurin-21-tools-deps-jammy
LABEL maintainer="Marc <xtof@relica.io>"

WORKDIR /usr/src/app

# Copy common dependency
COPY ../../common /usr/src/app/packages_clj/common

# Copy prism code
COPY ../ /usr/src/app/packages_clj/prism

WORKDIR /usr/src/app/packages_clj/prism

# Download dependencies
RUN clojure -P

# Expose the API port and REPL port
EXPOSE 3333
EXPOSE 7891

CMD ["clojure", "-M:run"]
