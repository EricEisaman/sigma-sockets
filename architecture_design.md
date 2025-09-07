# SigmaSockets Architecture Design

## 1. Overview

SigmaSockets is designed as a high-performance multiplayer system leveraging raw WebSockets and FlatBuffers for efficient binary data transfer. The primary goal is to achieve superior performance compared to existing solutions like µWebSockets.js, while providing robust reconnection handling and a developer-friendly TypeScript interface. The system will consist of a client-side package for integration into Vite-based frontends and a Node.js server-side package.

## 2. Core Principles

*   **Binary Efficiency:** Utilize FlatBuffers for all data serialization to minimize payload size and enable zero-copy deserialization.
*   **Raw WebSocket Control:** Avoid high-level frameworks on the server to maximize control over WebSocket behavior and minimize overhead.
*   **Reliable Reconnection:** Implement a robust reconnection mechanism to ensure continuous connectivity in the face of network interruptions.
*   **Type Safety:** Enforce strict TypeScript typing throughout the codebase to enhance maintainability, reduce bugs, and improve developer experience.
*   **Performance First:** Prioritize low-latency and high-throughput communication through optimized data structures and network handling.

## 3. Architectural Components

### 3.1. SigmaSockets Client Package

The client package will be a TypeScript library designed for easy integration into web applications, particularly those built with Vite. It will handle WebSocket connection management, FlatBuffer serialization/deserialization, and reconnection logic.

### 3.2. SigmaSockets Server Package

The server package will be a Node.js TypeScript library responsible for managing WebSocket connections, handling FlatBuffer messages, and broadcasting data to connected clients. It will be built directly on Node.js's `ws` module or a similar low-level WebSocket implementation to avoid framework overhead.

## 4. Data Serialization with FlatBuffers

FlatBuffers will be the sole mechanism for data serialization between the client and server. This choice is driven by its zero-copy deserialization capability, which significantly reduces CPU and memory overhead compared to JSON or other serialization formats that require parsing and object allocation.

### 4.1. FlatBuffer Schema Definition

All messages exchanged between the client and server will be defined using FlatBuffers schema files (`.fbs`). These schemas will define the structure of data, including messages for connection, disconnection, data transfer, and control signals (e.g., heartbeats).

### 4.2. Code Generation

The FlatBuffers compiler will be used to generate TypeScript classes from the `.fbs` schemas. These generated classes will provide type-safe methods for building and reading FlatBuffer messages, ensuring consistency between client and server.

## 5. Reconnection Handling

Reconnection is a critical feature for a robust multiplayer system. SigmaSockets will implement an automatic reconnection mechanism with exponential backoff to gracefully handle temporary network outages.

### 5.1. Client-Side Reconnection

The client will monitor the WebSocket connection status. Upon disconnection, it will attempt to reconnect after a short delay, increasing the delay exponentially for subsequent attempts up to a maximum threshold. A unique session ID will be used to identify the client across reconnections, allowing the server to resume the client's state if possible.

### 5.2. Server-Side Session Management

The server will maintain a temporary state for disconnected clients for a configurable duration. If a client reconnects within this window with a valid session ID, the server will attempt to restore its previous state. This will involve buffering messages that were sent while the client was disconnected and replaying them upon successful reconnection.

## 6. TypeScript Interfaces

Strict TypeScript interfaces will be defined for all public APIs of both the client and server packages, as well as for internal data structures. This will ensure type safety and provide clear contracts for developers using SigmaSockets.

### 6.1. Client Interfaces

Key client interfaces will include:

*   `SigmaSocketClient`: Represents the main client instance, providing methods for connecting, sending messages, and registering event handlers.
*   `MessageCallback`: A type definition for functions that handle incoming messages, with the message payload typed according to the FlatBuffer schema.
*   `ConnectionStatus`: An enum or union type representing the current connection state (e.g., `Connecting`, `Connected`, `Disconnected`, `Reconnecting`).

### 6.2. Server Interfaces

Key server interfaces will include:

*   `SigmaSocketServer`: Represents the main server instance, providing methods for starting the server, broadcasting messages, and handling client connections/disconnections.
*   `ClientSession`: An interface representing a connected client, including its unique ID and any associated state.
*   `MessageHandler`: A type definition for functions that process incoming client messages.

## 7. Benchmarking Considerations

To prove that SigmaSockets outperforms µWebSockets.js, a dedicated benchmarking suite will be developed. This suite will measure:

*   **Throughput:** Messages per second under various load conditions.
*   **Latency:** Time taken for a message to travel from client to server and back.
*   **CPU Usage:** Server-side CPU consumption under load.
*   **Memory Usage:** Server-side memory consumption under load.

The benchmarks will compare SigmaSockets directly against µWebSockets.js using identical message payloads (serialized with FlatBuffers for both, if µWebSockets.js can be adapted, or a common binary format otherwise) and network conditions. This will ensure a fair comparison of the underlying WebSocket and serialization performance.

