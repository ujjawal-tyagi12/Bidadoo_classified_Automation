FROM mcr.microsoft.com/playwright:v1.58.0-noble

WORKDIR /app

ENV CI=true
ENV NODE_ENV=test
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package*.json ./
RUN npm ci

COPY . .

RUN mkdir -p /app/test-results /app/reports

CMD ["npx", "playwright", "test"]

# Usage:
#   docker build -t automation-framework .
#   docker run --rm automation-framework
#   docker run --rm automation-framework npx playwright test --grep @smoke
#   docker run --rm -v $(pwd)/reports:/app/reports automation-framework
