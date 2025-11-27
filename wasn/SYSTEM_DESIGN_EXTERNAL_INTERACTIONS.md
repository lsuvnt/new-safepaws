# System Design Document: External System Interactions

## 1. External System Interactions

### 1.1 Database System (MySQL)
The Safepaws API interacts with a MySQL relational database as its primary data persistence layer.

**Interaction Type:** Direct database connection via connection pool

**Purpose:**
- Store and retrieve cat information (`cats` table)
- Store and retrieve cat location pins (`cat_locations` table)
- Maintain referential integrity between cats and their locations

**Connection Details:**
- **Protocol:** MySQL Protocol (TCP/IP)
- **Port:** 3306 (default, configurable via `DB_PORT`)
- **Connection String Format:** `mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4`
- **Connection Pooling:** Enabled with connection recycling (3600 seconds)
- **Health Checks:** Pre-ping enabled to verify connection validity before use

**Configuration:**
- Database credentials and connection details are loaded from environment variables (`.env` file)
- Supports URL-encoded passwords for special characters
- Uses UTF-8 MB4 character encoding for full Unicode support

### 1.2 Frontend Client Applications
The system exposes REST APIs for frontend web applications to consume.

**Interaction Type:** HTTP/REST API (client-server)

**Purpose:**
- Allow frontend applications to create, read, and delete cat location pins
- Provide real-time location data for mapping and visualization
- Enable cross-origin resource sharing (CORS) for web clients

**Supported Origins:**
- Development: `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:3000`, `http://127.0.0.1:5173`
- Production: Configurable via `CORS_ORIGINS` environment variable
- Current configuration: Allows all origins (`*`) with credentials enabled

---

## 2. APIs

### 2.1 Exposed REST APIs

The system exposes the following REST API endpoints:

#### Base URL
- Development: `http://localhost:8000` (or as configured)
- Production: Configurable via deployment environment

#### API Endpoints

**1. Root Endpoint**
- **Path:** `GET /`
- **Purpose:** Health check and API availability verification
- **Response:** `{"message": "Safepaws backend is running successfully!"}`

**2. Health Check Endpoint**
- **Path:** `GET /healthz`
- **Purpose:** Comprehensive health check including database connectivity
- **Response:** `{"ok": true}` (only if database connection is successful)
- **Error Handling:** Returns 500 if database connection fails

**3. Pins Management Endpoints**

| Method | Path | Purpose | Request Body | Response |
|--------|------|---------|--------------|----------|
| `GET` | `/pins/` | List all location pins | None | Array of `PinOut` objects (max 100, ordered by ID desc) |
| `POST` | `/pins/` | Create a new location pin | `PinIn` object | `PinOut` object (201 status) |
| `DELETE` | `/pins/{pin_id}` | Delete a location pin | None | 204 No Content |

**Request/Response Models:**

```python
# PinIn (POST /pins/)
{
  "cat_id": int (>= 1),
  "latitude": float,
  "longitude": float
}

# PinOut (GET /pins/, POST /pins/)
{
  "location_id": int,
  "cat_id": int,
  "latitude": float,
  "longitude": float,
  "created_at": string (ISO timestamp) | null
}
```

**Error Responses:**
- `404 Not Found`: Cat not found (when creating pin) or Pin not found (when deleting)
- `500 Internal Server Error`: Database operation failure
- `422 Unprocessable Entity`: Validation error (invalid request format)

### 2.2 API Communication Protocol

**Protocol:** HTTP/1.1 and HTTP/2 (as supported by Uvicorn)

**Data Format:**
- **Request/Response:** JSON (application/json)
- **Content-Type:** `application/json`
- **Character Encoding:** UTF-8

**HTTP Methods Supported:**
- GET: Retrieve resources
- POST: Create new resources
- DELETE: Remove resources

**CORS Headers:**
- `Access-Control-Allow-Origin`: Configurable (currently `*`)
- `Access-Control-Allow-Methods`: `*` (all methods)
- `Access-Control-Allow-Headers`: `*` (all headers)
- `Access-Control-Allow-Credentials`: `true`

