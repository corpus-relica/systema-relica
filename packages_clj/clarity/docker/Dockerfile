FROM clojure:temurin-17-tools-deps
LABEL maintainer="Marc <xtof@relica.io>"

WORKDIR /usr/src/app

# Copy common dependency
COPY ../../common /usr/src/app/packages_clj/common

# Copy clarity code
COPY ../ /usr/src/app/packages_clj/clarity

WORKDIR /usr/src/app/packages_clj/clarity

# Expose both the application and nREPL ports
EXPOSE 2176
EXPOSE 7892

CMD ["clojure", "-M:run"]