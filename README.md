# Visa Direct Tester

A professional desktop application for testing Visa Direct APIs. Built with Electron and React.

## Features

- Support for multiple authentication methods:
  - Mutual SSL (2-way SSL)
  - API Key with Shared Secret
  - OAuth 2.0
- Save and manage frequently used API endpoints
- Full request/response visualization
- Message Level Encryption support
- Cross-platform support (macOS and Windows)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd visa-direct-tester
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Building for Production

To create a production build:

```bash
npm run build
```

To package the application:

```bash
npm run package
```

## Development

- `npm run dev` - Start the development server
- `npm run build` - Create a production build
- `npm run package` - Package the application for distribution
- `npm run make` - Create platform-specific distributables

## Configuration

### Authentication

1. Mutual SSL
   - Upload your public and private key certificates
   - Choose between JKS and PKCS12 key store formats

2. API Key
   - Enter your API key and shared secret
   - Configure additional headers as needed

### Proxy Settings

- Configure host and port for proxy connections
- Enable/disable proxy as needed

### Message Level Encryption

- Configure MLE settings for secure communication
- Set up encryption keys and certificates

## License

ISC 