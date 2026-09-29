# SimplePlek Bookings Service

[![License](https://img.shields.io/github/license/simpleplek-community/bookings)](LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/simpleplek-community/bookings)](https://github.com/simpleplek-community/bookings/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/simpleplek-community/bookings)](https://github.com/simpleplek-community/bookings/pulls)
[![GitHub Discussions](https://img.shields.io/github/discussions/simpleplek-community/bookings)](https://github.com/simpleplek-community/bookings/discussions)

---

## Project Introduction

**SimplePlek Bookings** is a core microservice within the SimplePlek ecosystem responsible for managing space reservations, calendar scheduling, booking lifecycles, and availability verification. Designed for high throughput and reliability, this service provides API endpoints for creating, managing, updating, and cancelling bookings across various workspace environments.

---

## Vision / Purpose

The vision of SimplePlek is to deliver an open, modular, and developer-friendly workspace management platform. 

The **Bookings Service** aims to:
- **Simplify Scheduling:** Provide seamless, double-booking-proof calendar management and reservation workflows.
- **Ensure Interoperability:** Integrate cleanly with authentication, notification, and resource-management microservices across the SimplePlek ecosystem.
- **Maintain High Performance:** Deliver low-latency availability queries and transactional integrity for high-concurrency booking actions.

---

## Current Capabilities

- 📅 **Reservation Management:** Create, retrieve, modify, and cancel desk, room, or space bookings.
- ⚡ **Real-Time Availability Check:** Query workspace availability across dynamic date and time ranges.
- 🔒 **Conflict Resolution:** Built-in safeguards to prevent double-booking and concurrent state conflicts.
- 🔔 **Event Publishing:** Emits domain events (e.g., `booking.created`, `booking.cancelled`) to trigger notifications and downstream integrations.
- 🔐 **Role-Based Access Control (RBAC):** Restrict booking operations based on user roles (e.g., Member, Manager, Admin).

---

## Architecture

The Bookings service follows a clean, event-driven microservice architecture:
