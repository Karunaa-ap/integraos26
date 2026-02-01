const path = require("path")
const os = require("os")
const fs = require("fs")
const forge = require("node-forge")
const https = require("https")
const url = require("url")
const app = require("next")({ dev: process.env.NODE_ENV !== "production" })

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces()
  const addresses = []

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address)
      }
    }
  }

  return addresses
}

const generateCertificate = () => {
  const certsDir = path.join(__dirname, "certs")
  const caKeyPath = path.join(certsDir, "ca-key.pem")
  const caCertPath = path.join(certsDir, "ca-cert.pem")
  const serverKeyPath = path.join(certsDir, "server-key.pem")
  const serverCertPath = path.join(certsDir, "server-cert.pem")

  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true })
  }

  // Get all local IP addresses
  const localIps = getLocalIpAddresses()
  console.log("Detected local IPs:", localIps)

  // Generate CA (Certificate Authority) if it doesn't exist
  if (!fs.existsSync(caCertPath)) {
    console.log("Generating Certificate Authority...")
    const caKeys = forge.pki.rsa.generateKeyPair(2048)
    const caCert = forge.pki.createCertificate()

    caCert.publicKey = caKeys.publicKey
    caCert.serialNumber = "01"
    caCert.validity.notBefore = new Date()
    caCert.validity.notAfter = new Date()
    caCert.validity.notAfter.setFullYear(caCert.validity.notBefore.getFullYear() + 10)

    const caAttrs = [
      {
        name: "commonName",
        value: "IntegraOS Root CA",
      },
      {
        name: "organizationName",
        value: "IntegraOS",
      },
      {
        name: "organizationalUnitName",
        value: "IT Department",
      },
    ]

    caCert.setSubject(caAttrs)
    caCert.setIssuer(caAttrs)
    caCert.setExtensions([
      {
        name: "basicConstraints",
        cA: true,
      },
      {
        name: "keyUsage",
        keyCertSign: true,
        digitalSignature: true,
        keyEncipherment: true,
      },
    ])

    caCert.sign(caKeys.privateKey, forge.md.sha256.create())

    fs.writeFileSync(caKeyPath, forge.pki.privateKeyToPem(caKeys.privateKey))
    fs.writeFileSync(caCertPath, forge.pki.certificateToPem(caCert))

    console.log("Certificate Authority generated successfully")
  }

  // Generate server certificate signed by CA
  if (!fs.existsSync(serverCertPath) || !fs.existsSync(serverKeyPath)) {
    console.log("Generating SSL certificate for all local IPs...")

    const caKey = forge.pki.privateKeyFromPem(fs.readFileSync(caKeyPath, "utf8"))
    const caCert = forge.pki.certificateFromPem(fs.readFileSync(caCertPath, "utf8"))

    const keys = forge.pki.rsa.generateKeyPair(2048)
    const cert = forge.pki.createCertificate()

    cert.publicKey = keys.publicKey
    cert.serialNumber = Date.now().toString()
    cert.validity.notBefore = new Date()
    cert.validity.notAfter = new Date()
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5)

    const attrs = [
      {
        name: "commonName",
        value: localIps[0] || "localhost",
      },
      {
        name: "organizationName",
        value: "IntegraOS",
      },
    ]

    cert.setSubject(attrs)
    cert.setIssuer(caCert.subject.attributes)

    // Add all local IPs as Subject Alternative Names
    const altNames = [
      { type: 2, value: "localhost" },
      { type: 7, ip: "127.0.0.1" },
    ]

    localIps.forEach((ip) => {
      altNames.push({ type: 7, ip: ip })
      altNames.push({ type: 2, value: ip })
    })

    cert.setExtensions([
      {
        name: "basicConstraints",
        cA: false,
      },
      {
        name: "keyUsage",
        digitalSignature: true,
        keyEncipherment: true,
      },
      {
        name: "extKeyUsage",
        serverAuth: true,
      },
      {
        name: "subjectAltName",
        altNames: altNames,
      },
    ])

    cert.sign(caKey, forge.md.sha256.create())

    fs.writeFileSync(serverKeyPath, forge.pki.privateKeyToPem(keys.privateKey))
    fs.writeFileSync(serverCertPath, forge.pki.certificateToPem(cert))

    console.log("SSL certificate generated for:", localIps.join(", "))
  }

  return {
    key: fs.readFileSync(serverKeyPath),
    cert: fs.readFileSync(serverCertPath),
    ca: fs.readFileSync(caCertPath),
  }
}

const httpsOptions = generateCertificate()

app.prepare().then(() => {
  const server = https.createServer(httpsOptions, (req, res) => {
    const parsedUrl = url.parse(req.url, true)

    // Special route to download CA certificate
    if (parsedUrl.pathname === "/api/download-certificate") {
      const caCertPath = path.join(__dirname, "certs", "ca-cert.pem")

      if (fs.existsSync(caCertPath)) {
        const caCert = fs.readFileSync(caCertPath)
        res.writeHead(200, {
          "Content-Type": "application/x-pem-file",
          "Content-Disposition": 'attachment; filename="IntegraOS-RootCA.pem"',
        })
        res.end(caCert)
      } else {
        res.writeHead(404)
        res.end("Certificate not found")
      }
      return
    }

    app.handle(req, res, parsedUrl)
  })

  const port = process.env.PORT || 3443
  const localIps = getLocalIpAddresses()

  server.listen(port, "0.0.0.0", (err) => {
    if (err) throw err
    console.log(`\n✅ HTTPS Server running on:`)
    console.log(`   https://localhost:${port}`)
    localIps.forEach((ip) => {
      console.log(`   https://${ip}:${port}`)
    })
    console.log(`\n⚠️  To remove "Not Secure" warning:`)
    console.log(`   Windows: Run install-certificate-windows.bat as Administrator`)
    console.log(`   Mac: Run sudo sh install-certificate-mac.sh`)
    console.log(`   Linux: Run sudo sh install-certificate-linux.sh\n`)
  })
})