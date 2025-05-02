 # Create the build
FROM node:12

WORKDIR /app

COPY . .

RUN npm set progress=false && npm ci --no-cache

RUN npm run build

EXPOSE 5000

CMD [ "sh", "-c", "echo $(date) && npm run serve" ]