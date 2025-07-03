# Systema Relica (TypeScript Implementation)

> Semantic modeling platform for relationship-aware knowledge representation

## Implementation Note

This repository contains the **TypeScript implementation** of Systema Relica, designed for active development and broad community adoption. For those interested in the original philosophical implementation, see [systema-relica-clj](https://github.com/corpus-relica/systema-relica-clj).

## Why

Expression begets experience. Yesterday's applications were hamstrung by 1970s data abstraction commitments, and tomorrow's applications won't be best built on those foundations. Now is the time to reconsider fundamental assumptions about how data is organized and addressed in systems. 

The specific problem: the information needed to interpret a database traditionally lives outside it. To empower next generation cognitive applications, we provide a semantic modeling platform that co-locates data with the information needed for its interpretation.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Install

```bash
# Clone the repository
git clone https://github.com/corpus-relica/systema-relica.git
cd systema-relica

# Start all services
docker-compose up --build -d
```

## Usage

After installation, the system will be available at:

- **Portal API**: http://localhost:2204
- **Knowledge Integrator UI**: http://localhost:2205

The platform enables applications to maintain persistent, relationship-aware representations of complex information using the Gellish Ontological Modeling Language.

## Architecture

```
┌─────────────────────────────────────────────┐
│          Frontend Layer                     │
│    Knowledge Integrator (React/Vite)        │
└─────────────────┬───────────────────────────┘
                  │ HTTP/WebSocket
┌─────────────────▼───────────────────────────┐
│          Gateway Layer                      │
│         Portal (API Gateway)                │
└────┬─────┬──────┬──────┬──────┬──────┬─────┘
     │     │      │      │      │      │
┌────▼──┐ ┌▼────┐ ┌▼────┐ ┌▼────┐ ┌▼───┐ ┌▼───┐
│Prism  │ │Arch.│ │Aper.│ │Clar.│ │Shut│ │NOUS│
│System │ │Data │ │Media│ │Sem. │ │Auth│ │ AI │
└───────┘ └─────┘ └─────┘ └─────┘ └────┘ └────┘
     │       │       │       │       │      │
┌────▼───────▼───────▼───────▼───────▼──────▼─┐
│  PostgreSQL │ Neo4j │ Redis │ File Storage  │
└──────────────────────────────────────────────┘
```

### Services

- **Portal**: API gateway and authentication orchestration
- **Archivist**: Data persistence and knowledge graph operations
- **Clarity**: Semantic object mapping and knowledge representation
- **Aperture**: Environment management and media processing
- **NOUS**: AI/ML inference and reasoning (Python)
- **Prism**: System initialization and health monitoring
- **Shutter**: Authentication and security policies

## Project Structure

```
systema-relica/
├── packages/              # TypeScript microservices
│   ├── portal/            # API Gateway
│   ├── archivist/         # Data service
│   ├── clarity/           # Semantic mapper
│   ├── aperture/          # Environment manager
│   ├── prism/             # System coordinator
│   ├── shutter/           # Auth service
│   └── knowledge-integrator/  # Frontend UI
├── packages_py/           # Python services
│   └── nous/              # AI/ML service
├── seed_csv/              # Initial data files
└── docker-compose.yml     # Service orchestration
```

## Contributing

Questions and issues: [GitHub Issues](https://github.com/corpus-relica/systema-relica/issues)

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[GNU General Public License](LICENSE) © Corpus Relica
