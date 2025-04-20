FROM clojure:temurin-21-tools-deps-jammy
LABEL maintainer="Marc <xtof@relica.io>"

WORKDIR /usr/src/app

# Copy shutter code
COPY packages_clj/shutter /usr/src/app/packages_clj/shutter

WORKDIR /usr/src/app/packages_clj/shutter

# Download dependencies
RUN clojure -P

# Expose the application and nREPL ports
EXPOSE 2173
EXPOSE 7889

CMD ["clojure", "-M:run"]