**Authentication:**
- Currently: None (open API)
- Future: Can be extended with JWT tokens, API keys, or OAuth2

---

## 3. Libraries and Dependencies

### 3.1 Core Framework Libraries

**FastAPI (v0.104.1)**
- **Purpose:** Modern, high-performance web framework for building REST APIs
- **Usage:** 
  - API route definition and request handling
  - Automatic OpenAPI/Swagger documentation generation
  - Request validation and serialization
  - Dependency injection for database sessions
- **Key Features Used:**
  - APIRouter for modular endpoint organization
  - Pydantic models for request/response validation
  - CORS middleware for cross-origin requests
  - Exception handling middleware

**Uvicorn (v0.24.0)**
- **Purpose:** ASGI server for running FastAPI applications
- **Usage:** Production-ready HTTP server with WebSocket support
- **Features:** Standard implementation with performance optimizations

### 3.2 Database Libraries

**SQLAlchemy (v2.0.23)**
- **Purpose:** Python SQL toolkit and Object-Relational Mapping (ORM)
- **Usage:**
  - Database connection management and connection pooling
  - ORM models for `Cat` and `CatLocation` entities
  - Query building and execution
  - Transaction management
- **Key Features Used:**
  - Declarative base for model definition
  - Session management with dependency injection
  - Connection pooling with automatic recycling
  - Pre-ping for connection health checks

**mysql-connector-python (v8.2.0)**
- **Purpose:** MySQL database driver for Python
- **Usage:** Low-level database connectivity for SQLAlchemy
- **Protocol:** MySQL Protocol over TCP/IP
- **Features:** UTF-8 MB4 support, connection pooling compatibility

### 3.3 Data Validation and Configuration

**Pydantic (v2.5.0)**
- **Purpose:** Data validation using Python type annotations
- **Usage:**
  - Request/response model validation (`PinIn`, `PinOut`)
  - Field validation (e.g., `cat_id >= 1`)
  - Automatic JSON serialization/deserialization
  - Type coercion and validation

**python-dotenv (v1.0.0)**
- **Purpose:** Load environment variables from `.env` files
- **Usage:** Configuration management for database credentials and CORS settings
- **Configuration Variables:**
  - `DB_USER`: Database username
  - `DB_PASSWORD`: Database password
  - `DB_HOST`: Database host (default: 127.0.0.1)
  - `DB_PORT`: Database port (default: 3306)
  - `DB_NAME`: Database name (default: safepaws)
  - `CORS_ORIGINS`: Comma-separated list of allowed origins

### 3.4 Standard Library Dependencies

**Python Standard Library:**
- `os`: Environment variable access
- `pathlib.Path`: File path management for `.env` file location
- `urllib.parse.quote_plus`: URL encoding for database passwords
- `typing`: Type hints for function signatures and models

### 3.5 Frontend Dependencies

The Safepaws frontend application is built using React and modern web development tools.

#### 3.5.1 Core Framework Libraries

**React (v18.2.0)**
- **Purpose:** JavaScript library for building user interfaces
- **Usage:**
  - Component-based UI architecture
  - State management with hooks (useState, useEffect, useRef)
  - Virtual DOM for efficient rendering
  - Component lifecycle management
- **Key Features Used:**
  - Functional components with hooks
  - React Router for client-side routing
  - Event handling and state updates
  - Conditional rendering

**React DOM (v18.2.0)**
- **Purpose:** React renderer for web browsers
- **Usage:** Rendering React components to the DOM
- **Features:** Server-side rendering support, hydration

**React Router DOM** (used but not explicitly in package.json - should be added)
- **Purpose:** Declarative routing for React applications
- **Usage:**
  - Client-side navigation between pages
  - Route protection and navigation guards
  - URL parameter handling
- **Components Used:**
  - `BrowserRouter`: Router component for browser history
  - `Routes` and `Route`: Route definition and matching
  - `Link`: Navigation links
  - `Navigate`: Programmatic navigation
  - `useLocation`: Hook for accessing current location

