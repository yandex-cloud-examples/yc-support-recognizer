# Recognizr

## Build

### 1. Build docker image

You may need your own container registry
https://yandex.cloud/docs/container-registry/operations/registry/registry-create

login:

```
token=`yc iam create-token`
docker login -u iam -p $token cr.yandex
```

build:

```
docker build . -t cr.yandex/$repository/recognizr
```

push:

```
docker push cr.yandex/$repository/recognizr
```

### 2.1 (Optional) create SmartCaptcha

https://yandex.cloud/ru/docs/smartcaptcha/
You'll need Server key and User key.

### 2.2 (Optional) order certificate

You may use LetsEncrypt

### 2.3 (Optional) register name

Use any available registrar

### 3.A Provision serverles container

Provide ContainerRegistry URL
SCC as SmartCaptcha Client key
SCS as SmartCaptcha Server key
Omit them if you don't want to protect your recognizr
Hint: store keys in LockBox

### 3.B SetUp COI VM

use docker-compose-fluentbit.yaml as docker compose for COI
(use docker-compose-simple.yaml if it's too hard for you)
Configure fluentbit.
https://yandex.cloud/ru/docs/logging/tutorials/coi-fluent-bit-logging#fluent-bit
Needed files are in fluentbit/
You'll need logging group

### Further setup

Add DataStream to a logging group
Direct DataStream to S3 to store logs
Dtirect DataStream to YDB for analytics
Configure TTL on YDB
Create Datalens Source
Create Dataset. Use this query:
```
SELECT
    --JSON_QUERY(`jsonPayload`, "$") as Payload,
    JSON_VALUE(`jsonPayload`, "$.msg.DateTime") as DateTime,
    JSON_VALUE(`jsonPayload`, "$.msg.ForwardedFor") as ForwardedFor,
    JSON_VALUE(`jsonPayload`, "$.msg.IP") as IP,
    JSON_VALUE(`jsonPayload`, "$.msg.Method") as Method,
    JSON_VALUE(`jsonPayload`, "$.msg.Path") as Path,
    JSON_VALUE(`jsonPayload`, "$.msg.URI") as URI,
    JSON_VALUE(`jsonPayload`, "$.msg.UserAgent") as UserAgent,
    JSON_VALUE(`jsonPayload`, "$.msg.info") as info,
    JSON_VALUE(`jsonPayload`, "$.msg.model") as model
FROM `recognizr-logs`
```


## Usage

Navigate to recognizr URL
Copy/Paste, open, drag&drop or use plugins to provide image.
Wait.
Grab recognition results.

Observe statistics in DataLens dasboard:

