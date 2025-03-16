# RustDok WebUI

This is the web interface for RustDok, a document storage and management system built with Rust.

![Screenshot 2025-03-16 at 21 11 48](https://github.com/user-attachments/assets/6607253e-8c21-4bb8-8d3d-5713f73d00d9)


## Disclaimer

**NO WARRANTY**: RustDok is provided "as is" without warranty of any kind, express or implied. The authors and contributors make no representations or warranties of any kind concerning the software, express or implied, including, without limitation, warranties of merchantability, fitness for a particular purpose, or non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.

Use at your own risk.

## Overview

RustDok WebUI is the frontend component of the RustDok project, providing a user-friendly interface for interacting with the RustDok server. It allows users to manage buckets and objects in an S3-compatible storage backend through a web browser.

## Features

- **Bucket Management**: Create, list, and delete buckets
- **Object Operations**: Upload, download, view, list, and delete objects
- **Folder Navigation**: Browse through folder-like structures
- **Objects Preview**: Built-in viewer for PDF,Images etc. (includes support for more file types but it has not been tested yet)
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Material UI and Tailwind CSS
  
![Screenshot 2025-03-16 at 21 19 30](https://github.com/user-attachments/assets/ed9601e6-2f20-4c1e-a914-657055b3dc89)

## Tech Stack

- **Framework**: Next.js 15
- **UI Libraries**: Material UI 6, Tailwind CSS 4
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **PDF Handling**: react-pdf, pdfjs-dist
- **Language**: JavaScript/TypeScript

## Architecture

The RustDok application consists of two main components:

1. **RustDok Server**: A Rust-based backend service that handles document storage and retrieval.
2. **RustDok WebUI**: A Next.js frontend application that provides a user interface for interacting with the server.

## Proxy Architecture

The application uses a server-side proxy architecture to ensure that:

1. **Browser never directly calls the backend**: All API requests from the browser are routed through the Next.js server.
2. **Server-side rendering**: The Next.js server renders components on the server side when possible.
3. **API proxying**: All API requests are proxied through the `/api/proxy` endpoint.

This architecture provides several benefits:

- **Security**: The browser never directly communicates with the backend service.
- **Kubernetes compatibility**: Works seamlessly with Kubernetes internal DNS names.
- **Consistent behavior**: The same approach works in all deployment scenarios (local development, port-forwarding, direct access).

### How It Works

1. The WebUI server communicates with the RustDok server using the configured API URL.
2. The browser communicates only with the WebUI server through the API proxy.
3. This approach solves the problem of Kubernetes internal DNS names not being resolvable from the browser.
4. Even when not using port-forwarding, this architecture provides a more secure and consistent approach.

## Kubernetes Deployment

When deployed in Kubernetes, the application uses server-side rendering and API proxying to handle internal DNS names.

### Helm Chart Deployment

The RustDok Helm chart provides a comprehensive way to deploy both the server and WebUI components together. The chart's `values.yaml` file now includes detailed descriptions for all configuration parameters, making it easier to understand and configure your deployment.

Key WebUI configuration options in the Helm chart:
- Enable/disable the WebUI component
- Configure image repository, tag, and pull policy
- Set resource limits and requests
- Configure liveness and readiness probes
- Add custom environment variables

For more information, see the [rustdok-helm-chart](https://github.com/stathis-ditc/rustdok-helm-chart).

## Environment Variables

The WebUI requires the following environment variables:

- `NEXT_PUBLIC_RUSTDOK_API_URL`: The URL of the RustDok server (e.g., `http://rustdok-server.default.svc.cluster.local:8080`)
- `NEXT_PUBLIC_RUSTDOK_API_VERSION`: The API version (default: `v1`)

## Building and Deploying

### Building the Docker Image

```bash
docker build -t your-registry/rustdok-webui:latest ./webui
docker push your-registry/rustdok-webui:latest
```

### Deploying with Helm

```bash
helm upgrade rustdok ./k8s/rustdok -f ./k8s/rustdok/my-values.yaml
```

### Accessing the Application

#### Port Forwarding

To access the application through port forwarding:

```bash
kubectl port-forward svc/rustdok-webui 3000:3000
```

Then open your browser and navigate to `http://localhost:3000`.

## Development

### Running Locally

```bash
npm install
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### API Connection Issues

If you're experiencing issues connecting to the API:

1. Check that the `NEXT_PUBLIC_RUSTDOK_API_URL` environment variable is set correctly.
2. Verify that the RustDok server is running and accessible.
3. If using port forwarding, ensure you're accessing the application through the WebUI service.

## Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- [RustDok server](https://github.com/stathis-ditc/rustdok-server) running

## Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm run start
# or
yarn start
```

## Docker Support

### Multi-Architecture Support

The project includes GitHub Actions workflows for building multi-architecture Docker images (AMD64 and ARM64). The workflow automatically builds and pushes images to GitHub Container Registry.

To use the pre-built images:

```bash
docker pull ghcr.io/devs-in-the-cloud/rustdok-webui:latest
```

## Development

- **Code Style**: The project uses ESLint for code linting
- **Styling**: Tailwind CSS is used for styling components
- **Component Structure**: React components are located in the `components` directory
- **Pages**: Next.js pages are located in the `pages` directory
- **API Routes**: API routes are defined in the `pages/api` directory
- **Configuration**: Configuration files are located in the `config` directory

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Related Projects

- [RustDok Server](https://github.com/stathis-ditc/rustdok-server/blob/main/README.md): The backend server component of RustDok
- [Rustdok Helm Chart](https://github.com/stathis-ditc/rustdok-helm-chart/blob/main/README.md)