#### 3.5.2 Build Tools and Development Dependencies

**Vite (v7.2.2)**
- **Purpose:** Next-generation frontend build tool and development server
- **Usage:**
  - Fast development server with Hot Module Replacement (HMR)
  - Production build optimization
  - ES module support
- **Features:**
  - Lightning-fast cold start
  - Instant HMR
  - Optimized production builds
  - Native ES modules support

**@vitejs/plugin-react (v4.2.1)**
- **Purpose:** Vite plugin for React support
- **Usage:** Enables JSX transformation and React Fast Refresh
- **Configuration:** Handles `.js` and `.jsx` file extensions

**TypeScript Type Definitions:**
- **@types/react (v18.2.43)**: TypeScript definitions for React
- **@types/react-dom (v18.2.17)**: TypeScript definitions for React DOM
- **Purpose:** Type safety and IntelliSense support in development

#### 3.5.3 Styling Libraries

**Tailwind CSS (v3.4.0)**
- **Purpose:** Utility-first CSS framework
- **Usage:**
  - Rapid UI development with utility classes
  - Responsive design utilities
  - Custom theme configuration
- **Features:**
  - Utility classes for spacing, colors, typography
  - Responsive breakpoints
  - Custom configuration via `tailwind.config.js`
  - JIT (Just-In-Time) compilation for optimal bundle size

**PostCSS (v8.4.32)**
- **Purpose:** CSS transformation tool
- **Usage:** Processing Tailwind CSS and applying plugins
- **Configuration:** Used with Tailwind and Autoprefixer

**Autoprefixer (v10.4.16)**
- **Purpose:** Automatically adds vendor prefixes to CSS
- **Usage:** Ensures cross-browser compatibility for CSS properties
- **Integration:** Works with PostCSS and Tailwind CSS

#### 3.5.4 External Service Libraries

**Mapbox GL JS (v3.16.0)**
- **Purpose:** Interactive maps and location visualization
- **Usage:**
  - Display interactive maps with custom markers
  - Render cat location pins on map
  - Provide navigation controls and popups
- **API Integration:**
  - Requires Mapbox access token (`VITE_MAPBOX_TOKEN`)
  - Uses Mapbox Styles API for map rendering
  - Mapbox GL WebGL rendering for performance
- **Features Used:**
  - Map initialization and configuration
  - Custom markers for cat locations
  - Popups with location information
  - Navigation controls (zoom, rotation)
  - ResizeObserver for responsive map sizing

**dotenv (v17.2.3)**
- **Purpose:** Load environment variables in frontend applications
- **Usage:** Accessing configuration values via `import.meta.env`
- **Note:** In Vite, environment variables are accessed via `import.meta.env` rather than `process.env`

---

## 4. Frontend APIs and External Services

### 4.1 Backend API Integration

The frontend communicates with the Safepaws backend API through a dedicated service layer.

**API Service Module:** `src/services/api.js`

**Base URL Configuration:**
- Default: `http://localhost:8000`
- Configurable via environment variable: `VITE_API_BASE_URL`
- Supports different endpoints for development and production

**API Functions:**

#### 4.1.1 Fetch Pins
- **Function:** `fetchPins()`
- **HTTP Method:** `GET`
- **Endpoint:** `/pins/`
- **Purpose:** Retrieve all cat location pins from the backend
- **Returns:** Promise resolving to array of pin objects
- **Error Handling:**
  - Distinguishes between connection errors and server errors
  - Provides specific error messages for database issues
  - Falls back to health check endpoint for diagnostics

#### 4.1.2 Create Pin
- **Function:** `createPin(pinData)`
- **HTTP Method:** `POST`
- **Endpoint:** `/pins/`
- **Request Body:**
  ```javascript
  {
    cat_id: number,
    latitude: number,
    longitude: number
  }
  ```
- **Headers:** `Content-Type: application/json`
- **Returns:** Promise resolving to created pin object
- **Error Handling:** Extracts error details from response

#### 4.1.3 Delete Pin
- **Function:** `deletePin(pinId)`
- **HTTP Method:** `DELETE`
- **Endpoint:** `/pins/{pin_id}`
- **Purpose:** Remove a location pin by ID
- **Returns:** Promise resolving to void
- **Status Code:** 204 No Content on success

#### 4.1.4 Health Check
- **Function:** `checkBackendHealth()`
- **HTTP Method:** `GET`
- **Endpoint:** `/healthz`
- **Purpose:** Verify backend availability and database connectivity
- **Returns:** Promise resolving to boolean

**API Communication Details:**
- **Protocol:** HTTP/1.1
- **Data Format:** JSON (application/json)
- **Error Handling:** Comprehensive error detection and user-friendly messages
- **Polling:** Automatic refresh of pins every 30 seconds in MapPage component

### 4.2 Mapbox API Integration

**Service:** Mapbox Maps API

**Purpose:** Interactive map rendering and location visualization

**API Endpoints Used:**
- **Map Styles API:** `mapbox://styles/mapbox/streets-v12`
  - Retrieves map tile styles
  - Provides street map visualization
- **Map Tiles API:** Tile requests for map rendering
  - Served via CDN
  - WebGL-based rendering

**Authentication:**
- **Method:** Access token authentication
- **Token Location:** Environment variable `VITE_MAPBOX_TOKEN`
- **Token Type:** Public token (for client-side usage)
- **Security:** Token should be restricted to specific domains in production

**Features Used:**
- **Map Initialization:**
  - Default center: New York City coordinates `[-73.935242, 40.73061]`
  - Default zoom level: 11
  - Container-based rendering
- **Markers:**
  - Custom HTML markers for cat locations
  - Styled with CSS (red circular markers)
  - Popups with location details
- **Controls:**
  - Navigation controls (zoom, rotation, pitch)
  - Positioned at top-right of map
- **Responsive Behavior:**
  - ResizeObserver for automatic map resizing
  - Handles container dimension changes

**Data Flow:**
1. Frontend fetches pin data from backend API
2. Pin coordinates (latitude/longitude) are extracted
3. Mapbox GL JS creates markers at specified coordinates
4. Markers are added to map with popup information
5. Map updates automatically when new pins are received

**Communication Protocol:**
- **HTTPS:** All Mapbox API requests use HTTPS
- **CDN:** Map tiles served via Mapbox CDN
- **WebGL:** Client-side rendering using WebGL for performance

**Rate Limits:**
- Mapbox free tier includes monthly request limits
- Production applications should monitor usage
- Consider caching strategies for high-traffic scenarios

### 4.3 Browser APIs Used

**Fetch API**
- **Purpose:** HTTP requests to backend API
- **Usage:** Native browser API for AJAX requests
- **Features:**
  - Promise-based asynchronous requests
  - Automatic JSON parsing
  - Error handling via response status codes

**ResizeObserver API**
- **Purpose:** Monitor map container size changes
- **Usage:** Automatically resize map when container dimensions change
- **Browser Support:** Modern browsers (Chrome 64+, Firefox 69+, Safari 13.1+)

**WebGL API**
- **Purpose:** Hardware-accelerated map rendering
- **Usage:** Used by Mapbox GL JS for map rendering
- **Performance:** GPU-accelerated graphics for smooth map interactions

**DOM API**
- **Purpose:** Direct DOM manipulation for markers
- **Usage:** Creating custom marker elements
- **Methods:** `createElement`, `appendChild`, `setAttribute`

**History API**
- **Purpose:** Browser history management
- **Usage:** Used by React Router for client-side navigation
- **Features:** Push state, replace state, pop state events

### 4.4 Environment Variables

**Frontend Configuration Variables:**

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` | No |
| `VITE_MAPBOX_TOKEN` | Mapbox access token | None | Yes (for map functionality) |

**Note:** Vite requires environment variables to be prefixed with `VITE_` to be exposed to client-side code.

---

## 5. Hardware Devices

**Current Implementation:** None

The system is a software-only application that does not directly interact with hardware devices. However, the system is designed to receive location data (latitude/longitude coordinates) that may originate from:

**Potential Future Hardware Integration:**
- **GPS Devices:** Cat collars or tracking devices that transmit location coordinates
- **Mobile Devices:** Smartphones or tablets used by users to report cat locations
- **IoT Sensors:** Environmental sensors or beacons for location tracking

**Note:** The current system accepts location data via API calls but does not directly interface with hardware. All hardware interactions would be abstracted through client applications or middleware services.

---

## 6. Communication Protocols

### 5.1 Application Layer Protocols

**HTTP/HTTPS (Hypertext Transfer Protocol)**
- **Version:** HTTP/1.1 (with HTTP/2 support via Uvicorn)
- **Port:** 8000 (default, configurable)
- **Usage:** Primary protocol for REST API communication
- **Security:** Currently HTTP (can be upgraded to HTTPS with SSL/TLS certificates)
- **Methods:** GET, POST, DELETE
- **Status Codes:**
  - `200 OK`: Successful GET request
  - `201 Created`: Successful POST request
  - `204 No Content`: Successful DELETE request
  - `404 Not Found`: Resource not found
  - `422 Unprocessable Entity`: Validation error
  - `500 Internal Server Error`: Server error

### 5.2 Database Communication Protocol

**MySQL Protocol**
- **Type:** Binary protocol over TCP/IP
- **Port:** 3306 (default, configurable)
- **Transport:** TCP/IP connection
- **Authentication:** Username/password authentication
- **Character Set:** UTF-8 MB4 (supports full Unicode including emojis)
- **Connection Management:**
  - Connection pooling for efficient resource usage
  - Connection recycling every 3600 seconds
  - Pre-ping mechanism to verify connection health
  - Automatic reconnection on connection loss

### 5.3 Data Serialization

**JSON (JavaScript Object Notation)**
- **Format:** RFC 7159 compliant JSON
- **Usage:** Request and response payload serialization
- **Encoding:** UTF-8
- **Content-Type:** `application/json`
- **Features:**
  - Automatic serialization/deserialization via Pydantic
  - Type validation and coercion
  - Error messages in JSON format

### 5.4 Network Protocols

**TCP/IP (Transmission Control Protocol/Internet Protocol)**
- **Usage:** 
  - HTTP requests/responses between clients and API server
  - Database connections between API server and MySQL
- **Reliability:** Connection-oriented, ensures data delivery
- **Flow Control:** Built-in congestion control and error recovery

**CORS (Cross-Origin Resource Sharing)**
- **Type:** HTTP header-based protocol
- **Purpose:** Enable secure cross-origin requests from web browsers
- **Headers Used:**
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods`
  - `Access-Control-Allow-Headers`
  - `Access-Control-Allow-Credentials`
- **Preflight:** Automatic handling of OPTIONS requests

---

## 7. System Integration Diagram

```
┌─────────────────────────────────────────┐
│      Frontend Web Application          │
│         (React + Vite)                 │
│                                         │
│  ┌──────────────┐  ┌────────────────┐ │
│  │  React App   │  │  Mapbox GL JS  │ │
│  │  Components  │  │   (Maps API)   │ │
│  └──────┬───────┘  └────────┬───────┘ │
│         │                   │          │
│         │ API Service       │ HTTPS    │
│         │ (api.js)          │          │
└─────────┼───────────────────┼──────────┘
          │                   │
          │ HTTP/HTTPS        │ HTTPS
          │ (REST API)        │ (Mapbox API)
          │ JSON              │ Map Tiles
          │ Port: 8000        │ CDN
          │                   │
          ▼                   ▼
┌─────────────────┐   ┌─────────────────┐
│  Safepaws API   │   │   Mapbox API    │
│   (FastAPI +    │   │   (External)    │
│    Uvicorn)     │   │                 │
└────────┬────────┘   └─────────────────┘
         │
         │ MySQL Protocol
         │ TCP/IP
         │ Port: 3306
         ▼
┌─────────────────┐
│   MySQL Database│
│   (External DB) │
└─────────────────┘
```

