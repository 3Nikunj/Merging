FROM python:3.12-alpine@sha256:6d43704baacd1bfbe7c295d7f13079d5d8104ed33568873133f8fc69980419df

WORKDIR /executor

RUN apk add --no-cache docker-cli \
    && addgroup -S -g 10001 executor \
    && adduser -S -D -H -u 10001 -G executor executor

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

USER 10001:10001

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--no-server-header"]
