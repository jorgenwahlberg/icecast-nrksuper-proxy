# icecast-nrksuper-proxy
Icecast proxy for NRK Super, adding track metadata from NRK's API

# Build and publish to docker:

```
docker buildx build --progress plain --platform=linux/amd64 -t jorgenwahlberg/docker-icecast-nrksuper-proxy:latest --push .
```