---

## 8. Future Integration Considerations

### 8.1 Potential External Services
- **Authentication Service:** OAuth2 providers (Google, Facebook, etc.)
- **Additional Mapping Services:** Google Maps API as alternative to Mapbox
- **Notification Services:** Email/SMS services for alerts
- **File Storage:** AWS S3, Azure Blob Storage for image uploads
- **Monitoring:** Application performance monitoring (APM) tools
- **Analytics:** Google Analytics, Mixpanel for user behavior tracking

### 8.2 Protocol Enhancements
- **HTTPS/TLS:** SSL/TLS encryption for secure data transmission
- **WebSocket:** Real-time bidirectional communication for live location updates
- **GraphQL:** Alternative API protocol for flexible data querying
- **gRPC:** High-performance RPC protocol for microservices communication
- **Server-Sent Events (SSE):** One-way server-to-client streaming for real-time updates

---

## 9. Security Considerations

### 9.1 Current Security Measures
- Environment variable-based configuration (credentials not in code)
- SQL injection prevention via SQLAlchemy ORM
- Input validation via Pydantic models
- CORS configuration for origin control

### 9.2 Recommended Enhancements
- HTTPS/TLS encryption for all communications
- API authentication and authorization
- Rate limiting to prevent abuse
- Database connection encryption (SSL/TLS)
- Input sanitization and output encoding
- Security headers (HSTS, CSP, etc.)
- Mapbox token domain restrictions
- Environment variable validation
- Content Security Policy (CSP) for XSS protection
- CORS origin restrictions in production (currently allows all origins)

---

## 10. Map Module Design

### 10.1 High-Level Description

The Map Module is a React component that provides an interactive map interface for visualizing cat location data. It integrates Mapbox GL JS for map rendering and displays location pins (markers) representing cat sightings on a geographic map. The module automatically fetches location data from the backend API and updates the map visualization in real-time through periodic polling. Users can interact with the map by zooming, panning, and clicking on markers to view detailed information about each cat location.

**Key Responsibilities:**
- Initialize and render an interactive map using Mapbox GL JS
- Fetch cat location data from the backend API
- Display location pins as visual markers on the map
- Provide popup information when markers are clicked
- Automatically refresh location data at regular intervals
- Handle error states and loading indicators
- Maintain responsive map sizing when container dimensions change

### 10.2 Inputs

**Configuration Inputs:**
- **Mapbox Access Token** (`VITE_MAPBOX_TOKEN`): Environment variable containing the Mapbox API access token required for map rendering
- **API Base URL** (`VITE_API_BASE_URL`): Optional environment variable specifying the backend API endpoint (defaults to `http://localhost:8000`)

**Runtime Inputs:**
- **Map Container Element**: DOM element reference where the map will be rendered (provided via React ref)
- **Map Configuration**:
  - Default center coordinates: `[-73.935242, 40.73061]` (New York City)
  - Default zoom level: `11`
  - Map style: `mapbox://styles/mapbox/streets-v12`

**Data Inputs:**
- **Pin Data Array**: JSON array of pin objects received from the backend API, each containing:
  - `location_id`: Unique identifier for the location
  - `cat_id`: Identifier of the associated cat
  - `latitude`: Geographic latitude coordinate (float)
  - `longitude`: Geographic longitude coordinate (float)
  - `created_at`: Timestamp when the location was recorded (optional string)

### 10.3 Outputs

