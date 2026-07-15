# @drmikecrowe/hatago-mcp-hub

[![npm](https://img.shields.io/npm/v/@drmikecrowe/hatago-mcp-hub?logo=npm&color=cb0000)](https://www.npmjs.com/package/@drmikecrowe/hatago-mcp-hub)
[![GitHub Release](https://img.shields.io/github/v/release/drmikecrowe/hatago-mcp-hub?display_name=tag&sort=semver)](https://github.com/drmikecrowe/hatago-mcp-hub/releases)

Unified MCP (Model Context Protocol) Hub for managing multiple MCP servers. Works with Claude Code, Codex CLI, Cursor, Windsurf, VS Code and other MCP-compatible tools.

> [!NOTE]
> **This is a fork of [himorishige/hatago-mcp-hub](https://github.com/himorishige/hatago-mcp-hub)**, created by [Hiroshi Morishige (@himorishige)](https://github.com/himorishige). Full credit for Hatago's original design, architecture, and "thin implementation" philosophy belongs to the upstream project — this fork only layers optional customization features (server instructions, per-server skills, tool filtering/overrides) on top of it. If upstream adopts these (or equivalent) features, this fork will converge back to track upstream as the canonical source.

## Quick Start

```bash
# Initialize configuration
npx @drmikecrowe/hatago-mcp-hub init

# Start server in STDIO mode (for Claude Code)
# NOTE: STDIO mode requires a config file path
npx @drmikecrowe/hatago-mcp-hub serve --stdio --config ./hatago.config.json

# Start server in HTTP mode (for development/debugging)
npx @drmikecrowe/hatago-mcp-hub serve --http --port 3535
```

## Installation

### As a Command Line Tool (Recommended)

```bash
# Use directly with npx (no installation needed)
npx @drmikecrowe/hatago-mcp-hub init
# STDIO requires config
npx @drmikecrowe/hatago-mcp-hub serve --stdio --config ./hatago.config.json
# Or HTTP without config (for demo/dev)
npx @drmikecrowe/hatago-mcp-hub serve --http

# Or install globally
npm install -g @drmikecrowe/hatago-mcp-hub
hatago init
hatago serve
```

### As a Project Dependency

```bash
npm install @drmikecrowe/hatago-mcp-hub
```

## Commands

### `hatago init`

Create a default configuration file with interactive mode selection:

```bash
hatago init                    # Interactive mode selection
hatago init --mode stdio       # Create config for STDIO mode
hatago init --mode http        # Create config for StreamableHTTP mode
hatago init --force            # Overwrite existing config
```

### `hatago serve`

Start the MCP Hub server:

```bash
hatago serve --stdio --config ./hatago.config.json  # STDIO mode (default, requires config)
hatago serve --http                                 # HTTP mode (config optional)
hatago serve --config custom.json  # Use custom config file
hatago serve --verbose         # Enable debug logging
hatago serve --env-file ./.env # Load variables from .env before start (can repeat)
hatago serve --env-override    # Override existing process.env with values from env-file(s)
```

#### Environment Variables from Files

`--env-file <path...>` loads environment variables from one or more files before configuration is parsed. This allows `${VAR}` and `${VAR:-default}` placeholders in `hatago.config.json` to resolve without exporting variables manually.

- Supports lines like `KEY=VALUE`, `export KEY=VALUE`, comments starting with `#`, and empty lines.
- Quotes are stripped from values; `\n`, `\r`, `\t` escapes are expanded.
- Relative paths are resolved from the current working directory; `~/` is expanded to the home directory.
- By default, existing `process.env` keys are preserved. Use `--env-override` to overwrite.

Examples:

```bash
hatago serve --http --env-file ./.env
hatago serve --http --env-file ./base.env ./secrets.env
hatago serve --http --env-file ./local.env --env-override
```

## Usage with MCP Clients

> Terminology: In this document, "HTTP mode" refers to the MCP SDK's StreamableHTTP transport. We mention "StreamableHTTP" only once here for clarity; elsewhere we say "HTTP mode". [ISA]

### STDIO Mode

#### Claude Code, Gemini CLI

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "hatago": {
      "command": "npx",
      "args": [
        "@drmikecrowe/hatago-mcp-hub",
        "serve",
        "--stdio",
        "--config",
        "./hatago.config.json"
      ]
    }
  }
}
```

#### Codex CLI

Add to your `~/.codex/config.toml`:

```toml
[mcp_servers.hatago]
command = "npx"
args = ["-y", "@drmikecrowe/hatago-mcp-hub", "serve", "--stdio", "--config", "./hatago.config.json"]
```

### HTTP Mode (StreamableHTTP transport)

#### Claude Code, Gemini CLI

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "hatago": {
      "url": "http://localhost:3535/mcp"
    }
  }
}
```

#### Codex CLI

Add to your `~/.codex/config.toml`:

```toml
[mcp_servers.hatago]
command = "npx"
args = ["-y", "mcp-remote", "http://localhost:3535/mcp"]
```

Note: Codex CLI connects via STDIO; use `mcp-remote` to bridge HTTP endpoints.

### MCP Inspector

Start in HTTP mode and connect:

````bash
hatago serve --http --port 3535

# Connect MCP Inspector to:
# - Endpoint: http://localhost:3535/mcp

### Metrics (opt-in)

Enable lightweight metrics and expose an endpoint (HTTP mode only):

```bash
HATAGO_METRICS=1 hatago serve --http --port 3535
# Then visit: http://localhost:3535/metrics
````

JSON logs can be enabled with `HATAGO_LOG=json` (respects `HATAGO_LOG_LEVEL`).

````

## Configuration

### Basic Configuration

Create a `hatago.config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/drmikecrowe/hatago-mcp-hub/main/schemas/config.schema.json",
  "version": 1,
  "logLevel": "info",
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
````

### Remote Server Configuration

```json
{
  "mcpServers": {
    "deepwiki": {
      "url": "https://mcp.deepwiki.com/sse",
      "type": "sse"
    },
    "custom-api": {
      "url": "https://api.example.com/mcp",
      "type": "http",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### OAuth-Only Remote Servers (`mcp-remote`)

`url`/`type: "http" | "sse"` only forwards a **static** `headers` map (bearer token, API key) — Hatago has no OAuth client (no dynamic client registration, no browser consent, no token cache). A remote MCP server that requires interactive OAuth, such as Atlassian's hosted MCP endpoint, can't be reached with a bare `url` entry. Bridge it instead by running [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) as a local process via `command`/`args`; it owns the OAuth handshake and token cache, and Hatago talks STDIO to it like any other local server:

```json
{
  "mcpServers": {
    "confluence-internal": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.atlassian.com/v1/mcp",
        "--resource",
        "https://your-org.atlassian.net"
      ],
      "tags": ["atlassian", "confluence"],
      "description": "Internal engineering Confluence (your-org.atlassian.net) — team documentation, onboarding, architecture, and processes. Read-only. ALWAYS invoke the kb-router skill first — it maps intent to the exact right page without manual searching.",
      "instructions": "When answering a question that internal documentation might cover, read the kb-router resource before calling any confluence-internal tool: ListMcpResourcesTool(server=\"confluence-internal\") → URI skill://confluence-internal/kb-router. Follow its instructions. Use confluence-internal search/fetch tools only when the router explicitly falls back to them.",
      "skills": "./skills",
      "tools": {
        "include": ["fetch", "search", "getConfluencePage", "getConfluenceSpaces", "searchConfluenceUsingCql"],
        "overrides": {
          "search": {
            "name": "searchInternal",
            "description": "REQUIRED: Read the kb-router resource first: ListMcpResourcesTool(server=\"confluence-internal\"). Only use this tool as a fallback if the skill instructs it. {description}"
          },
          "fetch": {
            "name": "fetchInternal",
            "description": "Retrieves from the internal engineering Confluence instance. {description}"
          }
        }
      }
    }
  }
}
```

What each field buys you, in the order an agent hits them: `command`/`args` (mcp-remote) is the only way in given the OAuth requirement; `description` is a passive routing hint read via `hatago://servers`; `instructions` is pushed into `initialize.instructions` at connect so the agent is told up front to check the router skill; `skills` holds the actual routing logic as a `skill://confluence-internal/kb-router` resource, pulled on demand instead of bloating the 2KB instructions budget; `tools.overrides` renames `search`/`fetch` and repeats the "read the router first" gate in the tool description itself — the last line of defense if earlier steps were skipped. See [docs/configuration.md](https://github.com/drmikecrowe/hatago-mcp-hub/blob/main/docs/configuration.md) for the full contract on `skills`, `instructions`, and `tools.overrides`.

### Configuration Inheritance

Hatago supports configuration inheritance through the `extends` field:

```json
{
  "extends": "~/.hatago/base.config.json",
  "mcpServers": {
    "local-server": {
      "command": "node",
      "args": ["./server.js"]
    }
  }
}
```

Features:

- Single or multiple parent configs: `"extends": ["./base1.json", "./base2.json"]`
- Path resolution: Supports `~` for home directory, relative and absolute paths
- Deep merging: Child values override parent values
- Environment variable deletion: Use `null` to remove inherited env vars

Example with env override:

```json
{
  "extends": "~/.hatago/global.json",
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_TOKEN": "${WORK_GITHUB_TOKEN}",
        "DEBUG": null
      }
    }
  }
}
```

### Environment Variables

Hatago supports Claude Code-compatible environment variable expansion:

- `${VAR}` - Expands to the value of VAR (error if undefined)
- `${VAR:-default}` - Uses default value if VAR is undefined

Example:

```json
{
  "mcpServers": {
    "api-server": {
      "url": "${API_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

## Features

### 🎯 Core Features

- **Unified Interface**: Single endpoint for multiple MCP servers
- **Tool Name Management**: Automatic collision avoidance with prefixing
- **Session Management**: Independent sessions for multiple AI clients
- **Multi-Transport**: STDIO, HTTP, SSE support

### 🔄 Dynamic Updates

- **Configuration**: Requires restart (use nodemon/PM2 for auto-restart; see Operations in `docs/configuration.md`)
- **Tool List Updates**: Dynamic tool registration with `notifications/tools/list_changed`
- **Progress Notifications**: Real-time operation updates from child servers

### 🧩 Built-in Internal Resource

- `hatago://servers`: Returns a JSON snapshot of currently connected servers and their basic details.

### 🚀 Developer Experience

- **Zero Configuration (HTTP mode)**: Works out of the box without a config file
- **Interactive Setup**: Guided configuration with `hatago init`
- **NPX Ready**: No installation required for basic usage
- **Multi-Runtime**: Supports Node.js and Cloudflare Workers (Bun/Deno: WIP)

## Programmatic Usage

### Node.js API

```typescript
import { startServer } from '@drmikecrowe/hatago-mcp-hub';

// Start server programmatically
await startServer({
  mode: 'stdio',
  config: './hatago.config.json',
  logLevel: 'info'
});
```

### Creating Custom Hub

```typescript
import { createHub } from '@drmikecrowe/hatago-mcp-hub';

const hub = createHub({
  mcpServers: {
    memory: {
      command: 'npx',
      args: ['@modelcontextprotocol/server-memory']
    }
  }
});

// Use hub directly in your application
const tools = await hub.listTools();
```

## Architecture

Hatago uses a modular architecture with platform abstraction:

```
Client (Claude Code, etc.)
    ↓
Hatago Hub (Router + Registry)
    ↓
MCP Servers (Local, NPX, Remote)
```

## Supported MCP Servers

### Local Servers (via command)

- Any executable MCP server
- Python, Node.js, or binary servers
- Custom scripts with MCP protocol

### NPX Servers (via npx)

- `@modelcontextprotocol/server-filesystem`
- `@modelcontextprotocol/server-github`
- `@modelcontextprotocol/server-memory`
- Any npm-published MCP server

### Remote Servers (via HTTP/SSE)

- DeepWiki MCP (`https://mcp.deepwiki.com/sse`)
- Any HTTP-based MCP endpoint
- Custom API servers with MCP protocol

## Troubleshooting

### Common Issues

1. **"No onNotification handler set" warning**
   - This is normal in HTTP mode when using StreamableHTTP transport
   - The hub automatically handles notifications appropriately

2. **Server connection failures**
   - Check environment variables are set correctly
   - Verify remote server URLs are accessible
   - Review logs with `--verbose` flag

3. **Tool name collisions**
   - Hatago automatically prefixes tools with server ID
   - Original tool names are preserved in the hub

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
hatago serve --verbose
```

## Version History

- **v0.0.4** - Config inheritance, timeouts schema, security hardening, docs/tests updates
- **v0.0.3** - Docs and examples update
- **v0.0.2** - Tag-based server filtering with multi-language support
- **v0.0.1** - Initial lightweight release with full MCP support

## License

MIT License

## Contributing

Contributions are welcome! Please see our [GitHub repository](https://github.com/drmikecrowe/hatago-mcp-hub) for more information.

## Links

- [npm Package](https://www.npmjs.com/package/@drmikecrowe/hatago-mcp-hub)
- [GitHub Repository](https://github.com/drmikecrowe/hatago-mcp-hub)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
