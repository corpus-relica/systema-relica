FROM clojure:temurin-21-tools-deps-jammy
LABEL maintainer="Marc <xtof@relica.io>"

WORKDIR /usr/src/app

# Copy common dependency first 
COPY ../../common /usr/src/app/packages_clj/common

# Copy aperture code
COPY ../ /usr/src/app/packages_clj/aperture

WORKDIR /usr/src/app/packages_clj/aperture

# Expose both the application and nREPL ports
EXPOSE 2175
EXPOSE 7891

CMD ["clojure", "-M:run"]