**Visual Outputs:**
- **Interactive Map**: Rendered Mapbox GL map with street view styling
- **Location Markers**: Red circular markers positioned at each cat location coordinate
  - Marker styling: 20px diameter, red background (#EF4444), white border, shadow effect
- **Marker Popups**: Information popups displayed when markers are clicked, showing:
  - Cat ID
  - Location ID
  - Timestamp of when the location was added (formatted as localized date/time)
- **Navigation Controls**: Zoom and rotation controls positioned at the top-right of the map
- **Status Indicators**: Text messages displayed in the header showing:
  - Loading state: "Loading pins..."
  - Error state: Specific error messages (connection errors, database errors, etc.)
  - Empty state: "No pins found. Backend is connected."
  - Success state: Count of pins displayed (e.g., "5 pins on map")

**State Outputs:**
- **Loading State**: Boolean flag indicating data fetch in progress
- **Error State**: Error message string or null
- **Pins State**: Array of pin objects currently displayed on the map

**Side Effects:**
- HTTP GET requests to `/pins/` endpoint every 30 seconds
- Map tile requests to Mapbox CDN for map rendering
- DOM manipulation for marker creation and management
- Browser console logging for debugging and error tracking

### 10.4 Module Interactions

**Dependencies and Interactions:**

1. **API Service Module** (`src/services/api.js`)
   - **Interaction Type:** Direct function import
   - **Function Used:** `fetchPins()`
   - **Purpose:** Retrieves cat location data from the backend
   - **Communication:** HTTP GET requests to backend API
   - **Frequency:** On component mount and every 30 seconds thereafter
   - **Error Handling:** Catches and processes API errors, distinguishes between connection and server errors

2. **React Router Module** (`react-router-dom`)
   - **Interaction Type:** Route configuration
   - **Route Path:** `/map`
   - **Purpose:** Provides navigation to the map page
   - **Integration:** MapPage is registered as a route in the application router
   - **Layout:** Wrapped in Layout component for consistent page structure

3. **Layout Module** (`src/components/Layout.js`)
   - **Interaction Type:** Component wrapper
   - **Purpose:** Provides consistent page layout with sidebar navigation
   - **Integration:** MapPage is rendered as a child component within Layout
   - **Responsive Behavior:** Map automatically resizes when layout dimensions change

4. **Mapbox GL JS Library** (`mapbox-gl`)
   - **Interaction Type:** External library integration
   - **Purpose:** Provides map rendering and interaction capabilities
   - **Initialization:** Creates Mapbox Map instance on component mount
   - **Features Used:**
     - Map rendering with custom style
     - Marker creation and management
     - Popup creation and display
     - Navigation controls
     - Map resize functionality
   - **Communication:** HTTPS requests to Mapbox API for map tiles and styles

5. **React Framework** (`react`)
   - **Interaction Type:** Core framework
   - **Hooks Used:**
     - `useState`: Manages pins data, loading state, and error state
     - `useEffect`: Handles side effects (data fetching, map initialization, marker updates)
     - `useRef`: Stores references to DOM elements and Mapbox map instance
   - **Purpose:** Component lifecycle management and state handling

6. **Browser APIs**
   - **ResizeObserver API**: Monitors map container size changes and triggers map resize
   - **Fetch API**: Used indirectly through API service for HTTP requests
   - **DOM API**: Creates and manipulates marker elements

**Data Flow:**
```
User Navigation → React Router → Layout Component → MapPage Component
                                                           ↓
                                                    Component Mount
                                                           ↓
                                    ┌──────────────────────┴──────────────────────┐
                                    ↓                                              ↓
                            API Service Module                            Mapbox GL JS
                            (fetchPins)                                    (Map Init)
                                    ↓                                              ↓
                            Backend API                                    Mapbox API
                            (GET /pins/)                                   (Map Tiles)
                                    ↓                                              ↓
                            Pin Data Array                          Map Rendered
                                    ↓                                              ↓
                                    └──────────────────────┬──────────────────────┘
                                                           ↓
                                                    Marker Creation
                                                           ↓
                                                    Map Display
                                                           ↓
                                                    User Interaction
                                                           ↓
                                                    (Auto-refresh every 30s)
```

**Error Handling Interactions:**
- API errors are caught and displayed to users with specific error messages
- Missing Mapbox token prevents map initialization and shows configuration message
- Network errors trigger connection error messages
- Database errors trigger server error messages with troubleshooting hints

**Lifecycle Interactions:**
- **Mount:** Fetches initial pin data and initializes map
- **Update:** Updates markers when pin data changes
- **Unmount:** Cleans up map instance, removes markers, disconnects observers, and clears intervals

