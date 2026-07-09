FROM python:3.12-alpine@sha256:6d43704baacd1bfbe7c295d7f13079d5d8104ed33568873133f8fc69980419df

RUN addgroup -S -g 65532 sandbox \
    && adduser -S -D -H -u 65532 -G sandbox sandbox \
    && mkdir /sandbox \
    && chown 65532:65532 /sandbox

COPY runner.py /runner.py

USER 65532:65532
WORKDIR /sandbox

ENTRYPOINT ["python3", "-I", "-S", "-B", "/runner.py"]
