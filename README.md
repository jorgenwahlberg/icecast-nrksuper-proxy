# icecast-nrksuper-proxy

Icecast proxy for NRK Super, adding track metadata from NRK's API.

Actually, it works for other NRK channels as well. The name of the project might change in the future to reflect this.

# Getting started

Currently, node 22.14 and npm 11.3.0 are the only versions tested. Other versions should work OK as well. 

To build and start the proxy, run these commands:

```
npm install
npm start
```

You can then access the streams at these URLs:

```
http://localhost:3000/listen/super
http://localhost:3000/listen/p1
http://localhost:3000/listen/p3
http://localhost:3000/listen/mp3
http://localhost:3000/listen/p13
``` 

# Build and publish to docker:

I use this command for uploading the docker image to docker hub. Feel free to use it as you wish. 

```
docker build --progress plain -t jorgenwahlberg/docker-icecast-nrksuper-proxy:0.9.3 --push .
```
(replace 0.9.3 first)




# Deploy or update on microk8s

```
microk8s.kubectl apply -f deployment.yaml
```

# Security

Don't run this on the open internet. There are dependencies with known vulnerabilities.
