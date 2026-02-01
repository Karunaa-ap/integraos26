#!/bin/bash

echo "========================================"
echo "IntegraOS Certificate Installer (macOS)"
echo "========================================"
echo ""
echo "This will install the SSL certificate"
echo "to make the connection secure"
echo ""

CERT_FILE="./certs/ca-cert.pem"

if [ ! -f "$CERT_FILE" ]; then
    echo "Downloading certificate from server..."
    mkdir -p certs
    curl -k -o "$CERT_FILE" "https://SERVER_IP:3443/api/download-certificate"
fi

if [ ! -f "$CERT_FILE" ]; then
    echo "ERROR: Could not download certificate!"
    echo "Make sure the server is running"
    exit 1
fi

echo "Installing certificate to Keychain..."
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "SUCCESS! Certificate installed"
    echo "========================================"
    echo ""
    echo "Please restart your browser"
    echo "The connection will now show as secure"
else
    echo ""
    echo "ERROR: Installation failed"
fi
