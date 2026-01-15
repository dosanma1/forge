# Forge Templates

This directory contains deployment templates used by forge-cli for generating service deployments.

## Structure

- `infra/` - Infrastructure and deployment templates
  - `helm/` - Helm chart templates for Kubernetes deployments
    - `go-service/` - Helm chart for Go microservices
    - `nestjs-service/` - Helm chart for NestJS microservices
  - `cloudrun/` - Cloud Run service templates
    - `go-service/` - Cloud Run template for Go services
    - `nestjs-service/` - Cloud Run template for NestJS services
  - `kind-config.yaml` - Local Kubernetes (kind) cluster configuration

## Usage

These templates are referenced by forge-cli based on the `forgeVersion` specified in `forge.json`. The CLI fetches templates from this repository and merges them with service-specific configuration from the workspace's `deploy/` directories.

## Template Variables

Templates use Go template syntax and are populated with configuration from:

1. forge.json project configuration
2. Service-specific deploy/ configuration files
3. Environment-specific overrides

## Versioning

Templates are versioned alongside forge releases. When updating templates, ensure backward compatibility or increment the major version.
