
DURATION=3560

# CA
openssl genrsa -des3 -out ca.key 1024
openssl req -new -key ca.key -out ca.csr
openssl x509 -req -days $DURATION -in ca.csr \
    -out ca.crt -signkey ca.key

# Server Certificate
openssl genrsa -des3 -out server.key 1024
openssl req -new -key server.key -out server.csr
openssl x509 -req -in server.csr -out server.crt \
    -CA ca.crt -CAkey ca.key -CAcreateserial -days $DURATION

# Client Certificate
openssl genrsa -des3 -out client.key 1024
openssl req -new -key client.key -out client.csr
openssl x509 -req -in client.csr -out client.crt \
     -CA ca.crt -CAkey ca.key -CAcreateserial -days $DURATION