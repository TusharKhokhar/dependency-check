openssl genrsa -out rootCAKey.key 2048
openssl req -new -sha256 -key rootCAKey.key -nodes -out rootCA.csr -config rootCA.conf
openssl x509 -req -days 18262 -extfile rootCA.conf -extensions v3_ca -in rootCA.csr -signkey rootCAKey.key -out root_CA_cert.pem
openssl genrsa -out verification_cert_key.key 2048
openssl req -new -key verification_cert_key.key -out verification_cert_csr.csr -config rootCA.conf
openssl x509 -req -in verification_cert_csr.csr -CA root_CA_cert.pem -CAkey rootCAKey.key -CAcreateserial \
    -out verification_cert.pem \
    -days 18262 -sha256


#Your CA certificate file (root_CA_cert.pem used in the previous command)
#The verification certificate you created in the previous step (verification_cert.pem used in the previous command)

#To register CA in other region or accounts

#aws iot register-ca-certificate \
#    --ca-certificate file://root_CA_cert.pem \
#    --certificate-mode SNI_ONLY


#rootCAKey.key is a private key to be used to create device certs to be updated in aws secrets