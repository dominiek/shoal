
DURATION=3560
DIR=cert

mkdir -p $DIR

# CA
openssl genrsa -des3 -out $DIR/ca.key 1024
openssl req -new -key $DIR/ca.key -out $DIR/ca.csr
openssl x509 -req -days $DURATION -in $DIR/ca.csr \
    -out $DIR/ca.crt -signkey $DIR/ca.key

# Server Certificate
openssl genrsa -des3 -out $DIR/server.key 1024
openssl req -new -key $DIR/server.key -out $DIR/server.csr
openssl x509 -req -in $DIR/server.csr -out $DIR/server.crt \
    -CA $DIR/ca.crt -CAkey $DIR/ca.key -CAcreateserial -days $DURATION

# Client Certificate
openssl genrsa -des3 -out $DIR/client.key 1024
openssl req -new -key $DIR/client.key -out $DIR/client.csr
openssl x509 -req -in $DIR/client.csr -out $DIR/client.crt \
     -CA $DIR/ca.crt -CAkey $DIR/ca.key -CAcreateserial -days $DURATION
