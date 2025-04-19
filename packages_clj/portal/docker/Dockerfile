FROM clojure:temurin-21-tools-deps-jammy
LABEL maintainer="Marc <xtof@relica.io>"

WORKDIR /usr/src/app

# Copy common dependency
COPY ../../common /usr/src/app/packages_clj/common

# Copy portal code
COPY ../ /usr/src/app/packages_clj/portal

WORKDIR /usr/src/app/packages_clj/portal

# Download dependencies 
RUN clojure -P

# Expose both the application and nREPL ports
EXPOSE 2174
EXPOSE 7890

CMD ["clojure", "-M:run"]