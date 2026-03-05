# syntax=docker/dockerfile:1

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY . .
RUN chmod +x mvnw \
    && ./mvnw -DskipTests package \
    && JAR="$(ls -1 target/*.jar | grep -v '\\.original$' | head -n 1)" \
    && cp "$JAR" app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/app.jar /app/app.jar
EXPOSE 8089
ENTRYPOINT ["java", "-jar", "/app/app.jar"]